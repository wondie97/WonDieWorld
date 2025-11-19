
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET_KEY";

function validateEmail(email) {
  return typeof email === "string" && email.includes("@");
}
function validatePassword(password) {
  return typeof password === "string" && password.length >= 4;
}
function validateNickname(nickname) {
  return typeof nickname === "string" && nickname.trim().length >= 2;
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, nickname } = req.body || {};
    if (!validateEmail(email)) {
      return res.status(400).json({ ok: false, message: "잘못된 이메일 형식" });
    }
    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ ok: false, message: "비밀번호는 최소 4자 이상" });
    }
    if (!validateNickname(nickname)) {
      return res
        .status(400)
        .json({ ok: false, message: "닉네임은 최소 2자 이상" });
    }

    const exists = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email.trim().toLowerCase());
    if (exists) {
      return res
        .status(409)
        .json({ ok: false, message: "이미 가입된 이메일입니다." });
    }

    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare(
      "INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)"
    );
    const info = stmt.run(email.trim().toLowerCase(), hash, nickname.trim());

    const user = db
      .prepare(
        "SELECT id, email, nickname, level, exp, gold, gem, created_at FROM users WHERE id = ?"
      )
      .get(info.lastInsertRowid);
    const token = jwt.sign(
      { id: user.id, email: user.email, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ ok: true, token, user });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ ok: false, message: "서버 오류" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "이메일과 비밀번호를 입력하세요." });
    }
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email.trim().toLowerCase());
    if (!user) {
      return res
        .status(401)
        .json({ ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(
      user.id
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      level: user.level,
      exp: user.exp,
      gold: user.gold,
      gem: user.gem,
    };

    const token = jwt.sign(
      { id: safeUser.id, email: safeUser.email, nickname: safeUser.nickname },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ ok: true, token, user: safeUser });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ ok: false, message: "서버 오류" });
  }
});

module.exports = { router, JWT_SECRET };
