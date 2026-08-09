const express = require("express");
const router = express.Router();
const { generateProblem, generateDrivers, validateGeneratedProblem } = require("../controllers/ai.controller");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrgAccess = require("../middleware/org.middleware");
const rateLimiter = require("../middleware/ratelimit.middleware");

router.post("/generate-problem", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), rateLimiter, generateProblem);
router.post("/generate-drivers", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), rateLimiter, generateDrivers);
router.post("/validate-generated-problem", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), rateLimiter, validateGeneratedProblem);

module.exports = router;