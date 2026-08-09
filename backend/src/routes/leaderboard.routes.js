const express = require("express");
const router = express.Router();
const { getGlobalLeaderboard, getMyOrgLeaderboard } = require("../controllers/leaderboard.controller");
const authenticateToken = require("../middleware/auth.middleware");

router.get("/global", authenticateToken, getGlobalLeaderboard);
router.get("/mine", authenticateToken, getMyOrgLeaderboard);

module.exports = router;