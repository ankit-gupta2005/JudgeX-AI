const Problem = require("../model/problem.model");
const User = require("../model/user.model");

const createProblem = async (req, res) => {
  try {
    const { title, description, difficulty, tags, timeLimit, memoryLimit, solveTimeLimit, boilerplates, drivers, testCases, organizationId } = req.body;

    const formattedTestCases = Array.isArray(testCases)
      ? testCases.map((tc) => ({
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          isSample: String(tc.isSample) === "true" || tc.isSample === true,
        }))
      : [];

    const targetOrganization = organizationId || req.user.organizations?.[0] || null;

    const newProblem = new Problem({
      title,
      description,
      difficulty,
      tags: tags || [],
      timeLimit: timeLimit || 2000,
      memoryLimit: memoryLimit || 512,
      solveTimeLimit: solveTimeLimit ? Number(solveTimeLimit) : null,
      boilerplates: boilerplates || {},
      drivers: drivers || {},
      testCases: formattedTestCases,
      createdBy: req.user._id,
      organization: targetOrganization,
    });

    await newProblem.save();

    return res.status(201).json({
      message: "Coding problem successfully added to the system bank",
      problem: { id: newProblem._id, title: newProblem.title, difficulty: newProblem.difficulty },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error compiling challenge configuration", error: error.message });
  }
};

const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, difficulty, tags, timeLimit, memoryLimit, solveTimeLimit, boilerplates, drivers, testCases } = req.body;

    const formattedTestCases = Array.isArray(testCases)
      ? testCases.map((tc) => ({
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          isSample: String(tc.isSample) === "true" || tc.isSample === true,
        }))
      : [];

    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      {
        title,
        description,
        difficulty,
        tags: tags || [],
        timeLimit: timeLimit || 2000,
        memoryLimit: memoryLimit || 512,
        solveTimeLimit: solveTimeLimit ? Number(solveTimeLimit) : null,
        boilerplates: boilerplates || {},
        drivers: drivers || {},
        testCases: formattedTestCases,
      },
      { new: true, runValidators: true }
    );

    if (!updatedProblem) {
      return res.status(404).json({ message: "The targeted challenge does not exist" });
    }

    return res.status(200).json({
      message: "Challenge configuration updated successfully",
      problem: updatedProblem,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating challenge configuration", error: error.message });
  }
};

const getAllProblems = async (req, res) => {
  try {
    const queryConditions = {};

    if (req.user.role !== "super_admin") {
      const userOrgIds = req.user.organizations || [];
      queryConditions.$or = [
        { organization: null },
        { organization: { $in: userOrgIds } }
      ];
    }

    const problems = await Problem.find(queryConditions)
      .select("title difficulty tags timeLimit memoryLimit solveTimeLimit organization")
      .populate("organization", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(problems);
  } catch (error) {
    return res.status(500).json({ message: "Error pulling programming index profiles", error: error.message });
  }
};

const getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: "The targeted challenge does not exist" });
    }

    if (problem.organization && req.user.role !== "super_admin") {
      const userOrgIds = (req.user.organizations || []).map((orgId) => orgId.toString());
      if (!userOrgIds.includes(problem.organization.toString())) {
        return res.status(403).json({ message: "Access Denied: Restricted Tenant Challenge Workspace" });
      }
    }

    const clientProblem = problem.toObject();

    clientProblem.testCases = problem.testCases.map((tc) => ({
      _id: tc._id,
      input: tc.input,
      expectedOutput: tc.isSample ? tc.expectedOutput : undefined,
      isSample: tc.isSample,
    }));

    return res.status(200).json(clientProblem);
  } catch (error) {
    return res.status(500).json({ message: "Error unpacking challenge workspace variables", error: error.message });
  }
};

const allocateProblem = async (req, res) => {
  try {
    const { problemId, developerEmail } = req.body;

    if (!problemId || !developerEmail) {
      return res.status(400).json({ message: "Problem ID and Developer Email parameters are required" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: developerEmail.trim().toLowerCase(), role: "developer" },
      { $set: { allocatedProblemId: problemId } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Developer node not found in this workspace registry" });
    }

    return res.status(200).json({
      message: "Challenge successfully allocated to user node.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Error allocating challenge parameters", error: error.message });
  }
};

const deallocateProblem = async (req, res) => {
  try {
    const { developerEmail } = req.body;

    if (!developerEmail) {
      return res.status(400).json({ message: "Developer email is required" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: developerEmail.trim().toLowerCase(), role: "developer" },
      { $unset: { allocatedProblemId: "" } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Developer not found in this workspace registry" });
    }

    return res.status(200).json({
      message: "Problem unassigned from developer.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Error removing problem assignment", error: error.message });
  }
};

module.exports = {
  createProblem,
  updateProblem,
  getAllProblems,
  getProblemById,
  allocateProblem,
  deallocateProblem,
};