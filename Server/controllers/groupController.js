const GroupModel = require("../models/groupModel");
const MessageModel = require("../models/messageModel");

// Function to get groups for a specific user
exports.getGroupsForUser = async (req, res) => {
  const userId = req.user.user._id; // Assuming the user ID is stored in req.user
  // console.log("userId", userId);

  try {
    // Find groups where the user ID is in the members array
    const groups = await GroupModel.find({ members: userId });

    // console.log("groups", groups);

    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getGroupById = async (req, res) => {
  const { id } = req.params;
  try {
    const group = await GroupModel.findOne({ _id: id });
    return res
      .status(200)
      .json({ success: true, statusCode: 200, data: group });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new group
exports.createGroup = async (req, res) => {
  const { name, members, createdBy } = req.body;
  // console.log("members and name", name, members, createdBy);

  try {
    // Create the new group
    const group = await GroupModel.create({
      name,
      members: [...members], // Add the creator as a member by default
      admin: createdBy,
    });

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Add a member to a group
exports.addMember = async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    const group = await GroupModel.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is already a member",
      });
    }

    group.members.push(userId);
    await group.save();

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get latest 20 messages from a group with cursor pagination
exports.getGroupMessages = async (req, res) => {
  const { nextCursor: cursor, limit = 50 } = req.query; // `cursor` will be the timestamp of the last message received
  const { id: groupId } = req.params;

  try {
    // Ensure groupId is provided
    if (!groupId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Group ID is required",
      });
    }

    // Create the query to fetch the latest 20 messages
    let query = {
      isGroupMessage: true,
      groupId: groupId,
    };

    let nextCursor = null;

    // Fetch messages with cursor-based pagination
    const cursorDate = cursor ? new Date(parseInt(cursor, 10)) : null;

    // Fetch the latest 20 messages, sorted by timestamp (newest first)
    const messages = await MessageModel.find({
      ...query,
      ...(cursorDate && { createdAt: { $lt: cursorDate } }),
    })
      .sort({ timeStamp: -1 })
      .limit(limit);

    // If no messages found, return an empty array
    if (messages.length === 0) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        data: [],
        message: "No more messages found",
      });
    }

    // Set the nextCursor to the createdAt of the last message
    if (messages.length === limit) {
      nextCursor = messages[messages.length - 1].createdAt.getTime();
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: messages,
      nextCursor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Error fetching group messages",
      error: error.message,
    });
  }
};

// Remove a member from a group
exports.removeMember = async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    const group = await GroupModel.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is not a member",
      });
    }

    group.members = group.members.filter((member) => !member.equals(userId));
    await group.save();

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
