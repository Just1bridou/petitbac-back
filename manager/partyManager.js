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
  addUserToParty,
  sendRefreshParty,
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
    uuid: generateRoomToken(),
    users: [],
    status: "waiting",
    words: ["prenom", "métier", "animal"],
    language: "FR",
    /**
     * Game mode
     * - classic
     * - random
     */
    mode: "classic",
    /**
     * Settings
     * - public
     * - private
     */
    visibility: "private",
    rounds: 3,
    time: "60",
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
  if (!party) return;
  let user = party?.users?.find((user) => user.uuid === userUUID);
  let userIndex = party.users.indexOf(user);
  party.users.splice(userIndex, 1);

  if (party.users.length === 0) {
    delete parties[partyUUID];

    SocketManager.broadcast("updateOnlineParties", {
      parties: Object.keys(parties).map((key) => parties[key]),
    });
  }
}

function sendRefreshParty(partyUUID) {
  let party = parties[partyUUID];
  if (!party) return;
  SocketManager.broadcastToParty(party, "updateParty", {
    party: party,
  });
}

function addUserToParty(user, partyUUID) {
  let party = parties[partyUUID];

  if (!party) return false;

  party.users.push(user);

  SocketManager.broadcastToParty(party, "updateParty", {
    party: party,
  });

  // SocketManager.broadcast("updateOnlineParties", {
  //   parties: Object.keys(parties).map((key) => parties[key]),
  // });

  return true;
}

/**
 * Generate room token
 * @returns token
 */
function generateRoomToken() {
  var firstPart = (Math.random() * 46656) | 0;
  var secondPart = (Math.random() * 46656) | 0;
  firstPart = ("000" + firstPart.toString(36)).slice(-3);
  secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
}
