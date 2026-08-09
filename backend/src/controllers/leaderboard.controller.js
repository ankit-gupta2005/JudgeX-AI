const Submission = require("../model/submission.model");
const Problem = require("../model/problem.model");
const User = require("../model/user.model");
const Organization = require("../model/org.model");

const GLOBAL_WORKSPACE_NAME = process.env.GLOBAL_WORKSPACE_NAME || "JudgeX";


const buildOrgLeaderboard = async (orgId) => {
  const developers = await User.find({ role: "developer", organizations: orgId })
    .select("_id name email")
    .lean();
  const developerIds = developers.map((d) => d._id);

  if (developerIds.length === 0) return [];

  const orgProblems = await Problem.find({ organization: orgId }).select("_id");
  const problemIds = orgProblems.map((p) => p._id);

  const matchStage = {
    user: { $in: developerIds },
    problem: { $in: problemIds },
  };

  const aggregation = await Submission.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$user",
        totalSubmissions: { $sum: 1 },
        acceptedSubmissions: {
          $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] },
        },
        solvedProblems: {
          $addToSet: {
            $cond: [{ $eq: ["$status", "Accepted"] }, "$problem", "$$REMOVE"],
          },
        },
        lastSubmissionAt: { $max: "$createdAt" },
      },
    },
    {
      $project: {
        totalSubmissions: 1,
        acceptedSubmissions: 1,
        problemsSolved: { $size: "$solvedProblems" },
        lastSubmissionAt: 1,
        passRate: {
          $cond: [
            { $eq: ["$totalSubmissions", 0] },
            0,
            { $multiply: [{ $divide: ["$acceptedSubmissions", "$totalSubmissions"] }, 100] },
          ],
        },
      },
    },
  ]);

  const statsByUserId = new Map(aggregation.map((entry) => [entry._id.toString(), entry]));

  const leaderboard = developers.map((dev) => {
    const entry = statsByUserId.get(dev._id.toString());
    return {
      userId: dev._id,
      name: dev.name,
      email: dev.email,
      problemsSolved: entry?.problemsSolved || 0,
      totalSubmissions: entry?.totalSubmissions || 0,
      acceptedSubmissions: entry?.acceptedSubmissions || 0,
      passRate: entry ? Math.round(entry.passRate) : 0,
      lastSubmissionAt: entry?.lastSubmissionAt || null,
    };
  });

  leaderboard.sort((a, b) => {
    if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
    if (b.passRate !== a.passRate) return b.passRate - a.passRate;
    return a.totalSubmissions - b.totalSubmissions;
  });

  return leaderboard.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
};

const getGlobalLeaderboard = async (req, res) => {
  try {
    const globalOrg = await Organization.findOne({ name: GLOBAL_WORKSPACE_NAME }).select("_id name");
    if (!globalOrg) {
      return res.status(404).json({ message: "Global workspace has not been configured yet" });
    }

    const leaderboard = await buildOrgLeaderboard(globalOrg._id);

    return res.status(200).json({
      scope: "global",
      organizationName: globalOrg.name,
      leaderboard,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error compiling global leaderboard rankings", error: error.message });
  }
};

const getMyOrgLeaderboard = async (req, res) => {
  try {
    const globalOrg = await Organization.findOne({ name: GLOBAL_WORKSPACE_NAME }).select("_id");
    const globalOrgId = globalOrg?._id?.toString() || null;

    let targetOrgId = null;

    if (req.user.role === "org_admin") {
      targetOrgId = req.user.organizations?.[0] || null;
    } else if (req.user.role === "developer") {
      const nonGlobalOrgId = (req.user.organizations || []).find(
        (id) => id.toString() !== globalOrgId
      );
      targetOrgId = nonGlobalOrgId || null;
    } else {
      return res.status(400).json({
        message: "Super admins don't have a personal organization. Use the global leaderboard instead.",
      });
    }

    if (!targetOrgId) {
      return res.status(200).json({
        scope: "mine",
        organizationName: null,
        leaderboard: [],
        message: "You haven't been added to a company organization yet.",
      });
    }

    const org = await Organization.findById(targetOrgId).select("name");
    const leaderboard = await buildOrgLeaderboard(targetOrgId);

    return res.status(200).json({
      scope: "mine",
      organizationName: org?.name || null,
      leaderboard,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error compiling organization leaderboard rankings", error: error.message });
  }
};

module.exports = { getGlobalLeaderboard, getMyOrgLeaderboard };