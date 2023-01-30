const SocketManager = require("../manager/socketManager.js");
const PartyManager = require("../manager/partyManager.js");
const UserManager = require("../manager/userManager.js");

function listen(socket) {
  socket.on("login", ({ uuid, pseudo }, cb) => {
    let user = UserManager.createUser(uuid, pseudo);
    PartyManager.updateOnlineParties(uuid);
    cb({ user });
  });
}

module.exports = { listen };
