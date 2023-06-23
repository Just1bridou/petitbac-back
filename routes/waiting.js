const SocketManager = require("../manager/socketManager.js");
const UserManager = require("../manager/userManager.js");
const PartyManager = require("../manager/partyManager.js");

function listen(socket) {
  socket.on("changePartyVisibility", ({ uuid, isPublic }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(uuid);
    if (!party) return;
    party.visibility = isPublic ? "public" : "private";
    PartyManager.sendRefreshParty(uuid);
    PartyManager.updateAllOnlineParties();
  });

  socket.on("changePartyMode", ({ uuid, mode }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(uuid);
    if (!party) return;
    party.mode = mode;
    PartyManager.sendRefreshParty(uuid);
  });

  socket.on("changePartyTime", ({ uuid, time }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

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

  socket.on("changePartyRounds", ({ uuid, rounds }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(uuid);
    if (!party) return;
    party.rounds = rounds;
    PartyManager.sendRefreshParty(uuid);
  });

  socket.on("changePartyLanguage", ({ uuid, language }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(uuid);
    if (!party) return;
    party.language = language;
    PartyManager.sendRefreshParty(uuid);
    PartyManager.updateAllOnlineParties();
  });

  socket.on("addPartyWord", ({ uuid, newWord }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(uuid);
    if (!party) return;
    if (party.words.includes(newWord)) return;

    party.words.push(newWord);

    PartyManager.sendRefreshParty(uuid);
    PartyManager.updateAllOnlineParties();
  });

  socket.on("removePartyWord", ({ uuid, word }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(uuid);
    if (!party) return;

    party.words = party.words.filter((w) => w !== word);

    PartyManager.sendRefreshParty(uuid);
    PartyManager.updateAllOnlineParties();
  });

  socket.on("readyUser", async ({ partyUUID, uuid }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(partyUUID);
    if (!party || party.status !== "waiting") return;

    let user = party.users.find((u) => u.uuid === uuid);

    if (!user) return;

    let ready = user.ready ?? false;
    user.ready = !ready;
    // send updated party to users
    PartyManager.sendRefreshParty(partyUUID);
    // try to start game if all ready
    await PartyManager.lookingForStartGame(party);
  });

  socket.on("kickUser", ({ partyUUID, uuid }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(partyUUID);
    if (!party) return;

    party.users = party.users.filter((u) => u.uuid !== uuid);

    PartyManager.sendRefreshParty(partyUUID);
    SocketManager.sendToUser(uuid, "kickParty", {});
  });

  socket.on("userLeaveParty", ({ partyUUID, uuid }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    PartyManager.deleteUserFromParty(uuid, partyUUID);
    PartyManager.sendRefreshParty(partyUUID);
  });
}

module.exports = { listen };
