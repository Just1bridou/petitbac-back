const SocketManager = require("../manager/socketManager.js");

const { v4 } = require("uuid");

const logger = require("../tools/logger.js");

module.exports = { clear, createParty, get, updateOnlineParties };

let parties = [];
/**
 * Life monitor
 */
setInterval(() => {
  logger.warn(`PM : Actually party count: ${Object.keys(parties).length}`);
}, 10000);

function clear() {
  parties = [];
}

function createParty() {
  const party = {
    uuid: v4(),
    users: [],
    visibility: "private",
    mode: "classic",
    rounds: 3,
    time: 60,
    status: "waiting",
    words: ["prenom", "métier", "animal"],
  };

  logger.info(`Creating party ${party.uuid}`);

  parties[party.uuid] = party;

  SocketManager.broadcast("updateOnlineParties", {
    parties: Object.keys(parties).map((key) => parties[key]),
  });

  return party;
}

function get(uuid) {
  return parties[uuid];
}

function updateOnlineParties(uuid) {
  SocketManager.sendToUser(uuid, "updateOnlineParties", {
    parties: Object.keys(parties)
      .map((key) => parties[key])
      .filter((party) => party.visibility === "public"),
  });
}
