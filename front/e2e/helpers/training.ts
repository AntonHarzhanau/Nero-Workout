import { expect, type Page } from "@playwright/test";

export async function createExercise(page: Page, title: string) {
  await page.goto("/exercises");

  await page
    .locator("main header")
    .getByRole("button", {
      name: "Créer un exercice",
      exact: true,
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "Créer un exercice",
    exact: true,
  });

  await dialog.getByLabel("Nom de l’exercice", { exact: true }).fill(title);

  await dialog
    .getByRole("button", {
      name: "Créer l’exercice",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: title,
      exact: true,
    }),
  ).toBeVisible();
}

export async function createPlan(
  page: Page,
  title: string,
  exerciseTitle: string,
) {
  await page.goto("/plans");

  await page
    .locator("main header")
    .getByRole("button", {
      name: "Créer un plan",
      exact: true,
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "Créer un plan",
    exact: true,
  });

  await dialog.getByLabel("Nom du plan", { exact: true }).fill(title);

  await dialog
    .getByRole("button", {
      name: "Ajouter un exercice",
      exact: true,
    })
    .click();

  const picker = page.getByRole("dialog", {
    name: "Ajouter un exercice",
    exact: true,
  });

  await picker
    .getByRole("searchbox", {
      name: "Rechercher un exercice",
    })
    .fill(exerciseTitle);

  await picker.getByRole("button").filter({ hasText: exerciseTitle }).click();

  await expect(picker).not.toBeVisible();

  await dialog
    .getByLabel(`Poids série 1 ${exerciseTitle}`, {
      exact: true,
    })
    .fill("20");

  await dialog
    .getByLabel(`Répétitions série 1 ${exerciseTitle}`, {
      exact: true,
    })
    .fill("8");

  await dialog
    .getByRole("button", {
      name: "Créer le plan",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: title,
      exact: true,
    }),
  ).toBeVisible();
}
