import type { CapturedPayment } from "./payment-settlement";

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: "USD";
}

export interface RazorpayClient {
  createOrder(input: {
    amountCents: number;
    receipt: string;
  }): Promise<RazorpayOrder>;
  fetchCapturedPayments?(orderId: string): Promise<CapturedPayment[]>;
}

export function createRazorpayClient(): RazorpayClient {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured.",
    );
  }

  return {
    async createOrder({ amountCents, receipt }): Promise<RazorpayOrder> {
      const authorization = Buffer.from(`${keyId}:${keySecret}`).toString(
        "base64",
      );
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountCents,
          currency: "USD",
          receipt,
        }),
      });
      if (!response.ok) {
        throw new Error(`Razorpay order creation failed (${response.status}).`);
      }
      const data = (await response.json()) as {
        id?: string;
        amount?: number;
        currency?: string;
      };
      if (
        !data.id ||
        data.amount !== amountCents ||
        data.currency !== "USD"
      ) {
        throw new Error("Razorpay returned an invalid USD order.");
      }
      return { id: data.id, amount: data.amount, currency: "USD" };
    },
    async fetchCapturedPayments(orderId): Promise<CapturedPayment[]> {
      const authorization = Buffer.from(`${keyId}:${keySecret}`).toString(
        "base64",
      );
      const response = await fetch(
        `https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}/payments?count=100`,
        { headers: { Authorization: `Basic ${authorization}` } },
      );
      if (!response.ok) {
        throw new Error(
          `Razorpay payment reconciliation failed (${response.status}).`,
        );
      }

      const data = (await response.json()) as {
        items?: Array<Record<string, unknown>>;
      };
      if (!Array.isArray(data.items)) {
        throw new Error("Razorpay returned an invalid order payment list.");
      }

      return data.items.flatMap((item) => {
        if (item.status !== "captured") return [];
        const paymentId = typeof item.id === "string" ? item.id : "";
        const returnedOrderId =
          typeof item.order_id === "string" ? item.order_id : "";
        const amountCents = Number(item.amount);
        const currency = typeof item.currency === "string" ? item.currency : "";
        const capturedSeconds = Number(item.captured_at);
        if (
          !paymentId ||
          returnedOrderId !== orderId ||
          !Number.isSafeInteger(amountCents) ||
          !Number.isSafeInteger(capturedSeconds) ||
          capturedSeconds <= 0 ||
          !currency
        ) {
          throw new Error("Razorpay returned an invalid captured payment.");
        }

        return [{
          orderId: returnedOrderId,
          paymentId,
          amountCents,
          currency,
          capturedAt: new Date(capturedSeconds * 1000),
        }];
      });
    },
  };
}

export function razorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new Error("RAZORPAY_KEY_ID must be configured.");
  return keyId;
}