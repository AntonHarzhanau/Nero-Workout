import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { createExercise } from "./helpers/training";

test("should create an exercise and keep it after reload", async ({ page }) => {
  const user = await registerAndLogin(page);
  const title = `Exercise ${user.username}`;

  await createExercise(page, title);
  await page.reload();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  await page.goto("/exercises");

  await page
    .getByRole("searchbox", {
      name: "Rechercher un exercice",
    })
    .fill(title);

  await expect(
    page.locator('main a[href^="/exercises/"]').filter({ hasText: title }),
  ).toBeVisible();
});
