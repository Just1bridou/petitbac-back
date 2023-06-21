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
  saveErrorWord,
  isUserAllowed,
  getAllErrors,
  updateError,
  deleteError,
};

async function connect() {
  await client.connect();
  db = client.db("petitbac");
  logger.info("Connected to database");
}

function sort(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function getRandomWords() {
  let COUNT = 7;
  let words = [];

  let THEMES_LIST = await db.collection("config").findOne(
    {
      configType: "gameMode",
      type: "main",
    },
    {
      projection: {
        themes: 1,
      },
    }
  );

  THEMES_LIST = THEMES_LIST.themes;

  for (let i = 0; i < COUNT; i++) {
    let word = sort(THEMES_LIST);
    while (words.includes(word)) {
      word = sort(THEMES_LIST);
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

function removeAccents(word) {
  const accents = [
    /[\300-\306]/g,
    /[\340-\346]/g, // A, a
    /[\310-\313]/g,
    /[\350-\353]/g, // E, e
    /[\314-\317]/g,
    /[\354-\357]/g, // I, i
    /[\322-\330]/g,
    /[\362-\370]/g, // O, o
    /[\331-\334]/g,
    /[\371-\374]/g, // U, u
    /[\321]/g,
    /[\361]/g, // N, n
    /[\307]/g,
    /[\347]/g, // C, c
  ];

  const withoutAccents = [
    "A",
    "a",
    "E",
    "e",
    "I",
    "i",
    "O",
    "o",
    "U",
    "u",
    "N",
    "n",
    "C",
    "c",
  ];

  for (let i = 0; i < accents.length; i++) {
    word = word.replace(accents[i], withoutAccents[i]);
  }

  return word;
}

function isWordInList(word, list) {
  for (let listWord of list) {
    if (
      removeAccents(word.toLowerCase()) ===
      removeAccents(listWord.toLowerCase())
    ) {
      return true;
    }
  }
  return false;
}

async function verifyWordInBase(theme, letter, word) {
  try {
    let letterWords = await db
      .collection("theme")
      .find(
        { name: theme },
        {
          projection: {
            [`words.${letter}`]: 1,
            collection: 1,
            name: 1,
          },
        }
      )
      .toArray();

    let inList = false;

    if (letterWords[0].collection) {
      letterWords = letterWords[0];
      /**
       * Need to find words in specific collection
       */
      let collection = letterWords.collection;
      let name = letterWords.name;

      let regex = new RegExp(`^${word}$`, "igm");

      let exist = await db.collection(collection).findOne({
        ref: name,
        name: regex,
      });

      inList = Boolean(exist);
    } else {
      /**
       * Words are in the theme object
       */
      letterWords = letterWords[0].words[letter];

      inList = isWordInList(word, letterWords);
    }

    if (!inList) {
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
/**
 * Save error word in database
 */
async function saveErrorWord(theme, letter, word) {
  try {
    let exist = await db.collection("errorWord").findOne({
      theme: theme,
      letter: letter,
      word: word,
    });

    if (exist) {
      return;
    }

    await db.collection("errorWord").insertOne({
      createdDate: new Date(),
      theme: theme,
      letter: letter,
      word: word,
    });

    logger.warn(
      `Error reported for word ${word} in theme ${theme} and letter ${letter}`
    );
  } catch (e) {
    logger.error("Error while saving error word :", e);
  }
}

async function getAllErrors() {
  try {
    let errors = await db.collection("errorWord").find().toArray();
    return errors;
  } catch (e) {
    logger.error("Error while getting all errors :", e);
    return [];
  }
}

async function isUserAllowed(email) {
  let user = await db.collection("users").findOne({
    email: email,
  });

  if (!user) {
    return false;
  }

  return true;
}

async function updateError(theme, letter, word) {
  try {
    await db
      .collection("theme")
      .updateOne({ name: theme }, { $push: { [`words.${letter}`]: word } });

    await deleteError(theme, letter, word);
  } catch (e) {
    logger.error("Error while updating error :", e);
  }
}

async function deleteError(theme, letter, word) {
  try {
    await db.collection("errorWord").deleteOne({
      theme: theme,
      letter: letter,
      word: word,
    });
  } catch (e) {
    logger.error("Error while deleting error :", e);
  }
}
