import { test, expect } from "@playwright/test";
import { createUser, register, login, registerAndLogin } from "./helpers/auth";

test("should redirect unauthenticated users to login", async ({ page }) => {
  await page.goto("/plans");

  await expect(page).toHaveURL("/login?next=%2Fplans");

  await expect(
    page.getByRole("button", {
      name: "Se connecter",
      exact: true,
    }),
  ).toBeVisible();
});

test("should register a user and sign in", async ({ page }) => {
  const user = createUser();

  await register(page, user);
  await login(page, user);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: `Bonjour, ${user.name}`,
      exact: true,
    }),
  ).toBeVisible();

  await page.goto("/profile");

  await expect(page.getByRole("main")).toContainText(user.email);
});

test("should sign out and protect private pages", async ({ page }) => {
  await registerAndLogin(page);

  await page.goto("/profile");

  await page
    .getByRole("button", {
      name: "Se déconnecter",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/profile");

  await expect(page).toHaveURL("/login?next=%2Fprofile");
});
