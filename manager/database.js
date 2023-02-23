module.exports = {
  getRandomWords,
};

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
