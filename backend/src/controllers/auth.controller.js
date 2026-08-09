const User = require("../model/user.model");
const Organization = require("../model/org.model");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/mailer");

const hashPassword = (password) => {
  return crypto.createHmac("sha256", process.env.JWT_SECRET_KEY).update(password).digest("hex");
};

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const GLOBAL_WORKSPACE_NAME = process.env.GLOBAL_WORKSPACE_NAME || "JudgeX";


const getGlobalWorkspaceOrgId = async () => {
  const globalOrg = await Organization.findOne({ name: GLOBAL_WORKSPACE_NAME }).select("_id");
  return globalOrg ? globalOrg._id : null;
};

const signup = async (req, res) => {
  try {
    const { name, email, password, role, orgName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const encryptedPassword = hashPassword(password);
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const user = new User({
      name,
      email,
      password: encryptedPassword,
      role: role || "developer",
      isVerified: false,
      otpCode,
      otpExpiresAt,
    });

    if (role === "org_admin") {
      if (!orgName) {
        return res.status(400).json({ message: "Organization name is required for org_admin accounts" });
      }

      const existingOrg = await Organization.findOne({ name: orgName });
      if (existingOrg) {
        return res.status(400).json({ message: "This organization name is already registered" });
      }

      await user.save();

      const newOrg = new Organization({
        name: orgName,
        owner: user._id,
        members: [user._id],
      });
      await newOrg.save();

      user.organizations = [newOrg._id];
      await user.save();
    } else {
  
      const globalOrgId = await getGlobalWorkspaceOrgId();
      if (globalOrgId) {
        user.organizations = [globalOrgId];
      }
      await user.save();

      if (globalOrgId) {
        await Organization.findByIdAndUpdate(globalOrgId, { $addToSet: { members: user._id } });
      }
    }

    try {
      await sendOtpEmail(user.email, otpCode, user.name);
    } catch (mailErr) {
      console.error("OTP email dispatch failed:", mailErr.message);
      return res.status(201).json({
        message: "Account created, but the verification email failed to send. Use 'Resend OTP' to try again.",
        email: user.email,
        requiresVerification: true,
      });
    }

    return res.status(201).json({
      message: "Account created. Check your email for the verification code.",
      email: user.email,
      requiresVerification: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server registration error", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP code are required" });
    }

    const user = await User.findOne({ email }).select("+otpCode +otpExpiresAt");
    if (!user) {
      return res.status(404).json({ message: "No account found for this email" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified" });
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({ message: "No pending verification found. Please request a new OTP." });
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "This OTP has expired. Please request a new one." });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: "Incorrect verification code" });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizations: user.organizations,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server verification error", error: error.message });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found for this email" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified" });
    }

    const otpCode = generateOtp();
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await user.save();

    await sendOtpEmail(user.email, otpCode, user.name);

    return res.status(200).json({ message: "A new verification code has been sent to your email" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to resend verification code", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password credentials" });
    }

    const encryptedPassword = hashPassword(password);
    if (user.password !== encryptedPassword) {
      return res.status(401).json({ message: "Invalid email or password credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Authentication successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizations: user.organizations,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server authentication error", error: error.message });
  }
};

module.exports = {
  signup,
  login,
  verifyOtp,
  resendOtp,
};