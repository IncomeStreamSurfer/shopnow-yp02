import Stripe from "stripe";

const STRIPE_KEY = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "";

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (_stripe) return _stripe;
  _stripe = new Stripe(STRIPE_KEY, { apiVersion: "2025-03-31.basil" as any });
  return _stripe;
}
