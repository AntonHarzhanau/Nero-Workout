import { describe, expect, test } from "vitest";
import { registerSchema } from "../../features/auth/schemas";

const validUser = {
  name: "Jogn Smith",
  username: "johnsmith",
  email: "john.smith@example.com",
  password: "Password1234!",
};

describe("registerSchema", () => {
  test("should accept valid registration data", () => {
    const result = registerSchema.safeParse(validUser);

    expect(result.success).toBe(true);
  });

  test.each([
    {
      field: "email",
      value: "invalid-email",
    },
    {
      field: "password",
      value: "short",
    },
    {
      field: "username",
      value: "ab",
    },
    {
      field: "name",
      value: "    ",
    },
  ])("should reject an invalid $field", ({ field, value }) => {
    const result = registerSchema.safeParse({
      ...validUser,
      [field]: value,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(
        true,
      );
    }
  });

  test("should trim the name and username", () => {
    const result = registerSchema.parse({
      ...validUser,
      name: "  John Smith   ",
      username: "  johnsmith  ",
    });

    expect(result.name).toBe("John Smith");
    expect(result.username).toBe("johnsmith");
  });
});
