const GroupModel = require("../models/groupModel");
const MessageModel = require("../models/messageModel");

const connectedUserIdToSocketId = new Map();
let activeRooms = [];

const handleActiveUsers = () => {
  const arr = [];
  for (let [userId, socketId] of connectedUserIdToSocketId.entries()) {
    arr.push(userId);
  }
  return arr;
};

module.exports = (io) => {
  io.on("connection", function (socket) {
    // console.log("a user connected", socket.id);

    socket.on("register", function (data) {
      if (!data || !data._id) {
        console.error("Invalid registration data received:", data);
        return;
      }

      connectedUserIdToSocketId.set(data._id, socket.id);

      // Emit a response back to the client who registered,  send back to whoever sent it
      socket.emit("new-user-connected", {
        message: `You ${data._id} are now connected to socket ${socket.id}`,
      }); // send back
      socket.broadcast.emit("new-user-connected-notice", {
        message: `New user ${data._id} connected`,
      }); // sending to everyone except itself
      console.log("connectedUserIdToSocketId", connectedUserIdToSocketId);

      io.emit("active-users", handleActiveUsers());
    });

    socket.on("disconnect", function () {
      // console.log("user disconnected");
      let disconnectedUserId;

      // console.log("connectedUserIdToSocketId", connectedUserIdToSocketId);

      // Find the user ID associated with this socket
      for (let [userId, socketId] of connectedUserIdToSocketId.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }

      // console.log("userId that is leaving", disconnectedUserId);

      activeRooms = activeRooms.filter(
        (each) => each.userId != disconnectedUserId
      );

      // console.log("leavingUserIdToSocketId: ", leavingUserIdToSocketId);
      connectedUserIdToSocketId.delete(disconnectedUserId);
      socket.emit("user-disconnected", {
        message: `you ${disconnectedUserId} just disconnected`,
      });
      socket.broadcast.emit("user-disconnected-notice", {
        message: `The user ${disconnectedUserId} just left`,
      });
      io.emit("active-users", handleActiveUsers());
      console.log("activeRoom after disconect", activeRooms);
    });

    socket.on("typing", function (data) {});

    socket.on("stopped-typing", function (data) {});

    socket.on("join-group", async (data) => {
      // let messages = await MessageModel.deleteMany({ isGroupMessage: true });

      const { groupId, userId } = data;
      console.log("join-group", groupId, userId);
      const group = await GroupModel.findById(groupId).populate("members");
      if (!group) {
        return socket.emit("error", { message: "Group not found" });
      }

      // Ensure the user is a member of the group before joining the socket room
      if (!group.members.some((member) => member._id.toString() === userId)) {
        return socket.emit("error", {
          message: "You are not a member of this group",
        });
      }

      const isAlreadyJoined = activeRooms.filter((each) => {
        return each.groupId == groupId && each.userId == userId;
      });

      if (isAlreadyJoined.length == 0) {
        socket.join(groupId);

        activeRooms = [...activeRooms, { groupId, userId }];

        socket.emit("room-joined", { data: "You joined the group " + groupId }); // send to itself
        // io.to(groupId).emit("room-joined-notice", {
        //   data: `The user ${userId} has joined the group ${groupId}`,
        // }); // send to all member to the group
        socket.broadcast.to(groupId).emit("room-joined-notice", {
          data: `The user ${userId} has joined the group ${groupId}`, // sends to everyone in room except itselfs
        });
      } else {
        socket.emit("already-joined", { message: "you are already joined" });
      }
      io.emit("active-users", handleActiveUsers());

      console.log("activeRooms after joining room: ", activeRooms);

      // // Send updated list of active users to the group
      // const activeUsers = activeRooms.find((room) => room[0] === groupId)[1];
      // io.to(groupId).emit("active-users", { users: activeUsers });

      // console.log("activeRooms:", activeRooms);
    });

    socket.on("send-msg", async function (data) {
      console.log("data in send-msg", data);
      // console.log("connectedUserIdToSocket", connectedUserIdToSocketId);
      // save the message to the database
      try {
        if (data.isGroupMessage) {
          console.log(" an GroupMessage");
          const { senderId, groupId, isGroupMessage, content, timeStamp } =
            data;
          const groupMessage = await MessageModel.create({
            senderId: senderId,
            groupId: groupId,
            receiverId: null,
            isGroupMessage: isGroupMessage,
            content: content,
            timeStamp: timeStamp,
          });

          // Update the latestMessage field in the group
          await GroupModel.findByIdAndUpdate(
            groupId,
            {
              latestMessage: {
                content: content,
                senderId: senderId,
                timeStamp: timeStamp,
              },
            },
            { new: true } // Return the updated document
          );

          console.log("group message send to DB", { data: groupMessage });
          // socket.broadcast
          //   .to(groupId)
          //   .emit("receive-message", { data: groupMessage }); // send to everyone except itself in the room
          io.to(groupId).emit("receive-message", { data: groupMessage }); //send to everyone in the room
          // socket.emit("receive-message", { data: groupMessage });
        } else {
          console.log("is not group message");
          const { senderId, receiverId, isGroupMessage, content, timeStamp } =
            data;
          const oneToOneMessage = await MessageModel.create({
            senderId: senderId,
            receiverId: receiverId,
            groupId: null,
            isGroupMessage: isGroupMessage,
            content: content,
            timeStamp: timeStamp,
          });
          console.log("message saved to DB", oneToOneMessage);
          const recipientSocketId = connectedUserIdToSocketId.get(receiverId);

          // if (!recipientSocketId) {
          //   return socket.emit("error", {
          //     message: "User not found or offline",
          //   });
          // }
          io.to(recipientSocketId).emit("receive-message", data); // send to user who have specific socket id
          socket.emit("receive-message", data);
        }
      } catch (error) {
        console.log("error in send-msg", error);
      }
      io.emit("active-users", handleActiveUsers());
    });

    socket.on("leave-group", async (data) => {
      const { groupId, userId } = data;
      console.log("leave-group", groupId, userId);
      const group = await GroupModel.findById(groupId);
      if (!group) {
        return socket.emit("error", { message: "Group not found" });
      }

      // Ensure the user is a member of the group
      if (!group.members.some((member) => member._id.toString() === userId)) {
        return socket.emit("error", {
          message: "You are not a member of this group",
        });
      }

      socket.leave(groupId);

      activeRooms = activeRooms.filter((each) => {
        const isMatching = each.groupId === groupId && each.userId === userId;
        return !isMatching;
      });

      // Notify the group members that the user has left
      io.to(groupId).emit("group-left-notice", {
        data: `The user ${userId} has left the group ${groupId}`,
      });

      socket.emit("group-left", { data: `You left group ${groupId}` });

      // activeUsers sent to frontend
      const activeUsers =
        activeRooms.find((room) => room[0] === groupId)?.[1] || [];
      io.to(groupId).emit("active-users", { users: activeUsers });

      console.log("activeRooms after leave-group:", activeRooms);
    });

    io.emit("active-users", handleActiveUsers());

    // console.log(" connectedUserIdToSocketId", connectedUserIdToSocketId);
  });
};
