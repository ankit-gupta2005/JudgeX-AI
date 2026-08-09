const Submission = require("../model/submission.model");
const Problem = require("../model/problem.model");
const User = require("../model/user.model");

const getDashboardStats = async (req, res) => {
  try {
    let orgId = null;

    if (req.user.role === "org_admin") {
      orgId = req.user.organizations?.[0] || null;
      if (!orgId) {
        return res.status(403).json({ message: "No organization associated with this account" });
      }
    } else if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden: Access restricted to administrators" });
    }

    const problemFilter = orgId ? { organization: orgId } : {};
    const problemCount = await Problem.countDocuments(problemFilter);

    const userFilter = { role: "developer" };
    if (orgId) {
      userFilter.organizations = orgId;
    }
    const developerCount = await User.countDocuments(userFilter);

    let submissionFilter = {};
    if (orgId) {
      const orgProblems = await Problem.find({ organization: orgId }).select("_id");
      const problemIds = orgProblems.map(p => p._id);
      submissionFilter.problem = { $in: problemIds };
    }

    const totalSubmissions = await Submission.countDocuments(submissionFilter);
    const acceptedSubmissions = await Submission.countDocuments({ ...submissionFilter, status: "Accepted" });
    const wrongAnswerSubmissions = await Submission.countDocuments({ ...submissionFilter, status: "Wrong Answer" });
    const errorSubmissions = await Submission.countDocuments({
      ...submissionFilter,
      status: { $in: ["Runtime Error", "Time Limit Exceeded", "Compilation Error", "Timed Out"] }
    });

    const pipelineData = await Submission.aggregate([
      { $match: submissionFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    const weeklySubmissions = pipelineData
      .map(item => ({ label: item._id, value: item.count }))
      .reverse();

    return res.status(200).json({
      stats: {
        totalUsers: developerCount,
        totalProblems: problemCount,
        totalSubmissions,
        acceptedSubmissions,
        wrongAnswerSubmissions,
        errorSubmissions,
        weeklySubmissions
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error compiling calculation summaries", error: error.message });
  }
};

const STATUS_BUCKETS = {
  accepted: ["Accepted"],
  wrong_answer: ["Wrong Answer"],
  errors: ["Runtime Error", "Time Limit Exceeded", "Compilation Error", "Timed Out"],
};

const getSubmissionsByStatus = async (req, res) => {
  try {
    const { bucket } = req.query;

    if (!bucket || !STATUS_BUCKETS[bucket]) {
      return res.status(400).json({
        message: "Invalid or missing bucket parameter. Use one of: accepted, wrong_answer, errors",
      });
    }

    let orgId = null;

    if (req.user.role === "org_admin") {
      orgId = req.user.organizations?.[0] || null;
      if (!orgId) {
        return res.status(403).json({ message: "No organization associated with this account" });
      }
    } else if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden: Access restricted to administrators" });
    }

    const filter = { status: { $in: STATUS_BUCKETS[bucket] } };

    if (orgId) {
      const orgProblems = await Problem.find({ organization: orgId }).select("_id");
      const problemIds = orgProblems.map(p => p._id);
      filter.problem = { $in: problemIds };
    }

    const submissions = await Submission.find(filter)
      .populate("user", "name email")
      .populate("problem", "title difficulty")
      .select("user problem language status code executionTime memoryUsed passedCount totalCount createdAt")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ bucket, submissions });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching submission detail records", error: error.message });
  }
};

module.exports = { getDashboardStats, getSubmissionsByStatus };