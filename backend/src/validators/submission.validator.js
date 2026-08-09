const { z } = require("zod");

const submissionValidator = z.object({
  problemId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid system problem identifier format" }),
  language: z
    .enum(["cpp", "java", "python", "javascript"], { 
      message: "Unsupported language selection. Allowed systems: cpp, java, python, javascript" 
    }),
  code: z
    .string()
    .min(1, { message: "Source execution code block cannot be completely empty" }),
});

module.exports = {
  submissionValidator,
};