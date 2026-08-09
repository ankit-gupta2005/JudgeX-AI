const express = require("express");
const router = express.Router();
const { submitCode, submitTimeout, getSubmissionStatus, getMySubmissions } = require("../controllers/submission.controller");
const authenticateToken = require("../middleware/auth.middleware");
const rateLimiter = require("../middleware/ratelimit.middleware");

const { submissionValidator } = require("../validators/submission.validator");

const validateSubmissionPayload = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      message: "Submission Payload Refused",
      errors: error.errors.map(err => err.message)
    });
  }
};

router.post("/", authenticateToken, rateLimiter, validateSubmissionPayload(submissionValidator), submitCode);
router.post("/timeout", authenticateToken, submitTimeout);
router.get("/me", authenticateToken, getMySubmissions);
router.get("/:id", authenticateToken, getSubmissionStatus);

module.exports = router;