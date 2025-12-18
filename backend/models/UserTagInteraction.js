const mongoose = require("mongoose");

const UserTagInteractionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    tagInteractions: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserTagInteraction", UserTagInteractionSchema);
