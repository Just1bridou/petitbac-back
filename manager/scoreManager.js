module.exports = { computeScore };

const scores = [
  { lettre: "A", score: 1 },
  { lettre: "E", score: 1 },
  { lettre: "I", score: 1 },
  { lettre: "L", score: 1 },
  { lettre: "N", score: 1 },
  { lettre: "O", score: 1 },
  { lettre: "R", score: 1 },
  { lettre: "S", score: 1 },
  { lettre: "T", score: 1 },
  { lettre: "U", score: 1 },
  { lettre: "D", score: 2 },
  { lettre: "G", score: 2 },
  { lettre: "B", score: 3 },
  { lettre: "C", score: 3 },
  { lettre: "M", score: 3 },
  { lettre: "P", score: 3 },
  { lettre: "F", score: 4 },
  { lettre: "H", score: 4 },
  { lettre: "V", score: 4 },
  { lettre: "J", score: 8 },
  { lettre: "Q", score: 8 },
  { lettre: "K", score: 10 },
  { lettre: "W", score: 10 },
  { lettre: "X", score: 10 },
  { lettre: "Y", score: 10 },
  { lettre: "Z", score: 10 },
];

function computeScore(word) {
  let score = 0;
  for (let i = 0; i < word.length; i++) {
    let letter = word[i];
    let scoreLetter = scores.find((s) => s.lettre === letter.toUpperCase());
    if (scoreLetter) {
      score += scoreLetter.score;
    }
  }
  return score;
}
