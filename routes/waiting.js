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
    PartyManager.updateAllOnlineParties();
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

    console.log(time);

    party.time = time;
    PartyManager.sendRefreshParty(uuid);
    PartyManager.updateAllOnlineParties();
  });

  socket.on("changePartyRounds", ({ uuid, rounds }) => {
    let party = PartyManager.get(uuid);
    if (!party) return;
    party.rounds = rounds;
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
}

module.exports = { listen };
