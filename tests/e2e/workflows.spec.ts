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
    .getByRole("button", { name: "Andrea Reyes", exact: true })
    .first()
    .click();
  await page.getByRole("link", { name: "HTT-Q-2026-0142" }).click();
  await expect(page.getByTestId("preview-total")).toHaveText("₱220,000.00");
  await page.getByLabel("Markup (%)").fill("15");
  await expect(page.getByTestId("preview-total")).toHaveText("₱230,000.00");
  await page.getByLabel("Markup (%)").fill("10");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-document")).toBeVisible();
  await expect(page.locator(".staff-only")).toBeHidden();
  await expect(page.locator(".appbar")).toBeHidden();
});
test("2: conversion creates consistent booking and increments KPI", async ({
  page,
}) => {
  await page.goto("/bookings");
  const before = Number(await page.getByTestId("kpi-bookings").innerText());
  await accept(page);
  await expect(page.getByTestId("traveler-row")).toHaveCount(4);
  await expect(page.getByTestId("service-row")).toHaveCount(4);
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
  const row = page.locator("tr").filter({ hasText: "Andrea Reyes" });
  await expect(row).toContainText("₱160,000.00");
  await expect(row).toContainText("Partially Paid");
  await page.goto("/inquiries");
  await page
    .getByRole("button", { name: "Andrea Reyes", exact: true })
    .first()
    .click();
  await expect(page.getByTestId("customer-balance")).toHaveText("₱160,000.00");
});
test("4: visa creation, checklist and stage counts", async ({ page }) => {
  await accept(page);
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
test("5: home ticket job requires reference, clears, and persists",async({page})=>{
 await page.goto('/dashboard');
 await page.getByRole('button',{name:'Record ticket',exact:true}).click();
 await page.getByRole('button',{name:'Mark ticket issued',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText("Type the airline's reference first");
 await page.getByLabel('Airline reference').fill('SIM-TKT-7788');
 await page.getByRole('button',{name:'Mark ticket issued',exact:true}).click();
 await expect(page.getByRole('button',{name:'Record ticket',exact:true})).toHaveCount(0);
 await expect(page.getByText('Ticket issued · recorded manually')).toBeVisible();
 await page.reload();
 await expect(page.getByRole('button',{name:'Record ticket',exact:true})).toHaveCount(0);
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

test("global search updates customer drawer within the current inquiries route", async ({
  page,
}) => {
  await page.goto("/inquiries");
  await page.getByRole("button",{name:"Search",exact:true}).click();
  await page.getByLabel("Global search").fill("Andrea");
  await page
    .getByRole("link")
    .filter({ hasText: "Andrea Reyes" })
    .first()
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
  await expect(page.getByLabel("Agency name")).toHaveValue(
    "MEP Sabio Travel",
  );
});
test("corrupt storage recovers to a usable seed", async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem("travelos-demo-v1", "{broken json"),
  );
  await page.reload();
  await expect(page.getByLabel("Agency name")).toHaveValue(
    "MEP Sabio Travel",
  );
});
test("adding a traveler is reflected consistently in booking list", async ({
  page,
}) => {
  await accept(page);
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
