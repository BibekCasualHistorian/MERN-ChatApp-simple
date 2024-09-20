const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId, // Assuming user IDs are ObjectIds
      ref: "User", // Reference to User model
    },
    receiverId: {
      type: Schema.Types.ObjectId, // Assuming user IDs are ObjectIds
      ref: "User", // Reference to User model
    },
    groupId: {
      type: Schema.Types.ObjectId, // Assuming user IDs are ObjectIds
      ref: "User", // Reference to User model
    },
    isGroupMessage: {
      type: Boolean,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timeStamp: {
      type: Date,
      default: Date.now(),
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const MessageModel = mongoose.model("Message", messageSchema);

module.exports = MessageModel;
