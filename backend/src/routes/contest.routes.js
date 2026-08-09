const express = require("express");
const router = express.Router();
const {
  createContest,
  getAllContests,
  getContestById,
  joinContest,
  getMyParticipation,
  submitContestStage,
  runDryRunStage,
  skipContestStage,
  getContestLeaderboard,
  deleteContest,
} = require("../controllers/contest.controller");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrgAccess = require("../middleware/org.middleware");
const rateLimiter = require("../middleware/ratelimit.middleware");

router.post("/", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), createContest);
router.get("/", authenticateToken, getAllContests);
router.get("/:id", authenticateToken, getContestById);
router.post("/:id/join", authenticateToken, joinContest);
router.get("/:id/participation", authenticateToken, getMyParticipation);
router.post("/:id/stages/:stageIndex/submit", authenticateToken, rateLimiter, submitContestStage);
router.post("/:id/stages/:stageIndex/dry-run", authenticateToken, rateLimiter, runDryRunStage);
router.post("/:id/stages/:stageIndex/skip", authenticateToken, skipContestStage);
router.get("/:id/leaderboard", authenticateToken, getContestLeaderboard);
router.delete("/:id", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), deleteContest);

module.exports = router;