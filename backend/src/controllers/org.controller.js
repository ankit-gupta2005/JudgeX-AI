const User = require("../model/user.model");
const Organization = require("../model/org.model");

const getOrganizationDevelopers = async (req, res) => {
  try {
    const orgId = req.user.organizations?.[0];

    const developers = await User.find({
      organizations: orgId,
      role: "developer"
    })
    .select("name email role allocatedProblemId")
    .sort({ createdAt: -1 });

    return res.status(200).json(developers);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching workspace developer directory", error: error.message });
  }
};

const addMemberToOrg = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Target developer email parameter is required" });
    }

    const orgId = req.user.organizations?.[0];
    if (!orgId) {
      return res.status(400).json({ message: "Your account is not linked to an active organization workspace" });
    }

    const targetedUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (!targetedUser) {
      return res.status(404).json({ message: "No registered profile found with this email address" });
    }

    const alreadyMember = (targetedUser.organizations || []).some(
      (existingOrgId) => existingOrgId.toString() === orgId.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: "User node is already bound to this organization workspace tenant" });
    }

    targetedUser.organizations = [...(targetedUser.organizations || []), orgId];
    await targetedUser.save();

    await Organization.findByIdAndUpdate(orgId, { $addToSet: { members: targetedUser._id } });

    return res.status(200).json({
      message: "Member successfully appended to your organization workspace",
      user: { id: targetedUser._id, name: targetedUser.name, email: targetedUser.email }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error binding member to workspace environment", error: error.message });
  }
};

module.exports = {
  getOrganizationDevelopers,
  addMemberToOrg
};