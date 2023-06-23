const SocketManager = require("../manager/socketManager.js");
const UserManager = require("../manager/userManager.js");
const PartyManager = require("../manager/partyManager.js");

function listen(socket) {
  socket.on("stopGame", ({ uuid }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(uuid);

    if (!party) return;

    let chrono = PartyManager.getChrono(uuid);
    if (chrono) {
      clearInterval(chrono);
    }

    SocketManager.broadcastToParty(party, "stopGame", {});
    PartyManager.sendRefreshParty(uuid);
  });

  socket.on("savePartyWords", ({ uuid, partyUUID, words }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(partyUUID);
    if (!party) return;

    party.answers.push({
      uuid: uuid,
      words: party.words.map((word, index) => {
        let userWord = words[index] ?? "";

        let votes = party.users.map((user) => {
          return {
            uuid: user.uuid,
            vote: userWord.trim() ? true : false,
          };
        });

        return {
          word: userWord ?? "",
          index: index,
          votes: votes,
        };
      }),
    });

    if (Object.keys(party.answers).length === party.users.length) {
      party.status = "results";
      SocketManager.broadcastToParty(party, "viewResults", party);
    }
  });

  socket.on(
    "changeVote",
    ({ uuid, answerUUID, partyUUID, vote, wordIndex }, callback) => {
      if (callback) {
        callback({ status: 200 });
      }

      let party = PartyManager.get(partyUUID);
      if (!party) return;

      let answer = party.answers.find((answer) => answer.uuid === answerUUID);
      if (!answer) return;
      let v = answer.words[wordIndex].votes.find((vote) => vote.uuid === uuid);
      if (!v) return;
      v.vote = vote;

      PartyManager.sendRefreshParty(partyUUID);
    }
  );

  socket.on("nextRound", ({ partyUUID, uuid }, callback) => {
    if (callback) {
      callback({ status: 200 });
    }

    let party = PartyManager.get(partyUUID);
    if (!party || party.status !== "results") return;

    let user = party.users.find((u) => u.uuid === uuid);

    if (!user) return;

    let ready = user.ready ?? false;
    user.ready = !ready;

    // send updated party to users
    PartyManager.sendRefreshParty(partyUUID);
    // try to start game if all ready
    PartyManager.nextRound(party);
  });
}

module.exports = { listen };
