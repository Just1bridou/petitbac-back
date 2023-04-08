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

  socket.on("changePartyMode", ({ uuid, mode }) => {
    let party = PartyManager.get(uuid);
    if (!party) return;
    party.mode = mode;
    PartyManager.sendRefreshParty(uuid);
  });

  socket.on("changePartyTime", ({ uuid, time }) => {
    let party = PartyManager.get(uuid);
    if (!party) return;

    if (time === true) {
      time = "60";
    }

    if (time === false) {
      time = null;
    }

    party.time = time;
    PartyManager.sendRefreshParty(uuid);
  });

  socket.on("changePartyRounds", ({ uuid, rounds }) => {
    let party = PartyManager.get(uuid);
    if (!party) return;
    party.rounds = rounds;
    PartyManager.sendRefreshParty(uuid);
  });

  socket.on("changePartyLanguage", ({ uuid, language }) => {
    let party = PartyManager.get(uuid);
    if (!party) return;
    party.language = language;
    PartyManager.sendRefreshParty(uuid);
    PartyManager.updateAllOnlineParties();
  });

  socket.on("addPartyWord", ({ uuid, newWord }) => {
    let party = PartyManager.get(uuid);
    if (!party) return;
    if (party.words.includes(newWord)) return;

    party.words.push(newWord);

    PartyManager.sendRefreshParty(uuid);
    PartyManager.updateAllOnlineParties();
  });

  socket.on("removePartyWord", ({ uuid, word }) => {
    let party = PartyManager.get(uuid);
    if (!party) return;

    party.words = party.words.filter((w) => w !== word);

    PartyManager.sendRefreshParty(uuid);
    PartyManager.updateAllOnlineParties();
  });

  socket.on("readyUser", ({ partyUUID, uuid }) => {
    let party = PartyManager.get(partyUUID);
    if (!party || party.status !== "waiting") return;

    let user = party.users.find((u) => u.uuid === uuid);

    let ready = user.ready ?? false;
    user.ready = !ready;
    // send updated party to users
    PartyManager.sendRefreshParty(partyUUID);
    // try to start game if all ready
    PartyManager.lookingForStartGame(party);
  });

  socket.on("kickUser", ({ partyUUID, uuid }) => {
    let party = PartyManager.get(partyUUID);
    if (!party) return;

    party.users = party.users.filter((u) => u.uuid !== uuid);

    PartyManager.sendRefreshParty(partyUUID);
    SocketManager.sendToUser(uuid, "kickParty", {});
  });

  socket.on("userLeaveParty", ({ partyUUID, uuid }) => {
    PartyManager.deleteUserFromParty(uuid, partyUUID);
  });
}

module.exports = { listen };
