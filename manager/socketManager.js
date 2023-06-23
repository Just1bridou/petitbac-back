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
    sockets[uuid].timeout(3000).emit(event, data, (err, response) => {
      if (err) {
        logger.error(
          `Socket ERROR : sendToUser event is: ${event} error is : ${err}`
        );
      }
    });
  } else {
    logger.error(`SM : User ${uuid} is not connected`);
  }
}

function broadcast(event, data) {
  // logger.info(`SM : broadcast '${event}' to ${Object.keys(sockets).length}`);
  sockets.map((socket) => {
    let sender = sockets[socket];
    if (sender) {
      sender.timeout(3000).emit(event, data, (err, response) => {
        if (err) {
          logger.error(
            `Socket ERROR : broadcast event is: ${event} error is : ${err}`
          );
        }
      });
    }
  });
}

function broadcastToParty(party, event, data) {
  if (!party) return;

  party.users.map((user) => {
    if (!sockets[user.uuid]) return;
    let sender = sockets[user.uuid];
    if (sender) {
      sender.timeout(3000).emit(event, data, (err, response) => {
        if (err) {
          logger.error(
            `Socket ERROR : broadcastToParty event is: ${event} error is : ${err}`
          );
        }
      });
    }
  });
}

function sendToList(list, event, data) {
  list.map((socket) => {
    let sender = sockets[socket];
    if (sender) {
      sender.timeout(3000).emit(event, data, (err, response) => {
        if (err) {
          logger.error(
            `Socket ERROR : sendToList event is: ${event} error is : ${err}`
          );
        }
      });
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
