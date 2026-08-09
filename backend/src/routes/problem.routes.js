const express = require("express");
const router = express.Router();
const {
  createProblem,
  updateProblem,
  getAllProblems,
  getProblemById,
  allocateProblem,
  deallocateProblem,
} = require("../controllers/problem.controller");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrgAccess = require("../middleware/org.middleware");
const Problem = require("../model/problem.model");

router.post("/", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), createProblem);
router.get("/", authenticateToken, getAllProblems);
router.get("/:id", authenticateToken, getProblemById);
router.put("/:id", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), updateProblem);

router.post("/allocate", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), allocateProblem);
router.post("/deallocate", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), deallocateProblem);

router.delete("/:id", authenticateToken, requireOrgAccess(["org_admin", "super_admin"]), async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ message: "Challenge not found" });
    res.status(200).json({ success: true, message: "Challenge removed cleanly" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;