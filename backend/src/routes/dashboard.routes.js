const express = require("express");
const router = express.Router();
const { getDashboardStats, getSubmissionsByStatus } = require("../controllers/dashboard.controller");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrgAccess = require("../middleware/org.middleware");

router.get("/stats", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), getDashboardStats);
router.get("/submissions", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), getSubmissionsByStatus);

module.exports = router;