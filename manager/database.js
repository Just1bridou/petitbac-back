const { MongoClient } = require("mongodb");
const logger = require("../tools/logger.js");
const { computeScore } = require("./scoreManager.js");
const client = new MongoClient(process.env.MONGO_URL);
let db = null;

module.exports = {
  getRandomWords,
  connect,
  getFlashConfig,
  verifyWordInBase,
  getTodayFlashConfig,
  recordTodayFlashConfig,
};

async function connect() {
  await client.connect();
  db = client.db("petitbac");
  logger.info("Connected to database");
}

let categories = [
  "PRÉNOM",
  "FRUIT / FLEUR / LEGUME",
  "MÉTIER",
  "CÉLEBRITÉ (nom de famille)",
  "MARQUE",
  "ANIMAL",
  "PAYS",
  "VILLE",
  "PERSONNAGE DE FICTION",
  "TITRE DE MUSIQUE",
  "SPORT",
  "PLAT",
  "BOISSON",
  "FILM / SÉRIE",
  "VETEMENT",
  "FROMAGE",
  "ANATOMIE DU CORPS",
  "OBJET",
  "DEPARTEMENT FRANCAIS",
  "VERBE",
  "YOUTUBEUR / STREAMER",
];

function sort() {
  return categories[Math.floor(Math.random() * categories.length)];
}

function getRandomWords() {
  let COUNT = 7;
  let words = [];

  for (let i = 0; i < COUNT; i++) {
    let word = sort();
    while (words.includes(word)) {
      word = sort();
    }
    words.push(word);
  }

  return words;
}

async function recordTodayFlashConfig(themes) {
  try {
    console.log("recordTodayFlashConfig");
    await db.collection("flashHistory").insertOne({
      date: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
      },
      config: themes,
    });
  } catch (e) {
    logger.error("Error while recording today flash config :", e);
  }
}

async function getTodayFlashConfig() {
  try {
    let config = await db.collection("flashHistory").findOne(
      {
        date: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate(),
        },
      },
      {
        projection: {
          _id: 0,
          config: 1,
        },
      }
    );

    return config ? config.config : null;
  } catch (e) {
    logger.error("Error while getting today flash config :", e);
    return null;
  }
}

async function getFlashConfig() {
  const THEMES_COUNT = 10;
  try {
    let selectedThemes = [];
    // Get config
    let config = await db.collection("config").findOne(
      { configType: "gameMode", type: "flash" },
      {
        projection: {
          _id: 0,
          themes: 1,
        },
      }
    );

    if (!config) {
      return {
        themes: [],
      };
    }
    // Get themes
    let { themes, letters } = config;
    // Create themes array
    for (let i = 0; i < THEMES_COUNT; i++) {
      let theme = themes[Math.floor(Math.random() * themes.length)];
      while (selectedThemes.includes(theme)) {
        theme = themes[Math.floor(Math.random() * themes.length)];
      }

      let dbTheme = await db
        .collection("theme")
        .findOne({ name: theme.theme }, { projection: { _id: 0, letters: 1 } });

      theme.letter =
        dbTheme.letters[Math.floor(Math.random() * dbTheme.letters.length)];
      theme.words = [];
      selectedThemes.push(theme);
    }
    // Generate random letter
    // let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    // let letter = letters[Math.floor(Math.random() * letters.length)];
    // return datas
    return {
      themes: selectedThemes,
      //  letter: letter,
    };
  } catch (e) {
    logger.error("Error while getting flash config :", e);
    return {};
  }
}

async function verifyWordInBase(theme, letter, word) {
  try {
    let find = await db.collection("theme").findOne(
      { name: theme, [`words.${letter}`]: { $in: [word.toLowerCase()] } },
      {
        projection: {
          _id: 1,
        },
      }
    );
    if (!find) {
      return {
        finded: false,
        score: 0,
      };
    } else {
      return {
        finded: true,
        score: computeScore(word),
      };
    }
  } catch (e) {}
}
