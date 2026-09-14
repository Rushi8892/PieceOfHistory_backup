import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  CreatePaymentOrderBody,
  CreatePaymentOrderResponse,
  ReceiveRazorpayWebhookHeader,
  ReceiveRazorpayWebhookResponse,
} from "@workspace/api-zod";
import {
  db,
  paymentWebhookEventsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuthenticatedLocalUser } from "../lib/authenticated-user";
import {
  createRazorpayClient,
  razorpayKeyId,
  type RazorpayClient,
} from "../lib/razorpay";
import {
  settleCapturedPayment,
  type CapturedPayment,
} from "../lib/payment-settlement";
import {
  createPaymentOrderForStory,
  PaymentOrderError,
} from "../lib/payment-orders";

const router: IRouter = Router();
let razorpayClientFactory: () => RazorpayClient = createRazorpayClient;

/** Test and non-production callers can provide a no-network Razorpay adapter. */
export function setRazorpayClientFactory(
  factory: () => RazorpayClient,
): void {
  razorpayClientFactory = factory;
}

export async function settleAndRecordPaymentWebhook(
  database: any,
  eventId: string,
  eventType: string,
  payment: CapturedPayment,
): Promise<"captured" | "replayed" | "ignored" | "unknown_order"> {
  const result = await settleCapturedPayment(database, payment);
  if (result === "unknown_order") return result;
  await database
    .insert(paymentWebhookEventsTable)
    .values({ eventId, eventType })
    .onConflictDoNothing({ target: paymentWebhookEventsTable.eventId });
  return result;
}

router.post("/payments/orders", async (req, res): Promise<void> => {
  const user = await getAuthenticatedLocalUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const parsed = CreatePaymentOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const response = await createPaymentOrderForStory(
      db,
      {
        userId: user.id,
        storyId: parsed.data.storyId,
        amountCents: parsed.data.amountCents,
      },
      razorpayClientFactory(),
      razorpayKeyId(),
    );
    res.status(201).json(CreatePaymentOrderResponse.parse(response));
  } catch (error) {
    if (error instanceof PaymentOrderError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

function signatureMatches(rawBody: Buffer, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    actual.length === expectedBuffer.length &&
    timingSafeEqual(actual, expectedBuffer)
  );
}

export function capturedPaymentFromEvent(
  eventType: string,
  payload: Record<string, unknown>,
  eventCreatedAt: unknown,
): {
  orderId: string;
  paymentId: string;
  amountCents: number;
  currency: string;
  capturedAt: Date;
} | null {
  if (eventType !== "payment.captured" && eventType !== "order.paid") {
    return null;
  }
  const payment = (
    (payload.payment as Record<string, unknown> | undefined)?.entity ??
    {}
  ) as Record<string, unknown>;
  const order = (
    (payload.order as Record<string, unknown> | undefined)?.entity ?? {}
  ) as Record<string, unknown>;
  if (payment.status && payment.status !== "captured") return null;
  const orderId = String(payment.order_id ?? order.id ?? "");
  const paymentId = String(payment.id ?? "");
  const amountCents = Number(payment.amount ?? order.amount);
  const currency = String(payment.currency ?? order.currency ?? "");
  const capturedSeconds = Number(eventCreatedAt);
  const paymentAmount = payment.amount == null ? null : Number(payment.amount);
  const orderAmount = order.amount == null ? null : Number(order.amount);
  const paymentCurrency =
    payment.currency == null ? null : String(payment.currency);
  const orderCurrency = order.currency == null ? null : String(order.currency);
  if (
    !orderId ||
    !paymentId ||
    !Number.isInteger(amountCents) ||
    !currency ||
    !Number.isSafeInteger(capturedSeconds) ||
    capturedSeconds < 0 ||
    (payment.order_id != null && order.id != null && payment.order_id !== order.id) ||
    (paymentAmount != null && orderAmount != null && paymentAmount !== orderAmount) ||
    (paymentCurrency != null &&
      orderCurrency != null &&
      paymentCurrency !== orderCurrency)
  ) {
    return null;
  }
  const capturedAt = new Date(capturedSeconds * 1000);
  if (Number.isNaN(capturedAt.getTime())) return null;
  return {
    orderId,
    paymentId,
    amountCents,
    currency,
    capturedAt,
  };
}

router.post(
  "/payments/razorpay/webhook",
  async (req, res): Promise<void> => {
    const rawBody = req.body;
    const headers = ReceiveRazorpayWebhookHeader.safeParse({
      "X-Razorpay-Signature": req.get("X-Razorpay-Signature") ?? "",
      "x-razorpay-event-id": req.get("x-razorpay-event-id") ?? "",
    });
    if (
      !Buffer.isBuffer(rawBody) ||
      !headers.success ||
      !signatureMatches(rawBody, headers.data["X-Razorpay-Signature"]) ||
      !headers.data["x-razorpay-event-id"]
    ) {
      res.status(400).json({ error: "Invalid Razorpay webhook signature." });
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
    } catch {
      res.status(400).json({ error: "Invalid webhook JSON." });
      return;
    }
    const eventType = typeof body.event === "string" ? body.event : "";
    const eventId = headers.data["x-razorpay-event-id"];
    const [alreadyProcessed] = await db
      .select({ id: paymentWebhookEventsTable.id })
      .from(paymentWebhookEventsTable)
      .where(eq(paymentWebhookEventsTable.eventId, eventId))
      .limit(1);
    if (alreadyProcessed) {
      res.json(ReceiveRazorpayWebhookResponse.parse({}));
      return;
    }
    const capturedPayment = capturedPaymentFromEvent(
      eventType,
      (body.payload ?? {}) as Record<string, unknown>,
      body.created_at,
    );
    if (
      (eventType === "payment.captured" || eventType === "order.paid") &&
      !capturedPayment
    ) {
      // Do not record a recognized capture event that could not be settled;
      // the provider should retry it rather than losing it permanently.
      res.status(400).json({ error: "Incomplete captured payment event." });
      return;
    }
    if (capturedPayment) {
      const result = await settleAndRecordPaymentWebhook(
        db,
        eventId,
        eventType,
        capturedPayment,
      );
      req.log.info(
        { eventId, orderId: capturedPayment.orderId, result },
        "Processed Razorpay payment webhook",
      );
      if (result === "unknown_order") {
        res.status(503).json({ error: "Payment order is not known yet." });
        return;
      }
    } else {
      // Irrelevant events have no settlement work and can be marked
      // immediately. Captured events are recorded by the helper only after
      // settlement returns successfully.
      await db
        .insert(paymentWebhookEventsTable)
        .values({ eventId, eventType })
        .onConflictDoNothing({ target: paymentWebhookEventsTable.eventId });
    }
    res.json(ReceiveRazorpayWebhookResponse.parse({}));
  },
);

export default router;