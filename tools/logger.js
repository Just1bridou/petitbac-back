var log4js = require("log4js");
const { sendLogMessage, sendErrorMessage } = require("../manager/discordBot");
var logger = log4js.getLogger();
logger.isDebugEnabled = true;
logger.debug("Starting server");

function getDate() {
  return `[${new Date().toLocaleDateString(
    "FR-fr"
  )} ${new Date().toLocaleTimeString("FR-fr")}]`;
}

function info(message) {
  logger.level = "info";
  // dont send the message to discord because of timeout
  // sendLogMessage(`**[INFO]** ${message}`);
  logger.info(message);
}

function warn(message) {
  logger.level = "warn";
  sendLogMessage(`**${getDate()} [WARN]** ${message}`);
  logger.warn(message);
}

function error(message) {
  logger.level = "error";
  sendErrorMessage(`**${getDate()} [ERROR]** ${message}`);
  logger.error(message);
}

module.exports = {
  info,
  warn,
  error,
};
