const SocketManager = require("../manager/socketManager.js");
const UserManager = require("../manager/userManager.js");
const PartyManager = require("../manager/partyManager.js");
const {
  verifyWordInBase,
  getFlashConfig,
  getTodayFlashConfig,
  recordTodayFlashConfig,
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
}

module.exports = { listen };
