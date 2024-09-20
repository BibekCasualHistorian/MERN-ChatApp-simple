const express = require("express");
const { getMessageHistory } = require("../controllers/messageController"); // Adjust path as needed

const messageRoutes = express.Router();

messageRoutes.get("/history", getMessageHistory);

module.exports = messageRoutes;
