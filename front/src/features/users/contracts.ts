import { z } from "zod";
import { userSchema } from "@/features/auth/contracts";

export const usersListSchema = z.object({
  items: z.array(userSchema),
});
