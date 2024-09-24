// models/groupModel.js
const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      // Add latestMessage field
      content: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      timeStamp: { type: Date },
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const GroupModel = mongoose.model("Group", groupSchema);
module.exports = GroupModel;
