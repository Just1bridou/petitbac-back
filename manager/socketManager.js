const logger = require("../tools/logger.js");

let socketID = {};

let sockets = [];

module.exports = {
  clear,
  sockets,
  connectUser,
  sendToUser,
  broadcast,
  get,
  sendToList,
  print,
};

function print() {
  console.log("broadcast to", Object.keys(sockets).length);
}

function clear() {
  sockets = [];
}

function connectUser(uuid, socket) {
  let connectedUUID = socketID[socket.id];
  if (connectedUUID) {
    delete sockets[connectedUUID];
  }

  socketID[socket.id] = uuid;
  sockets[uuid] = socket;
}

function sendToUser(uuid, event, data) {
  if (sockets[uuid] !== undefined) {
    sockets[uuid].emit(event, data);
  } else {
    logger.error(`User ${uuid} is not connected`);
  }
}

function broadcast(event, data) {
  console.log("broadcast to", Object.keys(sockets).length);
  for (let socket in sockets) {
    console.log("send to " + socket);
    sockets[socket].emit(event, data);
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
    logger.error(`User ${uuid} is not connected`);
  }
}
