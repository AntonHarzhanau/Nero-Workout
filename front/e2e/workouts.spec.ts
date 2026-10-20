import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { createExercise, createPlan } from "./helpers/training";

test("should create a workout from a plan", async ({ page }) => {
  const user = await registerAndLogin(page);

  const exerciseTitle = `Exercise ${user.username}`;
  const planTitle = `Plan ${user.username}`;

  await createExercise(page, exerciseTitle);
  await createPlan(page, planTitle, exerciseTitle);

  await page.goto("/workouts");

  await page
    .locator("main header")
    .getByRole("button", {
      name: "Nouvelle séance",
      exact: true,
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "Nouvelle séance",
    exact: true,
  });

  await dialog
    .getByLabel("À partir d’un plan", {
      exact: true,
    })
    .selectOption({ label: planTitle });

  await expect(
    dialog.getByLabel("Nom de la séance", {
      exact: true,
    }),
  ).toHaveValue(planTitle);

  await dialog
    .getByRole("button", {
      name: "Enregistrer la séance",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/workouts\/[0-9a-f-]{36}$/);

  await page.reload();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: planTitle,
      exact: true,
    }),
  ).toBeVisible();

  const firstSet = page
    .getByRole("table", {
      name: `Séries ${exerciseTitle}`,
      exact: true,
    })
    .getByRole("row")
    .nth(1);

  await expect(firstSet.getByRole("cell")).toHaveText(["1", "20", "8"]);
});
