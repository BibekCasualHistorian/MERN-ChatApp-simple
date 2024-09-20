require("dotenv").config();

// Importing DB connect
const connectDB = require("./db/connectDB");

// importing routes
const { userRoutes } = require("./routes/userRoute");

const { Server } = require("socket.io");

// setInterval(() => {
//   console.log("memeoy usage: ", process.memoryUsage());
// }, 20000);

// Express App
const express = require("express");
const app = express();
const PORT = 3000;

const http = require("http");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// helmet
const helmet = require("helmet");
// this returs a function and we would like to use it for our middleware
// it sets the header to our request
// it is better to use helmet at the top of middleware so that security headers
// become set at the start of the response
app.use(helmet()); // add security
// check in postman, without helment we would normally have 7-10 headers while with helment
// we would have 15-20 header added such as Cross Origin Resource policy, Referrer policy etc

// rate limit
// rate limti is a function . when we call that function it is going to return another function
// that is going to be middleware function
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      error: "Too many requests. Please try again later.",
    });
  },
});

// this enable hackers to not know about the technology we are using
app.disable("x-powered-by"); // less hackers know about our stack

// Cors
const cors = require("cors");

// Cookie-Parser
const cookieParser = require("cookie-parser");
const MessageModel = require("./models/messageModel");
const messageRoutes = require("./routes/messageRoute");
const groupRoutes = require("./routes/groupRoute");
const GroupModel = require("./models/groupModel");

// middleware
app.use(cookieParser({}));
app.use(express.json({ limit: "10kb" })); // it is necessary to set it to prevent DOS attacks
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use("/api", limiter); // works on all api routes that starts with /api
// it helps in preventing Brute force attacks and denail of Service

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

const connectedUserIdToSocketId = new Map();
let activeRooms = [];

io.on("connection", function (socket) {
  console.log("a user connected", socket.id);

  socket.on("register", function (data) {
    if (!data || !data._id) {
      console.error("Invalid registration data received:", data);
      return;
    }

    connectedUserIdToSocketId.set(data._id, socket.id);

    // console.log("Connected Users Map:", connectedUserIdToSocketId);
    // Check if user is already connected (e.g., for reconnection scenarios)
    // const existingUserIndex = connectedUserIdToSocketId.findIndex(
    //   (user) => user.userId === data._id
    // );

    // const connectedUser = {
    //   userId: data._id,
    //   socketId: socket.id,
    // };

    // If user already exists, update their socketId
    // if (existingUserIndex !== -1) {
    //   connectedUserIdToSocketId[existingUserIndex].socketId = socket.id;
    // } else {
    //   // Otherwise, push the new user into the array
    //   connectedUserIdToSocketId.push(connectedUser);
    // }
    // console.log("Connected Users Array:", connectedUserIdToSocketId);
    // Emit a response back to the client who registered,  send back to whoever sent it
    socket.emit("new-user-connected", {
      message: `You ${data._id} are now connected to socket ${socket.id}`,
    }); // send back
    socket.broadcast.emit("new-user-connected-notice", {
      message: `New user ${data._id} connected`,
    }); // sending to everyone except itself
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
    console.log("activeRoom after disconect", activeRooms);
  });

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
    socket.join(groupId);

    activeRooms = [...activeRooms, { groupId, userId }];

    socket.emit("room-joined", { data: "You joined the group " + groupId }); // send to itself
    // io.to(groupId).emit("room-joined-notice", {
    //   data: `The user ${userId} has joined the group ${groupId}`,
    // }); // send to all member to the group
    socket.broadcast.to(groupId).emit("room-joined-notice", {
      data: `The user ${userId} has joined the group ${groupId}`, // sends to everyone in room except itselfs
    });

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
        const { senderId, groupId, isGroupMessage, content, timeStamp } = data;
        const groupMessage = await MessageModel.create({
          senderId: senderId,
          groupId: groupId,
          receiverId: null,
          isGroupMessage: isGroupMessage,
          content: content,
          timeStamp: timeStamp,
        });
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

        if (!recipientSocketId) {
          return socket.emit("error", {
            message: "User not found or offline",
          });
        }
        io.to(recipientSocketId).emit("receive-message", data); // send to user who have specific socket id
        socket.emit("receive-message", data);
      }
    } catch (error) {
      console.log("error in send-msg", error);
    }
  });

  // socket.emit("receive-message", data); // send back to whoever sent it
  // socket.broadcast.emit("receive-message", data); // send to everyone except whoever sent it
  // io.emit("receive-message", data); // send to everyone even newly connected one

  // socket.on("chat-message", (msg) => { // listen for event
  //   // it sends to everyone
  //   console.log("chat-message", msg);
  //   io.emit("chat-message", msg); // send to everyone
  // });

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

  // console.log(" connectedUserIdToSocketId", connectedUserIdToSocketId);
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Connecting to Database
connectDB(process.env.MONGO_URI)
  .then(() => {
    // app.listen(PORT, () =>
    //   console.log(`Example app listening on port ${PORT}!`)
    // );
    server.listen(PORT, () =>
      console.log(`Example app listening on port ${PORT}!`)
    );
  })
  .catch((error) => {
    console.log("Error while connecting to database", error);
  });
