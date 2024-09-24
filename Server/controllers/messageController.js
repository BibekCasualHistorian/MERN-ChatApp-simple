const Message = require("../models/messageModel"); // Adjust path as needed

const getMessageHistory = async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      limit = 15,
      getAll = false,
      nextCursor: cursor, // Cursor for pagination
    } = req.query;

    // Convert limit to number
    const limitNumber = parseInt(limit, 10);

    // Validate senderId and receiverId
    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Sender ID and Receiver ID are required",
      });
    }

    // Build the query
    const query = {
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    };

    let messages;
    let totalMessages = 0;
    let nextCursor = null;

    if (getAll) {
      // Fetch all messages without pagination
      messages = await Message.find(query).sort({ timeStamp: -1 }); // Sort messages by latest first
      totalMessages = messages.countDocuments; // Total messages
    } else {
      // Count total messages for pagination
      totalMessages = await Message.countDocuments(query);

      // Fetch messages with cursor-based pagination
      const cursorDate = cursor ? new Date(parseInt(cursor, 10)) : null;

      messages = await Message.find({
        ...query,
        ...(cursorDate && { createdAt: { $lt: cursorDate } }), // Fetch messages older than the cursor
      })
        .sort({ createdAt: -1 }) // Sort messages by latest first
        .limit(limitNumber); // Limit number of messages

      // Set the nextCursor to the createdAt of the last message
      if (messages.length === limitNumber) {
        nextCursor = messages[messages.length - 1].createdAt.getTime();
      }
    }

    // console.log("messages", messages);
    // Prepare response
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: messages,
      nextCursor: nextCursor,
      totalMessages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Server error",
    });
  }
};

module.exports = { getMessageHistory };
