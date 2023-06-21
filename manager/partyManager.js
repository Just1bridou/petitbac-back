const SocketManager = require("../manager/socketManager.js");

const { v4 } = require("uuid");

const logger = require("../tools/logger.js");
const { getRandomWords } = require("./database.js");
const lod_ = require("lodash");

module.exports = {
  clear,
  createParty,
  get,
  updateOnlineParties,
  deleteUserFromParty,
  updateAllOnlineParties,
  addUserToParty,
  sendRefreshParty,
  lookingForStartGame,
  getChrono,
  nextRound,
  getAll,
};

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let parties = [];
let chronoLinker = [];

function getAll() {
  return parties;
}

/**
 * Life monitor
 */
/*setInterval(() => {
  logger.warn(`PM : Actually party count: ${Object.keys(parties).length}`);
}, 10000);*/

function clear() {
  parties = [];
}

function createParty() {
  const party = {
    createdDate: new Date(),
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
    /**
     * Chat feed
     */
    chat: [],
    /**
     * GAME DATA
     */
    lettersHistory: [], // Letters already used in previous rounds
    score: [], // Score of each user
    answers: [], // Answers of each user after completing a round
    // currentRound: 1,
    // currentLetter : "L",
    // score: [],
  };

  logger.info(`Creating party ${party.uuid}`);

  parties[party.uuid] = party;

  return party;
}

function getChrono(uuid) {
  return chronoLinker[uuid];
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
      .filter(
        (party) => party.visibility === "public" && party.status === "waiting"
      ),
  });
}
/**
 * For all users
 */
function updateAllOnlineParties() {
  SocketManager.broadcast("updateOnlineParties", {
    parties: Object.keys(parties)
      .map((key) => parties[key])
      .filter(
        (party) => party.visibility === "public" && party.status === "waiting"
      ),
  });
}

function deleteUserFromParty(userUUID, partyUUID) {
  let party = parties[partyUUID];
  if (!party) return;
  let user = party?.users?.find((user) => user.uuid === userUUID);
  if (!user) return;
  let wasAdmin = lod_.clone(user.admin);
  let userIndex = party.users.indexOf(user);
  party.users.splice(userIndex, 1);

  // remove user's score
  let scoreIndex = party.score.findIndex((score) => score.uuid === userUUID);
  if (scoreIndex !== -1) {
    party.score.splice(scoreIndex, 1);
  }

  if (party.users.length === 0) {
    let chrono = chronoLinker[partyUUID];
    if (chrono) {
      clearInterval(chrono);
      delete chronoLinker[partyUUID];
    }
    delete parties[partyUUID];

    logger.info(`PM: party ${partyUUID} deleted -> No users`);
    SocketManager.broadcast("updateOnlineParties", {
      parties: Object.keys(parties).map((key) => parties[key]),
    });
  } else {
    // If admin, set new admin
    if (wasAdmin) {
      party.users[0].admin = true;
      SocketManager.sendToUser(party.users[0].uuid, "refreshUser", {
        user: party.users[0],
      });
    }
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

  if (!party || party.status !== "waiting") return false;

  party.users.push(user);

  SocketManager.broadcastToParty(party, "updateParty", {
    party: party,
  });
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

/**
 * Start game if all users are ready
 * @param {Object} party
 */
async function lookingForStartGame(party) {
  let ready = true;

  party.users.forEach((user) => {
    if (!user.ready) {
      ready = false;
    }
  });

  if (ready) {
    await startGame(party);
  }
}

/**
 * Start the game
 * @param {Object} party
 */
async function startGame(party) {
  logger.info(`PM: starting game ${party.uuid}`);
  party.status = "playing";
  if (party.visibility === "public") {
    updateAllOnlineParties();
  }

  /**
   * Compute words
   */
  switch (party.mode) {
    case "random":
      party.words = await getRandomWords();
      break;
    default:
      break;
  }

  /**
   * Sort a new letter
   */
  let randomLetter = ALPHA[Math.floor(Math.random() * ALPHA.length)];

  while (party.lettersHistory.includes(randomLetter)) {
    randomLetter = ALPHA[Math.floor(Math.random() * ALPHA.length)];
  }

  party.lettersHistory.push(randomLetter);
  party.currentLetter = randomLetter;

  /**
   * Set round
   */
  party.currentRound = 1;

  /**
   * Reset score
   */
  party.score = [];

  /**
   * Set timer
   */
  let chrono = null;

  if (party.time) {
    party.actualTime = party.time;

    chrono = setInterval(() => {
      party.actualTime--;
      if (party.actualTime < 0) {
        clearInterval(chrono);
        SocketManager.broadcastToParty(party, "stopGame");
      } else {
        SocketManager.broadcastToParty(party, "updateParty", {
          party: party,
        });
      }
    }, 1000);

    chronoLinker[party.uuid] = chrono;
  }

  party.users.map((user) => {
    user.ready = false;
  });

  SocketManager.broadcastToParty(party, "startGame", party);
}
/**
 * Next round
 * @param {*} party
 * @returns
 */
function nextRound(party) {
  let allReady = true;

  party.users.forEach((user) => {
    if (!user.ready) {
      allReady = false;
    }
  });

  if (!allReady) return;

  /**
   * Compute score
   */
  party.answers.forEach((userList, userIndex) => {
    let userScore = 0;

    userList.words.forEach((word, index) => {
      let voteLessThanFifty =
        word.votes.filter((v) => v.vote).length < word.votes.length / 2;

      if (voteLessThanFifty) return;

      if (!word?.word || !party?.currentLetter) return;
      if (word.word[0].toLowerCase() !== party.currentLetter.toLowerCase())
        return;

      let sameWords = 1;

      party.answers.forEach((userList2, userIndex2) => {
        if (userIndex2 !== userIndex) {
          let word2 = userList2.words[index].word;

          if (!word2 || !word?.word) return;
          if (word2.trim().toLowerCase() === word.word.trim().toLowerCase()) {
            sameWords++;
          }
        }
      });

      if (word.word.trim() !== "") {
        // userScore += word.length;
        userScore += 10;
      }

      userScore = userScore / sameWords;
    });

    let scoreLine = party.score.find((s) => s.uuid === userList.uuid);

    if (scoreLine) {
      scoreLine.score += userScore;
    } else {
      party.score.push({
        uuid: userList.uuid,
        score: userScore,
      });
    }
  });

  // There is a next round
  if (party.currentRound < party.rounds) {
    /**
     * Next round
     */
    party.currentRound++;

    /**
     * New letter
     */
    let randomLetter = ALPHA[Math.floor(Math.random() * ALPHA.length)];

    while (party.lettersHistory.includes(randomLetter)) {
      randomLetter = ALPHA[Math.floor(Math.random() * ALPHA.length)];
    }

    party.lettersHistory.push(randomLetter);
    party.currentLetter = randomLetter;

    /**
     * Set party's status to playing (to go to game screen)
     */
    party.status = "playing";

    /**
     * Reset user ready
     */
    party.users.map((user) => {
      user.ready = false;
    });

    /**
     * Reset answers
     */
    party.answers = [];

    /**
     * Reset timer
     */
    let chrono = null;

    if (party.time) {
      party.actualTime = party.time;

      chrono = setInterval(() => {
        party.actualTime--;
        if (party.actualTime < 0) {
          clearInterval(chrono);
          SocketManager.broadcastToParty(party, "stopGame");
        } else {
          SocketManager.broadcastToParty(party, "updateParty", {
            party: party,
          });
        }
      }, 1000);

      chronoLinker[party.uuid] = chrono;
    }

    /**
     * Send party event
     */
    SocketManager.broadcastToParty(party, "updateParty", {
      party: party,
    });
    // End of game
  } else {
    /**
     * Reset party to waiting status to go to waiting room
     */
    party.status = "waiting";
    /**
     * Reset user ready
     */
    party.users.map((user) => {
      user.ready = false;
    });
    /**
     * Reset answers
     */
    party.answers = [];
    /**
     * Reset score
     */
    // party.score = [];
    /**
     * See results
     */
    // party.canSeeTotalScore = true;

    SocketManager.broadcastToParty(party, "gameIsFinish", {
      canSeeTotalScore: true,
    });

    SocketManager.broadcastToParty(party, "updateParty", {
      party: party,
    });
  }
}
