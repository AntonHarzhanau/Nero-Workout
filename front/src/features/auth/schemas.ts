import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Adresse email invalide").max(254),

  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .max(4096, "Le mot de passe est trop long"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est requis")
    .max(100, "100 caractères maximum"),

  username: z
    .string()
    .trim()
    .min(3, "3 caractères minimum")
    .max(32, "32 caractères maximum")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Utilisez des lettres latines, chiffres, points, tirets ou underscores",
    ),

  email: z.email("Adresse email invalide").max(254),

  password: z
    .string()
    .min(8, "8 caractères minimum")
    .max(4096, "Le mot de passe est trop long"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
