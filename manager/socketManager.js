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
  print,
  disconnectUser,
  broadcastToParty,
};
/**
 * Life monitor
 */
setInterval(() => {
  logger.warn(
    `SM : Actually established connections: ${Object.keys(sockets).length}`
  );
}, 10000);

function print() {
  console.log("SM : broadcast to", Object.keys(sockets).length);
}

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
  logger.info(`SM : send to ${uuid} '${event}'`);

  if (sockets[uuid] !== undefined) {
    sockets[uuid].emit(event, data);
  } else {
    logger.error(`SM : User ${uuid} is not connected`);
  }
}

function broadcast(event, data) {
  logger.info(`SM : broadcast '${event}' to ${Object.keys(sockets).length}`);
  for (let socket in sockets) {
    // console.log("SM : send to " + socket);
    sockets[socket].emit(event, data);
  }
}

function broadcastToParty(party, event, data) {
  logger.info(`SM : broadcast party '${event}' to ${party.users.length}`);
  for (let user of party.users) {
    sockets[user.uuid].emit(event, data);
  }
}

function sendToList(list, event, data) {
  for (let socket in list) {
    sockets[socket].emit(event, data);
  }
}

function get(uuid) {
  if (sockets[uuid] !== undefined) {
    return sockets[uuid];
  } else {
    logger.error(`SM : User ${uuid} is not connected`);
  }
}

/**
 * Remove socket connection from socket manager by socket.id
 * return uuid of the user
 */
function disconnectUser(id) {
  let uuid = lod_.cloneDeep(socketID[id]);

  console.log(`SM : User ${uuid} disconnected from socket`);
  if (uuid) {
    delete sockets[uuid];
  }

  return uuid;
}
