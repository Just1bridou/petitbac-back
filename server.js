const express = require("express");
const app = express();
let cors = require("cors");
app.use(cors());
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
require("dotenv").config();
const logger = require("./tools/logger.js");
/**
 * Custom packages
 */
logger.info("Starting server...");
/**
 * Managers
 */
const SocketManager = require("./manager/socketManager.js");
const UserManager = require("./manager/userManager.js");
const PartyManager = require("./manager/partyManager.js");
SocketManager.clear();
UserManager.clear();
PartyManager.clear();

/**
 * Routes
 */
const loginRoute = require("./routes/login.js");
const lobbyRoutes = require("./routes/lobby.js");
/**
 * Socket connection
 */
io.on("connection", (socket) => {
  logger.info("SV : New user connected");
  /**
   * Save user's socket when connection is established
   */
  socket.on("saveUser", ({ uuid }) => {
    logger.info(`SV : Con ${socket.id} registered as ${uuid}`);
    // socket.uuid = uuid;
    SocketManager.registerConnection(uuid, socket);
    let totalUser = UserManager.getTotalUsers();
    SocketManager.sendToUser(uuid, "updateOnlineUsers", {
      onlineUsers: totalUser,
    });
  });

  socket.on("disconnected", () => {
    logger.info(`SV : User ${socket.id} disconnected`);
    let userUUID = SocketManager.disconnectUser(socket.id);
    UserManager.deleteUser(userUUID);
  });

  loginRoute.listen(socket);
  lobbyRoutes.listen(socket);
});

app.get("/sockets", (req, res) => {
  let r = [];
  SocketManager.print();
  console.log(SocketManager.sockets);
  for (let socket in SocketManager.sockets) {
    r.push(socket);
  }
  console.log(r);
  res.json(r);
});

/**
 * Listen server
 */
server.listen(process.env.PORT, () => {
  logger.info(`listening on PORT : ${process.env.PORT}`);
});
