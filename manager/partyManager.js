const SocketManager = require("../manager/socketManager.js");

const { v4 } = require("uuid");

const logger = require("../tools/logger.js");

module.exports = {
  clear,
  createParty,
  get,
  updateOnlineParties,
  deleteUserFromParty,
  updateAllOnlineParties,
};

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
    visibility: "public",
    mode: "classic",
    rounds: 3,
    time: 60,
    status: "waiting",
    words: ["prenom", "métier", "animal"],
    language: "FR",
  };

  logger.info(`Creating party ${party.uuid}`);

  parties[party.uuid] = party;

  return party;
}

function get(uuid) {
  return parties[uuid];
}

/**
 * For one user
 */
function updateOnlineParties(uuid) {
  SocketManager.sendToUser(uuid, "updateOnlineParties", {
    parties: Object.keys(parties)
      .map((key) => parties[key])
      .filter((party) => party.visibility === "public"),
  });
}
/**
 * For all users
 */
function updateAllOnlineParties() {
  SocketManager.broadcast("updateOnlineParties", {
    parties: Object.keys(parties)
      .map((key) => parties[key])
      .filter((party) => party.visibility === "public"),
  });
}

function deleteUserFromParty(userUUID, partyUUID) {
  let party = parties[partyUUID];
  let user = party.users.find((user) => user.uuid === userUUID);
  let userIndex = party.users.indexOf(user);
  party.users.splice(userIndex, 1);

  if (party.users.length === 0) {
    delete parties[partyUUID];

    SocketManager.broadcast("updateOnlineParties", {
      parties: Object.keys(parties).map((key) => parties[key]),
    });
  }
}
