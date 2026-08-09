const mongoose = require("mongoose");

const orgSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "canceled"],
      default: "trial",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organization", orgSchema);