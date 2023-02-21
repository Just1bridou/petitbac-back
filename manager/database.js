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

function getRandomWords() {
  let COUNT = 7;
  let words = [];
  for (let i = 0; i < COUNT; i++) {
    let category = categories[Math.floor(Math.random() * categories.length)];
    words.push(category);
  }
  return words;
}
