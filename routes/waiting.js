const SocketManager = require("../manager/socketManager.js");
const UserManager = require("../manager/userManager.js");
const PartyManager = require("../manager/partyManager.js");

function listen(socket) {
  socket.on("changePartyVisibility", ({ uuid, isPublic }) => {
    let party = PartyManager.get(uuid);
    if (!party) return;
    party.visibility = isPublic ? "public" : "private";
    PartyManager.sendRefreshParty(uuid);
    PartyManager.updateAllOnlineParties();
  });
}

module.exports = { listen };
