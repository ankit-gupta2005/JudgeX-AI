const mongoose = require("mongoose");

const contestProblemSchema = new mongoose.Schema({
  problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
  order: { type: Number, required: true },
  solveTimeLimit: { type: Number, required: true }, 
}, { _id: false });

const contestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    problems: [contestProblemSchema],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contest", contestSchema);