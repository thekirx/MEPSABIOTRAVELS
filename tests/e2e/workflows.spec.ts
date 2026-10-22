import { test, expect } from "@playwright/test";
async function reset(page: import("@playwright/test").Page) {
  await page.goto("/settings");
  await page
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(
    page.getByText("Demo restored to its starting state"),
  ).toBeVisible();
}
async function accept(page: import("@playwright/test").Page) {
  await page.goto("/quotations/view?id=q1");
  await page
    .getByRole("button", { name: "Accept & convert to booking" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Yes, book it", exact: true })
    .click();
  await expect(page).toHaveURL(/bookings\/view\/?\?id=b8/);
}
async function deposit(page: import("@playwright/test").Page) {
  await page
    .getByRole("button", { name: "Record payment", exact: true })
    .first()
    .click();
  await page.getByLabel("Amount (PHP)").fill("60000");
  await page.getByRole("button", { name: "Save payment", exact: true }).click();
  await expect(page.getByTestId("booking-balance")).toHaveText("₱160,000.00");
}
test.beforeEach(async ({ page }) => reset(page));
test("1: Andrea lead → quote, live math and print isolation", async ({
  page,
}) => {
  await page.goto("/inquiries");
  await page
    .getByRole("link", { name: "Andrea Reyes", exact: true })
    .first()
    .click();
  await page.getByRole("link", { name: "HTT-Q-2026-0142" }).click();
  await expect(page.getByTestId("preview-total")).toHaveText("₱220,000.00");
  // ₱3,500 is not a quick pick, so the custom amount field is already open.
  await page.getByLabel("Markup per person (PHP)").fill("5000");
  await expect(page.getByTestId("preview-total")).toHaveText("₱226,000.00");
  await page.getByLabel("Markup per person (PHP)").fill("3500");
  await expect(page.getByTestId("preview-total")).toHaveText("₱220,000.00");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-document")).toBeVisible();
  for (const panel of await page.locator(".staff-only").all())
    await expect(panel).toBeHidden();
  await expect(page.locator(".appbar")).toBeHidden();
});
test("2: conversion creates consistent booking and increments KPI", async ({
  page,
}) => {
  await page.goto("/bookings");
  const before = Number(await page.getByTestId("kpi-bookings").innerText());
  await accept(page);
  await page
    .getByRole("link", { name: "See full trip details →", exact: true })
    .click();
  await expect(page.getByTestId("traveler-row")).toHaveCount(4);
  await expect(page.getByTestId("service-row")).toHaveCount(5);
  await expect(page.getByTestId("installment-row")).toHaveCount(2);
  await page.goto("/inquiries?view=table");
  await expect(
    page
      .locator("tr")
      .filter({ hasText: "Andrea Reyes" })
      .getByLabel("Lead stage"),
  ).toHaveValue("Won");
  await page.goto("/bookings");
  await expect(page.getByTestId("kpi-bookings")).toHaveText(String(before + 1));
});
test("3: deposit updates balance, receivables, ledger and customer", async ({
  page,
}) => {
  await accept(page);
  await page.goto("/payments");
  const before = await page
    .getByTestId("kpi-receivables")
    .getAttribute("data-centavos");
  await page.goto("/bookings/view?id=b8");
  await deposit(page);
  await page.goto("/payments");
  expect(
    Number(
      await page.getByTestId("kpi-receivables").getAttribute("data-centavos"),
    ),
  ).toBe(Number(before) - 6000000);
  await page.goto("/payments");
  const row = page
    .getByTestId("receivables-table")
    .locator("tbody tr")
    .filter({ hasText: "Andrea Reyes" });
  await expect(row).toContainText("₱160,000.00");
  await expect(row).toContainText("Partially Paid");
  await page.goto("/customers/view?id=c1");
  await expect(page.getByTestId("customer-balance")).toHaveText("₱160,000.00");
});
test("4: visa creation, checklist and stage counts", async ({ page }) => {
  await accept(page);
  await page.goto("/bookings/details?id=b8");
  await page
    .getByRole("button", { name: "Create visa case", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/visas/);
  await expect(page.getByRole("heading", { name: "Traveler 1" })).toBeVisible();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await expect(page.getByText("All requirements complete")).toBeVisible();
  await page.getByLabel("Visa stage").selectOption("Complete");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Complete (1)", exact: true }),
  ).toBeVisible();
});
test("5: home ticket job requires reference, clears, and persists", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Record ticket", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mark ticket issued", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Type the airline's reference first",
  );
  await page.getByLabel("Airline reference").fill("SIM-TKT-7788");
  await page
    .getByRole("button", { name: "Mark ticket issued", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Record ticket", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Ticket issued · recorded manually"),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Record ticket", exact: true }),
  ).toHaveCount(0);
});
test("6: refresh persists; reset restores all seed records", async ({
  page,
}) => {
  await accept(page);
  await deposit(page);
  await page.reload();
  await expect(page.getByTestId("booking-balance")).toHaveText("₱160,000.00");
  await reset(page);
  await page.goto("/quotations/view?id=q1");
  await expect(page.getByTestId("preview-total")).toHaveText("₱220,000.00");
  await expect(
    page.getByRole("button", { name: "Accept & convert to booking" }),
  ).toBeEnabled();
  await page.goto("/bookings");
  await expect(page.locator("tbody tr")).toHaveCount(7);
});

test("global search opens the customer page from inquiries", async ({
  page,
}) => {
  await page.goto("/inquiries");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByLabel("Global search").fill("Andrea");
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Andrea Reyes Customer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Andrea Reyes", exact: true }),
  ).toBeVisible();
});
test("storage schema mismatches reseed safely", async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem(
      "travelos-demo-v1",
      JSON.stringify({
        version: 0,
        state: { schemaVersion: 0, settings: { agencyName: "Old schema" } },
      }),
    ),
  );
  await page.reload();
  await expect(page.getByLabel("Agency name")).toHaveValue("MEP Sabio Travel");
});
test("corrupt storage recovers to a usable seed", async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem("travelos-demo-v1", "{broken json"),
  );
  await page.reload();
  await expect(page.getByLabel("Agency name")).toHaveValue("MEP Sabio Travel");
});
test("adding a traveler is reflected consistently in booking list", async ({
  page,
}) => {
  await accept(page);
  await page.goto("/bookings/details?id=b8");
  await page.getByRole("button", { name: "Add traveler", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name", { exact: true }).fill("Demo Guest");
  await dialog.getByLabel("Date of birth", { exact: true }).fill("1990-01-01");
  await dialog
    .getByLabel("Passport expiry", { exact: true })
    .fill("2030-01-01");
  await dialog
    .getByRole("button", { name: "Add traveler", exact: true })
    .click();
  await expect(page.getByTestId("traveler-row")).toHaveCount(5);
  await page.goto("/bookings");
  await expect(
    page.locator("tr").filter({ hasText: "Andrea Reyes" }),
  ).toContainText("5 pax");
});

test("inquiry card advances stage and URL filter persists", async ({
  page,
}) => {
  await page.goto("/inquiries?stage=New%20Inquiry");
  const card = page.getByTestId("person-card").first();
  const name = await card.locator("h3").innerText();
  await card
    .getByRole("button", { name: "Log first reply →", exact: true })
    .click();
  await page.getByRole("button", { name: /Talking Make a quote/ }).click();
  await expect(
    page.getByTestId("person-card").filter({ hasText: name }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByTestId("person-card").filter({ hasText: name }),
  ).toBeVisible();
});

test("trip next step collects remaining deposit then advances to suppliers", async ({
  page,
}) => {
  await accept(page);
  await deposit(page);
  await expect(
    page.getByRole("heading", {
      name: "Collect ₱6,000.00 more for the deposit",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Record payment", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Amount (PHP)")).toHaveValue("6000");
  await page.getByRole("button", { name: "Save payment", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Confirm flight, hotel, tours and car",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("booking-balance")).toHaveText("₱154,000.00");
});

test("urgent trip ticket deadline clears from trip and Home", async ({
  page,
}) => {
  await page.goto("/bookings/view?id=b1");
  await expect(
    page.getByRole("heading", { name: "Issue Miguel's plane ticket" }),
  ).toBeVisible();
  await expect(page.locator(".trip-next")).toContainText("Tomorrow, 5 PM");
  await page
    .getByRole("button", { name: "Record ticket", exact: true })
    .click();
  await page.getByLabel("Airline reference").fill("SIM-TKT-7788");
  await page
    .getByRole("button", { name: "Mark ticket issued", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Issue Miguel's plane ticket" }),
  ).toHaveCount(0);
  await page.goto("/dashboard");
  await expect(
    page.getByRole("button", { name: "Record ticket", exact: true }),
  ).toHaveCount(0);
});

test("Trip details refuses Issued without a supplier reference", async ({
  page,
}) => {
  await page.goto("/bookings/details?id=b1");
  const airfare = page
    .getByTestId("service-row")
    .filter({ hasText: "Airfare" });
  await airfare.getByLabel("Service status").selectOption("Issued");
  await expect(
    page.getByText("Enter a simulated ticket / confirmation number first.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(airfare.getByLabel("Service status")).toHaveValue("On Hold");
  await airfare.getByLabel("Supplier reference").fill("SIM-TKT-7788");
  await airfare.getByLabel("Service status").selectOption("Issued");
  await expect(airfare.getByLabel("Service status")).toHaveValue("Issued");
  await page.goto("/dashboard");
  await expect(
    page.getByRole("button", { name: "Record ticket", exact: true }),
  ).toHaveCount(0);
});

test("trip search and counted filters show the correct records", async ({
  page,
}) => {
  await page.goto("/bookings");
  await page.getByLabel("Find a name or place").fill("Miguel");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("HTT-B-2026-0081");
  await page.getByLabel("Find a name or place").fill("");
  await page
    .getByRole("button", { name: "Payment late 1", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Camille Dela Cruz");
});

test("local logo and identity persist across documents and reset restores MEP", async ({
  page,
}) => {
  await page.goto("/settings");
  await page
    .getByLabel("Upload logo")
    .setInputFiles("public/brand/mep-mark.png");
  await expect(
    page.getByText("Logo saved in this browser", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Agency name").fill("Demo Island Travel");
  await page.getByLabel("Logo text", { exact: true }).fill("DIT");
  await page.getByRole("button", { name: "Save identity" }).click();
  await page.goto("/quotations/view?id=q1");
  await expect(page.locator(".doc-top img")).toHaveAttribute(
    "alt",
    "Demo Island Travel",
  );
  await expect(page.locator(".doc-top img")).toHaveAttribute(
    "src",
    /^data:image\/png;base64,/,
  );
  await page.goto("/payments?statement=b1");
  await expect(page.locator(".doc-top img")).toHaveAttribute(
    "alt",
    "Demo Island Travel",
  );
  await page.reload();
  await expect(page.locator(".statement-footer")).toContainText(
    "Demo Island Travel",
  );
  await reset(page);
  await expect(page.getByLabel("Agency name")).toHaveValue("MEP Sabio Travel");
  await expect(
    page.getByRole("button", { name: "Remove uploaded logo" }),
  ).toHaveCount(0);
});

test("Andrea's complete checklist reaches Ready to fly and survives reload", async ({
  page,
}) => {
  await accept(page);
  await deposit(page);
  await page
    .getByRole("button", { name: "Record payment", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Amount (PHP)")).toHaveValue("6000");
  await page.getByRole("button", { name: "Save payment", exact: true }).click();
  await page
    .getByRole("button", { name: "Add references", exact: true })
    .click();
  for (const [index, field] of (
    await page.getByRole("dialog").getByRole("textbox").all()
  ).entries())
    await field.fill(`SIM-SUP-${index}`);
  await page
    .getByRole("button", { name: "Mark all confirmed", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add travelers", exact: true })
    .click();
  for (let i = 1; i <= 4; i++) {
    await page
      .getByLabel(`Traveler ${i} full name`, { exact: true })
      .fill(`Demo Person ${i}`);
    await page
      .getByLabel(`Traveler ${i} date of birth`, { exact: true })
      .fill("1992-06-15");
    await page
      .getByLabel(`Traveler ${i} passport expiry`, { exact: true })
      .fill("2032-06-15");
  }
  await page
    .getByRole("button", { name: "Save travelers", exact: true })
    .click();
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("button", { name: "Start / open visa case", exact: true })
      .click();
    for (const box of await page.getByRole("checkbox").all()) await box.check();
    await page.getByLabel("Visa stage").selectOption("Approved");
    await page.goto("/bookings/view?id=b8");
  }
  await expect(
    page.getByRole("heading", { name: "Collect the ₱154,000.00 balance" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Record payment", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Amount (PHP)")).toHaveValue("154000");
  await page.getByRole("button", { name: "Save payment", exact: true }).click();
  await page
    .getByRole("button", { name: "Record tickets", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mark tickets issued", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ready to fly", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("booking-balance")).toHaveText("₱0.00");
  await expect(page.locator(".trip-step.done")).toHaveCount(7);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ready to fly", exact: true }),
  ).toBeVisible();
});

test("front-screen dialogs support keyboard opening, focus trapping and Escape", async ({
  page,
}) => {
  const checkDialog = async (route: string, name: string) => {
    await page.goto(route);
    const trigger = page.getByRole("button", { name, exact: true }).first();
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((el) => el.contains(document.activeElement)),
      ).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  };
  await checkDialog("/dashboard", "Search");
  await checkDialog("/inquiries", "+ Someone new");
  await checkDialog("/quotations/view?id=q1", "Accept & convert to booking");
  await checkDialog("/bookings/view?id=b1", "Record ticket");
  await checkDialog("/bookings/view?id=b1", "Record payment");
});

test("route titles and mobile statements identify the page without overflow", async ({
  page,
}) => {
  for (const [route, title] of [
    ["/dashboard", "Home"],
    ["/quotations/edit?id=q1", "Quotes"],
    ["/payments?statement=b1", "Payments"],
  ]) {
    await page.goto(route);
    await expect(page).toHaveTitle(`${title} · MEP Sabio Travel`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("short-notice trip uses the same installment allocation on front, details and ledger", async ({
  page,
}) => {
  const date = (days: number) => {
    const value = new Date();
    value.setDate(value.getDate() + days);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  };
  await page.goto("/quotations/edit?id=q1");
  await page.getByLabel("Departure", { exact: true }).fill(date(10));
  await page.getByLabel("Return", { exact: true }).fill(date(15));
  await accept(page);
  await deposit(page);
  await expect(
    page.getByRole("heading", {
      name: "Collect the ₱66,000.00 deposit",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/bookings/details?id=b8");
  const plan = page.getByTestId("installment-row");
  await expect(plan.first()).toContainText("Final balance");
  await expect(plan.first()).toContainText("₱94,000.00");
  await expect(plan.nth(1)).toContainText("₱66,000.00");
  await page.goto("/payments");
  const row = page
    .getByTestId("receivables-table")
    .locator("tbody tr")
    .filter({ hasText: "Andrea Reyes" });
  await expect(row).toContainText("Final balance · ₱94,000.00");
  await expect(
    page.getByText("Due in 7 days", { exact: true }).locator(".."),
  ).toContainText("₱66,000.00");
});
test("quote flow: flight screenshot on the customer copy, insurance and email for approval", async ({
  page,
}) => {
  await page.goto("/quotations/edit?id=q1#flights");
  await page
    .getByLabel("Upload flight screenshot")
    .setInputFiles("public/demo/flight-options-q1.png");
  await expect(page.getByAltText("Flight screenshot 2")).toBeVisible();
  await page.goto("/quotations/view?id=q1");
  await expect(page.locator(".doc-flights img")).toHaveCount(2);
  await expect(page.locator(".doc-services")).toContainText("Travel insurance");
  await page
    .getByRole("button", { name: "Email Andrea for approval", exact: true })
    .click();
  const message = page.getByLabel("Email message");
  await expect(message).toHaveValue(/₱220,000\.00/);
  await expect(message).toHaveValue(/travel insurance included/);
  await expect(message).toHaveValue(/SW 412 Manila/);
  await expect(page.getByLabel("Email to")).toHaveValue(
    "andrea.reyes@example.com",
  );
  await expect(page.getByRole("link", { name: "Open email" })).toHaveAttribute(
    "href",
    /^mailto:andrea\.reyes@example\.com\?subject=/,
  );
});

test("pitch: client approves and pays, Ticketing gets the job, owner sees commission", async ({
  page,
}) => {
  await page.goto("/approve?id=q1");
  await expect(page.getByTestId("client-total")).toHaveText("₱220,000.00");
  await page
    .getByRole("button", { name: "Approve & pay ₱66,000.00 deposit" })
    .click();
  await page.getByRole("button", { name: "Pay ₱66,000.00 (demo)" }).click();
  await expect(
    page.getByText("Please confirm you've read the trip details."),
  ).toBeVisible();
  await page.getByLabel("Maya").check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Pay ₱66,000.00 (demo)" }).click();
  await expect(
    page.getByRole("heading", { name: "You're booked, Andrea!" }),
  ).toBeVisible();
  await expect(page.getByText("₱66,000.00 · Maya")).toBeVisible();

  await page.goto("/bookings/view?id=b8");
  await expect(page.getByTestId("booking-balance")).toHaveText("₱154,000.00");

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("radio", { name: /Luis Tan/ }).click();
  await expect(
    page.getByRole("heading", {
      name: /Good (morning|afternoon|evening), Luis/,
    }),
  ).toBeVisible();
  await expect(page.getByText("Issue Andrea's plane ticket")).toBeVisible();
  await expect(page.getByRole("link", { name: "Salary" })).toHaveCount(0);
  await page.goto("/quotations/view?id=q2");
  await expect(page.getByText("Price set by Sales")).toBeVisible();
  await expect(page.getByText("We earn")).toHaveCount(0);

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("radio", { name: /Isabel Santos/ }).click();
  await page.getByRole("link", { name: "Salary" }).click();
  await expect(page.getByTestId("payroll-row")).toHaveCount(4);
  await page
    .getByRole("button", { name: "View Katrina Ramos's payslip" })
    .click();
  await expect(page.getByTestId("payslip")).toContainText("HTT-B-2026-0088");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Approve payday" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Approve payday" })
    .click();
  await expect(
    page.getByText("Payday approved", { exact: true }),
  ).toBeVisible();
});

test("guided tour walks through the portal without changing data", async ({
  page,
}) => {
  await page.goto("/dashboard");
  const before = await page.evaluate(() =>
    localStorage.getItem("travelos-demo-v1"),
  );
  await page.getByRole("button", { name: "Take the tour" }).first().click();
  const card = page.getByRole("dialog", { name: "Welcome to TravelOS" });
  await expect(card).toBeVisible();
  await page.getByRole("button", { name: "Start" }).click();
  await expect(
    page.getByRole("dialog", { name: "Home: today's jobs" }),
  ).toBeVisible();
  await expect(page.locator(".tour-spot")).toBeVisible();
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/quotations\/view\/?\?id=q1/);
  await expect(
    page.getByRole("dialog", { name: "The quote your client receives" }),
  ).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/inquiries/);
  for (let i = 0; i < 12; i++) await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("dialog", { name: "That's TravelOS" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator(".tour-card")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("travelos-demo-v1")),
  ).toBe(before);
});
