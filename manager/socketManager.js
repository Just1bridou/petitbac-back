/**
 * Socket manager
 *
 * Manage all socket connections
 *
 * Socket connection is established when user join the website
 * /!\ user hasn't logged in yet
 *
 */
const logger = require("../tools/logger.js");
const lod_ = require("lodash");

let socketID = [];

let sockets = [];

module.exports = {
  clear,
  sockets,
  registerConnection,
  sendToUser,
  broadcast,
  get,
  sendToList,
  disconnectUser,
  broadcastToParty,
  getUUIDBySocketId,
};

function clear() {
  sockets = [];
}

function registerConnection(uuid, socket) {
  let connectedUUID = socketID[socket.id];
  if (connectedUUID) {
    delete sockets[connectedUUID];
  }

  socketID[socket.id] = uuid;
  sockets[uuid] = socket;
}

function sendToUser(uuid, event, data) {
  //  logger.info(`SM : send to ${uuid} '${event}' with sID ${sockets[uuid]?.id}`);

  if (sockets[uuid] !== undefined) {
    sockets[uuid].emit(event, data);
  } else {
    logger.error(`SM : User ${uuid} is not connected`);
  }
}

function broadcast(event, data) {
  // logger.info(`SM : broadcast '${event}' to ${Object.keys(sockets).length}`);
  sockets.map((socket) => {
    let sender = sockets[socket];
    if (sender) {
      sender.emit(event, data);
    }
  });
}

function broadcastToParty(party, event, data) {
  if (!party) return;

  party.users.map((user) => {
    if (!sockets[user.uuid]) return;
    let sender = sockets[user.uuid];
    if (sender) {
      sender.emit(event, data);
    }
  });
}

function sendToList(list, event, data) {
  list.map((socket) => {
    let sender = sockets[socket];
    if (sender) {
      sender.emit(event, data);
    }
  });
}

function get(uuid) {
  if (sockets[uuid] !== undefined) {
    return sockets[uuid];
  } else {
    logger.error(`SM : User ${uuid} is not connected`);
  }
}

function getUUIDBySocketId(id) {
  return socketID[id];
}

/**
 * Remove socket connection from socket manager by socket.id
 * return uuid of the user
 */
function disconnectUser(id) {
  let uuid = lod_.cloneDeep(socketID[id]);

  if (uuid) {
    console.log(`SM : User ${uuid} disconnected from socket`);
    delete sockets[uuid];
  }

  return uuid;
}
