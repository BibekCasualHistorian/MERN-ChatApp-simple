const express = require("express");
const GroupController = require("../controllers/groupController");
const { requireAuth } = require("../middlewares/requireAuth");

const groupRoutes = express.Router();

// Create a new group
groupRoutes.post("/create", requireAuth, GroupController.createGroup);

groupRoutes.get(
  "/get-groups-for-user",
  requireAuth,
  GroupController.getGroupsForUser
);

// Get group details
groupRoutes.get(
  "/get-group-by-id/:id",
  requireAuth,
  GroupController.getGroupById
);

// get message for groups
groupRoutes.get(
  "/get-group-messages/:id",
  requireAuth,
  GroupController.getGroupMessages
);

// Add a member to a group
groupRoutes.post("/:id/add-member", requireAuth, GroupController.addMember);

// Remove a member from a group
groupRoutes.post(
  "/:id/remove-member",
  requireAuth,
  GroupController.removeMember
);

module.exports = groupRoutes;
