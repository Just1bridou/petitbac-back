const SocketManager = require("../manager/socketManager.js");
const UserManager = require("../manager/userManager.js");
const PartyManager = require("../manager/partyManager.js");

function listen(socket) {
  socket.on("createPrivateParty", ({ uuid }, cb) => {
    /**
     * Update userR
     */
    let user = UserManager.get(uuid);
    if (!user) return;
    user.admin = true;
    SocketManager.sendToUser(uuid, "refreshUser", { user });
    /**
     * Create party
     */
    let party = PartyManager.createParty();
    /**
     * Add user to party
     */
    user.actualPartyUUID = party.uuid;
    party.users.push(user);

    PartyManager.updateAllOnlineParties();

    cb({ party });
  });
}

module.exports = { listen };
