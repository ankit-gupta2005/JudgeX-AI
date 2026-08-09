const mongoose = require("mongoose");

const dashboardSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    acceptedSubmissions: {
      type: Number,
      default: 0,
    },
    activeTestsCount: {
      type: Number,
      default: 0,
    },
    totalRegisteredDevelopers: {
      type: Number,
      default: 0,
    },
    dailyActivityMetrics: [
      {
        date: { type: String, required: true },
        submissionCount: { type: Number, default: 0 },
        passRate: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Dashboard", dashboardSchema);