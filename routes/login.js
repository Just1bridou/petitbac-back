const SocketManager = require("../manager/socketManager.js");
const PartyManager = require("../manager/partyManager.js");
const UserManager = require("../manager/userManager.js");

function listen(socket) {
  socket.on("login", ({ uuid, pseudo }, cb) => {
    let user = UserManager.createUser(uuid, pseudo);
    PartyManager.updateOnlineParties(uuid);
    cb({ user });
  });

  socket.on("joinRoom", ({ uuid, pseudo, roomUUID }, cb) => {
    let user = UserManager.createUser(uuid, pseudo);
    user.actualPartyUUID = roomUUID;
    let ack = PartyManager.addUserToParty(user, roomUUID);
    let party = PartyManager.get(roomUUID);

    if (!ack) {
      cb({ error: "Room not found" });
      return;
    } else {
      cb({ user, party });
    }
  });
}

module.exports = { listen };
