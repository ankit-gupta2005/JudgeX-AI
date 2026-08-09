const mongoose = require("mongoose");

const stageProgressSchema = new mongoose.Schema({
  problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
  order: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "in_progress", "solved", "skipped", "timed_out"],
    default: "pending",
  },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", default: null },
}, { _id: false });

const contestParticipantSchema = new mongoose.Schema(
  {
    contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    currentStageIndex: { type: Number, default: 0 },
    stages: [stageProgressSchema],
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    joinedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    totalTimeSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

contestParticipantSchema.index({ contest: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("ContestParticipant", contestParticipantSchema);