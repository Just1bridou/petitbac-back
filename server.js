require("dotenv").config();

const querystring = require("querystring");
const express = require("express");
const session = require("express-session");

const { passport, checkJwt } = require("./auth/auth");
const app = express();
let cors = require("cors");
app.use(cors());
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const lod_ = require("lodash");
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
  maxHttpBufferSize: 1e10,
});
/**
 * Managers
 */
const SocketManager = require("./manager/socketManager.js");
const UserManager = require("./manager/userManager.js");
const PartyManager = require("./manager/partyManager.js");
const {
  connect,
  getFlashConfig,
  isUserAllowed,
  getAllErrors,
  updateError,
  deleteError,
} = require("./manager/database.js");
/**
 * export
 */
module.exports = {
  getPartiesCount,
  getUsersCount,
};

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
const DiscordManager = require("./manager/discordBot.js");

logger.info("Starting server...");

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
    // logger.info("SV : New user connected");
    socket.on("error", (err) => {
      logger.error(`SOCKET error due to ${err.message}`);
    });

    /**
     * Save user's socket when connection is established
     */
    socket.on("saveUser", ({ uuid }, callback) => {
      if (callback) {
        callback({ status: 200 });
      }
      // logger.info(`SV : Con ${socket.id} registered as ${uuid}`);
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

    socket.on("disconnected", (data, callback) => {
      if (callback) {
        callback({ status: 200 });
      }

      logger.info(
        `SV : [DISCONNECTED] Socket ID = ${socket.id} (user force disconnect)`
      );
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
 * Discord
 */
DiscordManager.init();
/**
 * ################
 * ################
 * BACK INTERFACE
 * ################
 * ################
 */
app.set("trust proxy", 1);

app.use(
  session({
    secret: "cs2>valorant",
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: true },
  })
);
app.use(express.json());
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

app.get("/parties", checkJwt, (req, res) => {
  let allParties = PartyManager.getAll();
  let parsedParties = Object.keys(allParties).map((key) => allParties[key]);
  res.json({ count: Object.keys(allParties).length, parties: parsedParties });
});

app.get("/", (req, res) => {
  res.render("home");
});

// Route to authenticate the user
app.get(
  "/login",
  passport.authenticate("auth0", {
    scope: "openid email profile",
    audience: process.env.AUTH0_AUDIENCE,
  }),
  function (req, res) {
    res.redirect("/");
  }
);

// Callback route
app.get(
  "/callback",
  passport.authenticate("auth0", {
    failureRedirect: "/error",
  }),
  function (req, res) {
    res.redirect("/admin");
  }
);

app.get("/error", (req, res) => {
  res.send("Pas autorisé à consulter cette page.");
});

app.get("/getAllErrors", checkJwt, async (req, res) => {
  let errors = await getAllErrors();
  res.status(200).json(errors);
});

app.post("/editError", checkJwt, async (req, res) => {
  let { theme, letter, word } = req.body;
  await updateError(theme, letter, word);
  res.status(200).json({});
});

app.post("/deleteError", checkJwt, async (req, res) => {
  let { theme, letter, word } = req.body;
  await deleteError(theme, letter, word);
  res.status(200).json({});
});

// Logout route
app.get("/logout", function (req, res) {
  req.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      var logoutURL = new URL(`https://${process.env.AUTH0_DOMAIN}/v2/logout`);
      var searchString = querystring.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        returnTo: process.env.AUTH0_LOGOUT_URL,
      });
      logoutURL.search = searchString;

      res.redirect(logoutURL);
    }
  });
});

// Admin route
app.get("/admin", ensureAuthenticated, function (req, res) {
  let allParties = PartyManager.getAll();
  let parsedParties = Object.keys(allParties).map((key) => allParties[key]);
  let onlineParties = {
    count: Object.keys(allParties).length,
    parties: parsedParties,
  };
  res.render("admin", { user: req.user, onlineParties });
});

// Function to ensure the user is authenticated
async function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    const { _json } = req.user;
    let admin = await isUserAllowed(_json.email);

    if (admin) {
      return next();
    }
  }
  res.redirect("/logout");
}

function getPartiesCount() {
  let allParties = PartyManager.getAll();
  let count = Object.keys(allParties).length;
  return count;
}

function getUsersCount() {
  let all = UserManager.getTotalUsers();
  return all;
}
