const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
    language: {
      type: String,
      enum: ["cpp", "java", "python", "javascript"],
      required: true,
    },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "Pending", "Compiling", "Running", "Accepted", "Wrong Answer",
        "Time Limit Exceeded", "Runtime Error", "Compilation Error", "Timed Out",
      ],
      default: "Pending",
    },
    executionTime: { type: Number, default: 0 },
    memoryUsed: { type: Number, default: 0 },
    errorLog: { type: String, default: null },
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", default: null },
    contestStageIndex: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);