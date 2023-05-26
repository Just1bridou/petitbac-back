const express = require("express");
const app = express();
let cors = require("cors");
app.use(cors());
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const lod_ = require("lodash");
require("dotenv").config();
/**
 * Custom packages
 */
const logger = require("./tools/logger.js");
/**
 * Configure sockets
 */
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
/**
 * Managers
 */
const SocketManager = require("./manager/socketManager.js");
const UserManager = require("./manager/userManager.js");
const PartyManager = require("./manager/partyManager.js");
const { connect, getFlashConfig } = require("./manager/database.js");
/**
 * Routes
 */
const loginRoute = require("./routes/login.js");
const lobbyRoutes = require("./routes/lobby.js");
const waitingRoutes = require("./routes/waiting.js");
const chatRoutes = require("./routes/chat.js");
const gameRoutes = require("./routes/game.js");
// Games
const flashRoutes = require("./routes/flash.js");
const { HunspellReader } = require("hunspell-reader");

logger.info("Starting server...");

/**
 * Function init used to connected to database before starting server
 */
async function init() {
  await connect();

  SocketManager.clear();
  UserManager.clear();
  PartyManager.clear();

  getFlashConfig();

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
    flashRoutes.listen(socket);
  });
  /**
   * Routes
   */
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
}
/**
 * Start back
 */
init();
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
 * Delete user from all managers
 * @param {*} id
 */
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
