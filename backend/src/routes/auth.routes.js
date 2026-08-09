const express = require("express");
const router = express.Router();
const { signup, login, verifyOtp, resendOtp } = require("../controllers/auth.controller");
const { signupValidator, loginValidator } = require("../validators/auth.validators");
const authenticateToken = require("../middleware/auth.middleware");

const validatePayload = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      message: "Validation Error",
      errors: error.errors.map(err => err.message),
    });
  }
};

router.post("/signup", validatePayload(signupValidator), signup);
router.post("/login", validatePayload(loginValidator), login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;