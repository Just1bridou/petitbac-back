const SocketManager = require("../manager/socketManager.js");
const UserManager = require("../manager/userManager.js");
const PartyManager = require("../manager/partyManager.js");
const logger = require("../tools/logger.js");

const {
  verifyWordInBase,
  getFlashConfig,
  getTodayFlashConfig,
  recordTodayFlashConfig,
  saveErrorWord,
} = require("../manager/database.js");

function listen(socket) {
  socket.on("getThemesList", async (cb) => {
    // 1- Look if you have a flash config for today
    let todayThemes = await getTodayFlashConfig();
    if (todayThemes) {
      cb(todayThemes);
      return;
    }
    // 2- If not, generate one
    let themes = await getFlashConfig();
    await recordTodayFlashConfig(themes);
    cb(themes);
  });

  socket.on("verifyGame", async ({ theme, letter, word }, cb) => {
    let exist = await verifyWordInBase(theme, letter, word);
    cb(exist);
  });

  socket.on("reportError", async ({ theme, letter, word }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    await saveErrorWord(theme, letter, word);
  });
}

module.exports = { listen };
