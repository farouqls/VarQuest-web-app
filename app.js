const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const db = require("./database");

const app = express();

// Setup
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Helper: pick 10 random questions from the bank
function getRandomQuestions() {
  return db
    .prepare("SELECT * FROM Question ORDER BY RANDOM() LIMIT 10")
    .all();
}

// Helper: explanation for each data type
function getExplanation(type) {
  const explanations = {
    str:   "A string (str) is a sequence of characters enclosed in quotes.",
    int:   "An integer (int) is a whole number with no decimal point.",
    float: "A float is a number that contains a decimal point.",
    bool:  "A boolean (bool) is either True or False.",
    list:  "A list is an ordered, mutable collection enclosed in square brackets [].",
    tuple: "A tuple is an ordered, immutable collection enclosed in parentheses ().",
  };
  return explanations[type] || "";
}

// Helper: feedback message based on score
function getFeedback(score) {
  if (score >= 9) return "Outstanding! You have mastered Python data types.";
  if (score >= 7) return "Strong comprehension of fundamental data types with minor review recommended.";
  if (score >= 5) return "Good effort. Review the types you missed and try again.";
  return "Keep practicing — revisit the data types and give it another go.";
}

// Helper: rating label based on score
function getRating(score) {
  if (score >= 9) return "Expert";
  if (score >= 7) return "Proficient";
  if (score >= 5) return "Developing";
  return "Beginner";
}

// --- ROUTES ---
// Start Screen
app.get("/", function (req, res) {
  res.render("start", { title: "VarQuest" });
});

// Begin a new game session
app.get("/game/start", function (req, res) {
  const sessionId = uuidv4();
  const questions = getRandomQuestions();

  res.redirect(
    `/game/1?session=${sessionId}&questions=${questions
      .map((q) => q.question_id)
      .join(",")}`
  );
});

// Question Screen
app.get("/game/:round", function (req, res) {
  const round = parseInt(req.params.round);
  const sessionId = req.query.session;
  const questionIds = req.query.questions.split(",").map(Number);
  const questionId = questionIds[round - 1];

  const question = db
    .prepare("SELECT * FROM Question WHERE question_id = ?")
    .get(questionId);

  res.render("question", {
    title: "VarQuest",
    round: round,
    total: 10,
    question: question,
    sessionId: sessionId,
    questionIds: questionIds.join(","),
    types: ["int", "str", "float", "bool", "list", "tuple"],
  });
});

// Reveal Answer
app.post("/game/:round/reveal", function (req, res) {
  const round = parseInt(req.params.round);
  const sessionId = req.body.sessionId;
  const questionIds = req.body.questionIds.split(",").map(Number);
  const questionId = questionIds[round - 1];
  const playerAnswer = req.body.playerAnswer;

  const question = db
    .prepare("SELECT * FROM Question WHERE question_id = ?")
    .get(questionId);

  const isCorrect = playerAnswer === question.correct_type ? 1 : 0;

  // Save round to database
  db.prepare(
    "INSERT INTO Round (session_id, question_id, player_answer, is_correct) VALUES (?, ?, ?, ?)"
  ).run(sessionId, questionId, playerAnswer, isCorrect);

  res.render("reveal", {
    title: "VarQuest",
    round: round,
    total: 10,
    question: question,
    sessionId: sessionId,
    questionIds: questionIds.join(","),
    playerAnswer: playerAnswer,
    isCorrect: isCorrect,
    getExplanation: getExplanation,
  });
});

// Move to next round or results
app.post("/game/:round/next", function (req, res) {
  const round = parseInt(req.params.round);
  const sessionId = req.body.sessionId;
  const questionIds = req.body.questionIds.split(",").map(Number);

  if (round < 10) {
    res.redirect(
      `/game/${round + 1}?session=${sessionId}&questions=${questionIds.join(",")}`
    );
  } else {
    res.redirect(`/results?session=${sessionId}`);
  }
});

// Results Screen
app.get("/results", function (req, res) {
  const sessionId = req.query.session;

  const correct = db
    .prepare(
      "SELECT COUNT(*) as count FROM Round WHERE session_id = ? AND is_correct = 1"
    )
    .get(sessionId);

  res.render("results", {
    title: "VarQuest",
    score: correct.count,
    total: 10,
    getFeedback: getFeedback,
    getRating: getRating,
  });
});

// Start server
app.listen(3000, function () {
  console.log("VarQuest running at http://localhost:3000");
});