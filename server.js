const express = require("express");
const app = express();
let cors = require("cors");
app.use(cors());
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://91.121.75.14:3003",
      "http://91.121.75.14:3000",
      "https://lepetitbac.online",
      "https://www.lepetitbac.online",
    ],
    methods: ["GET", "POST"],
  },
});
require("dotenv").config();
const logger = require("./tools/logger.js");
const lod_ = require("lodash");
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
const waitingRoutes = require("./routes/waiting.js");
const chatRoutes = require("./routes/chat.js");
const gameRoutes = require("./routes/game.js");

function deleteUser(id) {
  let userUUID = SocketManager.disconnectUser(id);
  let user = UserManager.get(userUUID);

  let previousUUID = lod_.clone(user?.actualPartyUUID);

  if (previousUUID) {
    PartyManager.deleteUserFromParty(userUUID, user.actualPartyUUID);
  }

  UserManager.deleteUser(userUUID);

  if (previousUUID) {
    PartyManager.sendRefreshParty(previousUUID);
  }
}
/**
 * catch errors
 */
process.on("uncaughtException", function (err) {
  logger.error("Caught exception: " + err);

  const fs = require("fs");
  const errorLog = fs.createWriteStream("error.log", { flags: "a" });
  let strBase = `Le ${new Date().toLocaleDateString(
    "fr"
  )} à ${new Date().toLocaleTimeString("fr")} : `;
  errorLog.write(`${strBase} Caught exception: ${err}\n`);
});
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
    /**
     * Check if user already exists, if yes, he was AFK and reconnect him
     */
    let user = UserManager.get(uuid);
    if (user) {
      user.AFK = false;
    }
    /**
     * Update total users
     */
    let totalUser = UserManager.getTotalUsers();
    SocketManager.sendToUser(uuid, "updateOnlineUsers", {
      onlineUsers: totalUser,
    });
  });

  socket.on("disconnected", () => {
    logger.info(`SV : [DISCONNECTED] Socket ID = ${socket.id}`);
    deleteUser(socket.id);
  });

  socket.on("disconnect", () => {
    logger.info(
      `SV : [DISCONNECT] Socket ID = ${socket.id}, user has 1 minute to reconnect`
    );
    let userUUID = SocketManager.getUUIDBySocketId(socket.id);
    let user = UserManager.get(userUUID);

    if (!user) return;

    user.AFK = true;
    /**
     * Wait 1 minute.
     * If user reconnects, the socket will be updated
     * If not, the user will be deleted
     */
    setTimeout(() => {
      let refreshedUser = UserManager.get(userUUID);
      if (refreshedUser && refreshedUser.AFK) {
        deleteUser(socket.id);
      }
    }, 60000);
  });

  loginRoute.listen(socket);
  lobbyRoutes.listen(socket);
  waitingRoutes.listen(socket);
  chatRoutes.listen(socket);
  gameRoutes.listen(socket);
});

app.get("/parties", (req, res) => {
  let allParties = PartyManager.getAll();
  let parsedParties = Object.keys(allParties).map((key) => allParties[key]);
  res.json({ count: Object.keys(allParties).length, parties: parsedParties });
});

/**
 * Listen server
 */
server.listen(process.env.PORT, () => {
  logger.info("Server version 1.0");
  logger.info(`listening on PORT : ${process.env.PORT}`);
});
