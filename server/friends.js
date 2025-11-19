const db = require("./db");

function addFriend(userId, friendId, cb) {
  db.run(
    `INSERT INTO friends (user_id, friend_id) VALUES (?, ?)`,
    [userId, friendId],
    function (err) {
      if (err) return cb(false);
      cb(true);
    }
  );
}

function getFriends(userId, cb) {
  db.all(
    `SELECT friend_id FROM friends WHERE user_id = ?`,
    [userId],
    (err, rows) => {
      if (err) return cb([]);
      cb(rows.map(r => r.friend_id));
    }
  );
}

function sendMail(to, from, item, message, cb) {
  db.run(
    `INSERT INTO mail (to_user, from_user, item, message) VALUES (?, ?, ?, ?)`,
    [to, from, item, message],
    function (err) {
      if (err) return cb(false);
      cb(true);
    }
  );
}

function getMail(userId, cb) {
  db.all(
    `SELECT * FROM mail WHERE to_user = ? AND taken = 0`,
    [userId],
    (err, rows) => {
      if (err) return cb([]);
      cb(rows);
    }
  );
}

function takeMail(mailId, cb) {
  db.run(
    `UPDATE mail SET taken = 1 WHERE id = ?`,
    [mailId],
    err => cb(!err)
  );
}

module.exports = {
  addFriend,
  getFriends,
  sendMail,
  getMail,
  takeMail
};
