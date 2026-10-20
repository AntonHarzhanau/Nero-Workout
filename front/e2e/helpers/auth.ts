import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

export function createUser() {
  const id = randomUUID().slice(0, 8);

  return {
    name: `User ${id}`,
    username: `user_${id}`,
    email: `user-${id}@example.com`,
    password: "UserPassword123!",
  };
}

type User = ReturnType<typeof createUser>;

export async function register(page: Page, user: User) {
  await page.goto("/register");

  await page.getByLabel("Nom", { exact: true }).fill(user.name);

  await page
    .getByLabel("Nom d’utilisateur", { exact: true })
    .fill(user.username);

  await page.getByLabel("Adresse email", { exact: true }).fill(user.email);

  await page.getByLabel("Mot de passe", { exact: true }).fill(user.password);

  await page
    .getByRole("button", {
      name: "Créer un compte",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/login/);
}

export async function login(page: Page, user: User) {
  await page.goto("/login");

  await page.getByLabel("Adresse email", { exact: true }).fill(user.email);

  await page.getByLabel("Mot de passe", { exact: true }).fill(user.password);

  await page
    .getByRole("button", {
      name: "Se connecter",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function registerAndLogin(page: Page) {
  const user = createUser();

  await register(page, user);
  await login(page, user);

  return user;
}
