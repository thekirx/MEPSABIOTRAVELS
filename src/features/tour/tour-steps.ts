/**
 * The guided tour for agency owners and new staff. Plain words, one idea per
 * step. Each step may open a page (`href`) and point at the first element that
 * matches one of `targets`. The tour only shows things; it never changes data.
 */
export type TourStep = {
  title: string;
  body: string;
  href?: string;
  targets?: string[];
};

export const tourSteps: TourStep[] = [
  {
    title: "Welcome to TravelOS",
    body: "This is MEP's team portal: every inquiry, quote, trip, payment and visa in one place. The tour takes about 3 minutes. Use Next, or the arrow keys on your keyboard.",
  },
  {
    href: "/dashboard",
    targets: [".home-jobs"],
    title: "Home: today's jobs",
    body: "Everyone starts here. TravelOS shows the few things that need doing today: late payments in red, tickets to issue, clients to call. One button per job.",
  },
  {
    href: "/inquiries",
    targets: [".g4", "main .hello"],
    title: "Everyone who asked about a trip",
    body: "Inquiries from email, Messenger, Viber or walk-ins land here and move from New to Talking to Booked. Nobody gets forgotten.",
  },
  {
    href: "/quotations/view?id=q1",
    targets: [".doc-flights", ".doc"],
    title: "The quote your client receives",
    body: "Flights with the screenshot your staff took, what's included and the total, on your letterhead. This is the mock ticket the client approves.",
  },
  {
    href: "/quotations/view?id=q1",
    targets: [".ask", ".pays"],
    title: "Your markup, in pesos",
    body: "Staff add a fixed amount per person on top of the cost. The client never sees your cost or markup, only the final price.",
  },
  {
    href: "/quotations/view?id=q1",
    targets: [".pays", ".yes"],
    title: "Price and profit at a glance",
    body: "Total, price per person and what MEP earns, updated as staff type. Travel insurance is included on every trip.",
  },
  {
    href: "/quotations/view?id=q1",
    targets: [".quote-front-tools"],
    title: "Send it for approval",
    body: "One click prepares the email to the client, with the quote as a PDF and a link where they can approve it.",
  },
  {
    href: "/quotations/edit?id=q1",
    targets: [".shot-drop", "#flights"],
    title: "Paste the flight screenshot",
    body: "Found the flights? Take a screenshot and paste it here with Ctrl+V (⌘V on Mac). It goes straight onto the quote. No retyping.",
  },
  {
    href: "/approve?id=q1",
    targets: [".client-pay", ".client-card"],
    title: "What your client sees",
    body: "The client opens the link on their phone, checks the trip and taps Approve. They pay the deposit with GCash, Maya, card or bank. In this demo no money moves.",
  },
  {
    href: "/bookings/view?id=b1",
    targets: [".trip-next", ".trip-front-top"],
    title: "Every trip has a next step",
    body: "Once booked, each trip shows the one thing to do next: collect the deposit, confirm the hotel, issue tickets, finish visas.",
  },
  {
    href: "/payments",
    targets: [".stats", "main .hello"],
    title: "Money in, money owed",
    body: "See who has paid, who still owes and what is late. Print a statement for any client in one click.",
  },
  {
    href: "/visas",
    targets: [".visa-notice", "main .sheet"],
    title: "Visa tracking",
    body: "Each traveler's visa has a checklist and a stage, so you always know which papers are missing.",
  },
  {
    href: "/dashboard",
    targets: [".me"],
    title: "Each person sees their own view",
    body: "Staff sign in with their own account. Ticketing sees tickets, Visa sees visa papers, and only Sales and the owner see costs and profit. In this demo, switch people here.",
  },
  {
    href: "/salary",
    targets: [".salary-blocks", "main .block"],
    title: "Salary and commission",
    body: "Owner only. TravelOS adds up base pay and commission from each person's bookings, takes off SSS, PhilHealth, Pag-IBIG and tax, and prepares payslips for you to approve.",
  },
  {
    title: "That's TravelOS",
    body: "Everything you saw works in this demo. For your team we add personal logins, one shared online database, real emails and online payments. Ask us anything.",
  },
];
