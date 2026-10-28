import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { createExercise, createPlan } from "./helpers/training";

test("should create a plan with an exercise and sets", async ({ page }) => {
  const user = await registerAndLogin(page);

  const exerciseTitle = `Exercise ${user.username}`;
  const planTitle = `Plan ${user.username}`;

  await createExercise(page, exerciseTitle);
  await createPlan(page, planTitle, exerciseTitle);

  await page.reload();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: planTitle,
      exact: true,
    }),
  ).toBeVisible();

  const table = page.getByRole("table", {
    name: `Séries ${exerciseTitle}`,
    exact: true,
  });

  await expect(table.getByRole("row")).toHaveCount(4);

  const firstSet = table.getByRole("row").nth(1);

  await expect(firstSet.getByRole("cell")).toHaveText(["1", "20", "8"]);
});
