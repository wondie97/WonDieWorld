const db = require("./db");

function listItem(seller, item, price, cb) {
  db.run(
    `INSERT INTO market (seller, item, price) VALUES (?, ?, ?)`,
    [seller, item, price],
    err => cb(!err)
  );
}

function getMarket(cb) {
  db.all(
    `SELECT * FROM market WHERE sold = 0 ORDER BY price ASC`,
    (err, rows) => {
      if (err) return cb([]);
      cb(rows);
    }
  );
}

function buyItem(marketId, buyer, cb) {
  db.run(
    `UPDATE market SET sold = 1 WHERE id = ? AND sold = 0`,
    [marketId],
    function (err) {
      if (err || this.changes === 0) return cb(false);
      cb(true);
    }
  );
}

module.exports = {
  listItem,
  getMarket,
  buyItem
};
