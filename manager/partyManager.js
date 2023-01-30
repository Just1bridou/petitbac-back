const SocketManager = require("../manager/socketManager.js");

const { v4 } = require("uuid");

const logger = require("../tools/logger.js");

let parties = [];

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

module.exports = { clear, createParty, get };
