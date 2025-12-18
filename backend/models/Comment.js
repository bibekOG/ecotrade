const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    postId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      max: 500,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
