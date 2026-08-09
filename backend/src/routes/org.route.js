const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../model/user.model");
const Organization = require("../model/org.model");
const Problem = require("../model/problem.model");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secretKey);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Session token context invalid. Node removed." });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Authentication matrix signature verification failed." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, missing bearer configuration string." });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "org_admin" || req.user.role === "super_admin")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Enterprise Admin privileges required." });
  }
};

router.get("/details", protect, authorizeAdmin, async (req, res) => {
  try {
    const targetOrgId = req.user.organizations?.[0];
    if (!targetOrgId) {
      return res.status(404).json({ message: "You are not linked to any active organization workspace" });
    }

    const org = await Organization.findById(targetOrgId)
      .populate("owner", "name email")
      .populate("members", "name email role");

    if (!org) {
      return res.status(404).json({ message: "Organization workspace not found" });
    }

    return res.status(200).json({ org });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching organization data", error: error.message });
  }
});

router.post("/add-member", protect, authorizeAdmin, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Developer email address is required." });
  }

  try {
    const developer = await User.findOne({ email: email.toLowerCase() });

    if (!developer) {
      return res.status(404).json({ message: "No registered developer profile found with this email." });
    }

    if (developer.role !== "developer") {
      return res.status(400).json({ message: "Target user profile workspace intent is not a developer." });
    }

    const currentOrgId = req.user.organizations?.[0];
    if (!currentOrgId) {
      return res.status(400).json({ message: "Your account is not linked to an active organization workspace." });
    }

    const alreadyMember = (developer.organizations || []).some(
      (orgId) => orgId.toString() === currentOrgId.toString()
    );

    if (!alreadyMember) {
      developer.organizations = [...(developer.organizations || []), currentOrgId];
      await developer.save();
    }

    const org = await Organization.findById(currentOrgId);
    if (org && !org.members.includes(developer._id)) {
      org.members.push(developer._id);
      await org.save();
    }

    res.status(200).json({
      message: "Member successfully appended to your organization workspace",
      developer: {
        id: developer._id,
        name: developer.name,
        email: developer.email,
        organizations: developer.organizations,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server execution failure mapping tenant bounds." });
  }
});

router.get("/developers", protect, authorizeAdmin, async (req, res) => {
  try {
    const currentOrgId = req.user.organizations?.[0];
    const developers = await User.find({
      organizations: currentOrgId,
      role: "developer",
    }).select("-password");

    res.status(200).json(developers);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve workspace developers." });
  }
});

router.delete("/member/:email", protect, authorizeAdmin, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).trim().toLowerCase();

    if (email === req.user.email) {
      return res.status(400).json({ message: "You cannot remove yourself from the workspace." });
    }

    const currentOrgId = req.user.organizations?.[0];

    const developer = await User.findOne({
      email,
      role: "developer",
      organizations: currentOrgId,
    });

    if (!developer) {
      return res.status(404).json({ message: "Developer not found in this workspace." });
    }

    developer.organizations = (developer.organizations || []).filter(
      (orgId) => orgId.toString() !== currentOrgId.toString()
    );

    
    if (developer.allocatedProblemId) {
      const allocatedProblem = await Problem.findById(developer.allocatedProblemId).select("organization");
      const belongsToThisOrg =
        allocatedProblem &&
        (!allocatedProblem.organization || allocatedProblem.organization.toString() === currentOrgId.toString());

      if (belongsToThisOrg) {
        developer.allocatedProblemId = undefined;
      }
    }

    await developer.save();

    await Organization.findByIdAndUpdate(currentOrgId, {
      $pull: { members: developer._id },
    });

    res.status(200).json({ message: "Developer removed from workspace." });
  } catch (error) {
    return res.status(500).json({ message: "Error removing developer from workspace.", error: error.message });
  }
});

module.exports = router;