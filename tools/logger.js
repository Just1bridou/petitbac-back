var log4js = require("log4js");
var logger = log4js.getLogger();
logger.isDebugEnabled = true;
logger.debug("Starting server");

function info(message) {
  logger.level = "info";
  logger.info(message);
}

function warn(message) {
  logger.level = "warn";
  logger.warn(message);
}

function error(message) {
  logger.level = "error";
  logger.error(message);
}

module.exports = {
  info,
  warn,
  error,
};
