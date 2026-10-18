import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  email: z.email(),
  role: z.enum(["standard", "admin"]),
  createdAt: z.string(),
});

export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  user: userSchema,
});

export type User = z.infer<typeof userSchema>;
export type TokenPair = z.infer<typeof tokenPairSchema>;