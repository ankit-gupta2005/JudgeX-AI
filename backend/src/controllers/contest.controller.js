const crypto = require("crypto");
const Redis = require("ioredis");
const Contest = require("../model/contest.model");
const ContestParticipant = require("../model/contestParticipant.model");
const Problem = require("../model/problem.model");
const Submission = require("../model/submission.model");
const submissionQueue = require("../queue/submission.queue");

const redisPublisher = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

const createContest = async (req, res) => {
  try {
    const { title, description, problems, durationDays, organizationId } = req.body;

    if (!Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({ message: "At least one problem stage is required" });
    }

    const formattedProblems = problems.map((p, idx) => ({
      problem: p.problemId,
      order: idx,
      solveTimeLimit: Number(p.solveTimeLimit) || 20,
    }));

    const targetOrganization = organizationId || req.user.organizations?.[0] || null;

    const startsAt = new Date();
    let endsAt = null;
    if (durationDays && Number(durationDays) > 0) {
      endsAt = new Date(startsAt.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);
    }

    const contest = new Contest({
      title,
      description: description || "",
      organization: targetOrganization,
      createdBy: req.user._id,
      problems: formattedProblems,
      startsAt,
      endsAt,
      status: "published",
    });

    await contest.save();

    return res.status(201).json({ message: "Contest created", contest: { id: contest._id, title: contest.title, endsAt: contest.endsAt } });
  } catch (error) {
    return res.status(500).json({ message: "Error creating contest", error: error.message });
  }
};

const getAllContests = async (req, res) => {
  try {
    const { mine } = req.query;
    const queryConditions = {};

    if (mine === "true") {
      if (req.user.role !== "org_admin" && req.user.role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden: management view restricted to administrators" });
      }
      queryConditions.createdBy = req.user._id;
    } else {
      queryConditions.status = "published";
      if (req.user.role !== "super_admin") {
        const userOrgIds = req.user.organizations || [];
        queryConditions.$or = [
          { organization: null },
          { organization: { $in: userOrgIds } },
        ];
      }
    }

    const contests = await Contest.find(queryConditions)
      .select("title description problems status startsAt endsAt organization createdAt")
      .populate("organization", "name")
      .sort({ createdAt: -1 });

    const shaped = contests.map((c) => ({
  _id: c._id,
  title: c.title,
  description: c.description,
  stageCount: c.problems.length,
  status: c.status,
  startsAt: c.startsAt,
  endsAt: c.endsAt,
  organization: c.organization,
  createdAt: c.createdAt,
}));

    return res.status(200).json({ contests: shaped });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching contests", error: error.message });
  }
};

const getContestById = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate("problems.problem", "title difficulty");
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const participant = await ContestParticipant.findOne({ contest: contest._id, user: req.user._id });

    return res.status(200).json({
      contest: {
        _id: contest._id,
        title: contest.title,
        description: contest.description,
        status: contest.status,
        startsAt: contest.startsAt,
        endsAt: contest.endsAt,
        stages: contest.problems.map((p) => ({
          order: p.order,
          solveTimeLimit: p.solveTimeLimit,
          title: p.problem?.title,
          difficulty: p.problem?.difficulty,
        })),
      },
      joined: !!participant,
      participantStatus: participant?.status || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching contest details", error: error.message });
  }
};

const joinContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    if (contest.status !== "published") return res.status(400).json({ message: "This contest is not open" });

    if (contest.endsAt && new Date() > contest.endsAt) {
      return res.status(400).json({ message: "This contest has ended and can no longer be joined" });
    }

    const existing = await ContestParticipant.findOne({ contest: contest._id, user: req.user._id });
    if (existing) return res.status(200).json({ message: "Already joined", participantId: existing._id });

    const sortedProblems = [...contest.problems].sort((a, b) => a.order - b.order);

    const participant = new ContestParticipant({
      contest: contest._id,
      user: req.user._id,
      currentStageIndex: 0,
      stages: sortedProblems.map((p, idx) => ({
        problem: p.problem,
        order: p.order,
        status: idx === 0 ? "in_progress" : "pending",
        startedAt: idx === 0 ? new Date() : null,
      })),
    });

    await participant.save();

    return res.status(201).json({ message: "Joined contest", participantId: participant._id });
  } catch (error) {
    return res.status(500).json({ message: "Error joining contest", error: error.message });
  }
};

const getMyParticipation = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const participant = await ContestParticipant.findOne({ contest: contest._id, user: req.user._id });
    if (!participant) return res.status(404).json({ message: "You have not joined this contest" });

    const currentStage = participant.stages[participant.currentStageIndex];
    let currentProblem = null;

    if (currentStage && participant.status === "in_progress") {
      const problemDoc = await Problem.findById(currentStage.problem);
      if (problemDoc) {
        currentProblem = {
          _id: problemDoc._id,
          title: problemDoc.title,
          description: problemDoc.description,
          difficulty: problemDoc.difficulty,
          timeLimit: problemDoc.timeLimit,
          memoryLimit: problemDoc.memoryLimit,
          boilerplates: problemDoc.boilerplates,
          drivers: problemDoc.drivers,
          testCases: problemDoc.testCases
            .filter((tc) => tc.isSample)
            .map((tc) => ({ _id: tc._id, input: tc.input, expectedOutput: tc.expectedOutput, isSample: true })),
        };
      }
    }

    const contestStageMeta = contest.problems.find(
      (p) => p.problem.toString() === currentStage?.problem?.toString()
    );

    return res.status(200).json({
      participant: {
        currentStageIndex: participant.currentStageIndex,
        totalStages: participant.stages.length,
        status: participant.status,
        stages: participant.stages.map((s) => ({
          order: s.order,
          status: s.status,
        })),
      },
      currentProblem,
      solveTimeLimit: contestStageMeta?.solveTimeLimit || null,
      stageStartedAt: currentStage?.startedAt || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching participation status", error: error.message });
  }
};

const advanceParticipant = (participant) => {
  const nextIndex = participant.currentStageIndex + 1;
  if (nextIndex >= participant.stages.length) {
    participant.status = "completed";
    participant.completedAt = new Date();
    participant.totalTimeSeconds = Math.floor((participant.completedAt - participant.joinedAt) / 1000);
  } else {
    participant.currentStageIndex = nextIndex;
    participant.stages[nextIndex].status = "in_progress";
    participant.stages[nextIndex].startedAt = new Date();
  }
};

const submitContestStage = async (req, res) => {
  try {
    const { id: contestId, stageIndex } = req.params;
    const { language, code } = req.body;
    const idx = Number(stageIndex);

    const participant = await ContestParticipant.findOne({ contest: contestId, user: req.user._id });
    if (!participant) return res.status(404).json({ message: "You have not joined this contest" });
    if (participant.status !== "in_progress") return res.status(400).json({ message: "Contest already completed" });
    if (idx !== participant.currentStageIndex) {
      return res.status(400).json({ message: "This is not your current active stage" });
    }

    const stage = participant.stages[idx];
    const problem = await Problem.findById(stage.problem);
    if (!problem) return res.status(404).json({ message: "Stage problem not found" });

    const submission = new Submission({
      user: req.user._id,
      problem: stage.problem,
      language,
      code,
      status: "Pending",
      totalCount: problem.testCases.length,
      contest: contestId,
      contestStageIndex: idx,
    });
    await submission.save();

    stage.submission = submission._id;
    await participant.save();

    await submissionQueue.add("processSubmission", {
      submissionId: submission._id.toString(),
      problemId: stage.problem.toString(),
      contestId: contestId.toString(),
      participantId: participant._id.toString(),
      stageIndex: idx,
    }, { removeOnComplete: true, removeOnFail: true });

    return res.status(202).json({ submissionId: submission._id, status: "Pending" });
  } catch (error) {
    return res.status(500).json({ message: "Error submitting contest stage", error: error.message });
  }
};

const runDryRunStage = async (req, res) => {
  try {
    const { id: contestId, stageIndex } = req.params;
    const { language, code } = req.body;
    const idx = Number(stageIndex);

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Code is required for a dry run" });
    }

    const participant = await ContestParticipant.findOne({ contest: contestId, user: req.user._id });
    if (!participant) return res.status(404).json({ message: "You have not joined this contest" });
    if (participant.status !== "in_progress") return res.status(400).json({ message: "Contest already completed" });
    if (idx !== participant.currentStageIndex) {
      return res.status(400).json({ message: "This is not your current active stage" });
    }

    const stage = participant.stages[idx];
    const problem = await Problem.findById(stage.problem);
    if (!problem) return res.status(404).json({ message: "Stage problem not found" });

    const dryRunId = crypto.randomUUID();

    await submissionQueue.add("processDryRun", {
      dryRunId,
      problemId: stage.problem.toString(),
      language,
      code,
      isDryRun: true,
    }, { removeOnComplete: true, removeOnFail: true });

    return res.status(202).json({ dryRunId, problemId: stage.problem.toString() });
  } catch (error) {
    return res.status(500).json({ message: "Error queuing dry run", error: error.message });
  }
};

const skipContestStage = async (req, res) => {
  try {
    const { id: contestId, stageIndex } = req.params;
    const { reason } = req.body;
    const idx = Number(stageIndex);

    const participant = await ContestParticipant.findOne({ contest: contestId, user: req.user._id });
    if (!participant) return res.status(404).json({ message: "You have not joined this contest" });
    if (participant.status !== "in_progress") return res.status(400).json({ message: "Contest already completed" });
    if (idx !== participant.currentStageIndex) {
      return res.status(400).json({ message: "This is not your current active stage" });
    }

    const stage = participant.stages[idx];
    if (stage.status === "solved") return res.status(400).json({ message: "This stage is already solved" });

    stage.status = reason === "timeout" ? "timed_out" : "skipped";
    stage.completedAt = new Date();

    advanceParticipant(participant);
    await participant.save();

    redisPublisher.publish("contest_leaderboard_channel", JSON.stringify({ contestId }));

    return res.status(200).json({
      message: "Stage advanced",
      nextStageIndex: participant.currentStageIndex,
      completed: participant.status === "completed",
    });
  } catch (error) {
    return res.status(500).json({ message: "Error skipping contest stage", error: error.message });
  }
};

const getContestLeaderboard = async (req, res) => {
  try {
    const contestId = req.params.id;

    const participants = await ContestParticipant.find({ contest: contestId })
      .populate("user", "name email")
      .lean();

    const ranked = participants
      .map((p) => {
        const solvedCount = p.stages.filter((s) => s.status === "solved").length;
        const elapsedSeconds = p.status === "completed"
          ? p.totalTimeSeconds
          : Math.floor((Date.now() - new Date(p.joinedAt).getTime()) / 1000);

        return {
          userId: p.user._id,
          name: p.user.name,
          email: p.user.email,
          stagesSolved: solvedCount,
          totalStages: p.stages.length,
          status: p.status,
          elapsedSeconds,
        };
      })
      .sort((a, b) => {
        if (b.stagesSolved !== a.stagesSolved) return b.stagesSolved - a.stagesSolved;
        return a.elapsedSeconds - b.elapsedSeconds;
      })
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    return res.status(200).json({ leaderboard: ranked });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching contest leaderboard", error: error.message });
  }
};
const deleteContest = async (req, res) => {
  try {
    const { id } = req.params;

    const contest = await Contest.findById(id);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    const isOwner = contest.createdBy.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === "super_admin";

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ message: "Forbidden: only the contest creator or a super admin can delete this contest" });
    }

    const activeParticipantCount = await ContestParticipant.countDocuments({
      contest: id,
      status: "in_progress",
    });

    if (activeParticipantCount > 0 && req.query.force !== "true") {
      return res.status(409).json({
        message: `${activeParticipantCount} developer(s) are currently in progress on this contest.`,
        requiresConfirmation: true,
        activeParticipantCount,
      });
    }

    await ContestParticipant.deleteMany({ contest: id });
    await Contest.findByIdAndDelete(id);

    return res.status(200).json({ message: "Contest deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting contest", error: error.message });
  }
};


module.exports = {
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
};