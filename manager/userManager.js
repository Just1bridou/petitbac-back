const SocketManager = require("../manager/socketManager.js");

const logger = require("../tools/logger.js");

module.exports = { clear, createUser, get, deleteUser, getTotalUsers };

/**
 * Users array:
 *
 * "uuid" => user
 */
let users = [];
/**
 * Life monitor
 */
setInterval(() => {
  logger.warn(`UM : Actually connected users: ${Object.keys(users).length}`);
}, 10000);

function clear() {
  users = [];
}

function createUser(uuid, pseudo) {
  logger.info(`UM : Creating user ${uuid} with pseudo ${pseudo}`);
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

function getTotalUsers() {
  return Object.keys(users).length;
}

function deleteUser(uuid) {
  logger.info(`UM : Deleting user ${uuid}`);
  delete users[uuid];
  logger.warn(`UM : Actually connected users: ${Object.keys(users).length}`);

  SocketManager.broadcast("updateOnlineUsers", {
    onlineUsers: Object.keys(users).length,
  });
}
