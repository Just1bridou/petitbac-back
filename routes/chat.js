const SocketManager = require("../manager/socketManager.js");
const UserManager = require("../manager/userManager.js");
const PartyManager = require("../manager/partyManager.js");

function listen(socket) {
  socket.on("newChatMessage", ({ partyUUID, userUUID, message }) => {
    const MAX_CHAT_LENGTH = 20;

    console.log(partyUUID, userUUID, message);

    let party = PartyManager.get(partyUUID);
    let user = UserManager.get(userUUID);

    if (!party || !user) return;

    party.chat.push({
      user: user.pseudo,
      message: message,
    });

    if (party.chat.length > MAX_CHAT_LENGTH) {
      party.chat.shift();
    }

    console.log(party.chat);

    //PartyManager.sendRefreshParty(partyUUID);
    SocketManager.broadcastToParty(party, "newChatMessage", {
      chat: party.chat,
    });
  });
}

module.exports = { listen };
