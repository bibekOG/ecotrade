const mongoose = require("mongoose");

const AdSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      max: 100,
    },
    description: {
      type: String,
      required: true,
      max: 200,
    },
    image: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: true,
      max: 50,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Expired"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validTill: {
      type: Date,
      required: true,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    impressionCount: {
      type: Number,
      default: 0,
    },
    targetCategory: {
      type: String,
      enum: ["All", "Books", "Electronics", "Clothing", "Home", "Sports", "Other"],
      default: "All",
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ad", AdSchema);