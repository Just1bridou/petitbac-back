const SocketManager = require("../manager/socketManager.js");
const UserManager = require("../manager/userManager.js");

function listen(socket) {
  socket.on("login", ({ uuid, pseudo }, cb) => {
    let user = UserManager.createUser(uuid, pseudo);
    cb({ user });
  });
}

module.exports = { listen };
