const Submission = require("../model/submission.model");
const Problem = require("../model/problem.model");
const submissionQueue = require("../queue/submission.queue");

const submitCode = async (req, res) => {
  try {
    const { problemId, language, code } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "The targeted challenge does not exist" });
    }

    const submission = new Submission({
      user: req.user._id,
      problem: problemId,
      language,
      code,
      status: "Pending",
      totalCount: problem.testCases.length,
    });
    await submission.save();

    await submissionQueue.add("processSubmission", {
      submissionId: submission._id.toString(),
      problemId: problemId.toString(),
    }, {
      removeOnComplete: true,
      removeOnFail: true
    });

    return res.status(202).json({
      message: "Submission received and queued for secure execution",
      submissionId: submission._id,
      status: submission.status,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error queuing code execution payload", error: error.message });
  }
};

const submitTimeout = async (req, res) => {
  try {
    const { problemId, language, code } = req.body;

    if (!problemId) {
      return res.status(400).json({ message: "Problem ID is required" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "The targeted challenge does not exist" });
    }

    const submission = new Submission({
      user: req.user._id,
      problem: problemId,
      language: language || "javascript",
      code: code && code.trim() ? code : "// No code was written before time expired",
      status: "Timed Out",
      totalCount: problem.testCases.length,
      passedCount: 0,
    });
    await submission.save();

    return res.status(201).json({
      message: "Timeout event logged to submission history",
      submissionId: submission._id,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error logging timeout event", error: error.message });
  }
};

const getSubmissionStatus = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("problem", "title")
      .populate("user", "name");

    if (!submission) {
      return res.status(404).json({ message: "Submission record not found" });
    }

    if (
      submission.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "org_admin" &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({ message: "Access Denied: Restricted entry profile" });
    }

    return res.status(200).json({ submission });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching code execution profile status", error: error.message });
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user._id })
      .populate("problem", "title difficulty")
      .sort({ createdAt: -1 });

    return res.status(200).json({ submissions });
  } catch (error) {
    return res.status(500).json({ message: "Error compiling historical history logs", error: error.message });
  }
};

module.exports = {
  submitCode,
  submitTimeout,
  getSubmissionStatus,
  getMySubmissions,
};