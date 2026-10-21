import type { Agent } from "./types";
/** What each role can see and do. Demo only: there is no real login yet. */
export function permissions(role: Agent["role"] | undefined) {
  return {
    /** Set markup, discounts and supplier costs. */
    canPrice: role === "Owner" || role === "Sales",
    /** See costs and profit. Ticketing and Visa don't need them. */
    canSeeMargins: role === "Owner" || role === "Sales",
    /** Salary tab and everyone's pay. */
    canSeeSalary: role === "Owner",
  };
}
/** Which Home jobs each role handles. The owner sees everything. */
export const jobTypesFor: Record<
  Agent["role"],
  ("service" | "payment" | "quote" | "visa")[]
> = {
  Owner: ["service", "payment", "quote", "visa"],
  Sales: ["payment", "quote"],
  Ticketing: ["service"],
  Visa: ["visa"],
};
export function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
