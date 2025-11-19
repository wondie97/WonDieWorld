const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "WonDieWorldSecretKey";

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function register(username, password, callback) {
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return callback({ error: "HASH_ERROR" });

    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, hash],
      function (error) {
        if (error) {
          return callback({ error: "USERNAME_EXISTS" });
        }
        callback(null, { ok: true });
      }
    );
  });
}

function login(username, password, callback) {
  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, row) => {
      if (err) return callback({ error: "DB_ERROR" });
      if (!row) return callback({ error: "USER_NOT_FOUND" });

      bcrypt.compare(password, row.password, (err, ok) => {
        if (!ok) return callback({ error: "WRONG_PASSWORD" });

        const token = jwt.sign({ userId: row.id }, JWT_SECRET, {
          expiresIn: "7d"
        });

        callback(null, { userId: row.id, token });
      });
    }
  );
}

module.exports = {
  verifyToken,
  register,
  login
};
