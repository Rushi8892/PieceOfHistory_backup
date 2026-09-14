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
  };
}

export function razorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new Error("RAZORPAY_KEY_ID must be configured.");
  return keyId;
}