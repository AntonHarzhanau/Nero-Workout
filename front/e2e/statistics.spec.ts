import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { createExercise, createPlan } from "./helpers/training";

test("statistics follows saved workouts and preserves the selected exercise", async ({
  page,
}) => {
  const user = await registerAndLogin(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(page.getByLabel("Exercice à afficher")).toHaveCount(0);
  await expect(
    page.getByText("Aucune séance sur cette période."),
  ).toBeVisible();

  const exercise = `Charge ${user.username}`;
  const unused = `Sans historique ${user.username}`;
  const plan = `Plan ${user.username}`;
  await createExercise(page, exercise);
  await createPlan(page, plan, exercise);
  await createExercise(page, unused);
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Nouvelle séance", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Nouvelle séance",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("À partir d’un plan", { exact: true })
    .selectOption({ label: plan });
  await dialog
    .getByRole("button", { name: "Enregistrer la séance", exact: true })
    .click();
  await expect(page).toHaveURL(/\/workouts\/[0-9a-f-]{36}$/);

  await page.goto("/progress");
  const selector = page.getByLabel("Exercice à afficher");
  await expect(selector.locator("option")).toHaveCount(2);
  await selector.selectOption({ label: exercise });
  await expect(
    page.getByRole("img", { name: /Poids maximal : 1 jours, de 20 à 20 kg/ }),
  ).toBeVisible();
  const table = page.getByRole("table");
  const row = table
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: exercise, exact: true }) });
  await expect(row).toContainText("20 kg");
  await selector.selectOption({ label: unused });
  await expect(page.getByText("L’histoire reste à écrire")).toBeVisible();
  await selector.selectOption({ label: exercise });
  const id = await selector.inputValue();
  await page.reload();
  await expect(selector).toHaveValue(id);
  await page.goto("/dashboard");
  await expect(page.getByLabel("Exercice à afficher")).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: /Poids maximal : 1 jours, de 20 à 20 kg/ }),
  ).toBeVisible();
  await expect(
    page.locator('a[href^="/workouts/"]').filter({ hasText: plan }).first(),
  ).toBeVisible();
  await page.goto("/progress?period=all");
  await expect(page.getByLabel("Période des statistiques")).toHaveValue("all");
  await expect(
    page.getByRole("img", { name: /Poids maximal : 1 jours, de 20 à 20 kg/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("strength API requires a session", async ({ request }) => {
  const response = await request.get(
    "/api/statistics/strength-curve?exerciseId=11111111-1111-4111-8111-111111111111&from=2026-01-01&to=2026-10-21",
  );
  expect(response.status()).toBe(401);
});
