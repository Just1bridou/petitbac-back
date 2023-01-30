const SocketManager = require("../manager/socketManager.js");

const logger = require("../tools/logger.js");

let users = [];

function clear() {
  users = [];
}

function createUser(uuid, pseudo) {
  logger.info(`Creating user ${uuid} with pseudo ${pseudo}`);
  const user = {
    uuid: uuid,
    pseudo: pseudo,
  };
  users[uuid] = user;
  SocketManager.broadcast("updateOnlineUsers", {
    onlineUsers: Object.keys(users).length,
  });
  return user;
}

function get(uuid) {
  return users[uuid];
}

module.exports = { clear, createUser, get };
