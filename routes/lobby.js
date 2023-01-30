const SocketManager = require("../manager/socketManager.js");
const UserManager = require("../manager/userManager.js");
const PartyManager = require("../manager/partyManager.js");

function listen(socket) {
  socket.on("createPrivateParty", ({ uuid }, cb) => {
    /**
     * Update userR
     */
    let user = UserManager.get(uuid);
    user.admin = true;
    SocketManager.sendToUser(uuid, "refreshUser", { user });
    /**
     * Create party
     */
    let party = PartyManager.createParty();
    /**
     * Add user to party
     */
    PartyManager.get(party.uuid).users.push(user);

    cb({ party });
  });
}

module.exports = { listen };
