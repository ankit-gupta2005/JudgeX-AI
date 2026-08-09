const { z } = require("zod");

const signupValidator = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" })
    .trim(),
  email: z
    .string()
    .email({ message: "Invalid email address format" })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  role: z
    .enum(["developer", "org_admin"], { message: "Invalid account role assignment" })
    .optional(),
  orgName: z
    .string()
    .min(2, { message: "Organization name must be at least 2 characters long" })
    .optional(),
});

const loginValidator = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address format" })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, { message: "Password field cannot be empty" }),
});

module.exports = {
  signupValidator,
  loginValidator,
};