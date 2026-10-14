const Database = require("better-sqlite3");
const db = new Database("varquest.db");

// Drop and recreate tables to apply schema change
db.exec(`DROP TABLE IF EXISTS Round`);
db.exec(`DROP TABLE IF EXISTS Question`);

// Create Question table
db.exec(`
  CREATE TABLE IF NOT EXISTS Question (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    expression_text TEXT NOT NULL,
    correct_type TEXT NOT NULL CHECK(correct_type IN ('int','str','float','bool','list','tuple'))
  )
`);

// Create Round table with player_answer field
db.exec(`
  CREATE TABLE IF NOT EXISTS Round (
    round_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    player_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES Question(question_id)
  )
`);

// Seed questions
const insert = db.prepare(
  "INSERT INTO Question (expression_text, correct_type) VALUES (?, ?)"
);

const questions = [
  { expr: 'x = "hello"',        type: "str"   },
  { expr: "x = 42",             type: "int"   },
  { expr: "x = 3.14",           type: "float" },
  { expr: "x = True",           type: "bool"  },
  { expr: 'x = ["a", "b"]',     type: "list"  },
  { expr: "x = (1, 2, 3)",      type: "tuple" },
  { expr: 'x = "99"',           type: "str"   },
  { expr: "x = 0",              type: "int"   },
  { expr: "x = False",          type: "bool"  },
  { expr: "x = 2.0",            type: "float" },
  { expr: 'x = ["hello"]',      type: "list"  },
  { expr: "x = (True, False)",  type: "tuple" },
  { expr: 'x = ""',             type: "str"   },
  { expr: "x = 100",            type: "int"   },
  { expr: "x = 0.5",            type: "float" },
];

for (const q of questions) {
  insert.run(q.expr, q.type);
}

console.log("Database ready.");
module.exports = db;