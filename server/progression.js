
const db = require("./db");

// 레벨업 필요 경험치
function requiredExpForLevel(level) {
  return 100 + (level - 1) * 40;
}

function getUserProgress(userId) {
  const user = db
    .prepare(
      `SELECT id, nickname, level, exp, gold, gem
       FROM users WHERE id = ?`
    )
    .get(userId);
  if (!user) return null;
  return {
    id: user.id,
    nickname: user.nickname,
    level: user.level,
    exp: user.exp,
    expToNext: requiredExpForLevel(user.level),
    gold: user.gold,
    gem: user.gem,
  };
}

function addExp(userId, amount) {
  const user = db
    .prepare("SELECT id, level, exp, gold, gem FROM users WHERE id = ?")
    .get(userId);
  if (!user) return null;

  let level = user.level;
  let exp = user.exp + amount;
  let gold = user.gold;
  let gem = user.gem;
  let levelUps = 0;

  while (true) {
    const need = requiredExpForLevel(level);
    if (exp < need) break;
    exp -= need;
    level += 1;
    levelUps++;
    gold += 10 * level;
  }

  db.prepare(
    "UPDATE users SET level = ?, exp = ?, gold = ?, gem = ? WHERE id = ?"
  ).run(level, exp, gold, gem, userId);

  return { progress: getUserProgress(userId), levelUps };
}

// 인벤토리/장비 관련

function getInventory(userId) {
  const rows = db
    .prepare(
      `
      SELECT ui.id AS user_item_id,
             ui.equipped_slot,
             ui.quantity,
             i.id AS item_id,
             i.code,
             i.name,
             i.rarity,
             i.type,
             i.base_attack,
             i.base_defense,
             i.equip_slot,
             i.description
      FROM user_items ui
      JOIN items i ON ui.item_id = i.id
      WHERE ui.user_id = ?
      ORDER BY ui.equipped_slot IS NOT NULL DESC, i.rarity DESC, i.name ASC
    `
    )
    .all(userId);

  return rows.map((r) => ({
    userItemId: r.user_item_id,
    itemId: r.item_id,
    code: r.code,
    name: r.name,
    rarity: r.rarity,
    type: r.type,
    attack: r.base_attack,
    defense: r.base_defense,
    equipSlot: r.equip_slot,
    equippedSlot: r.equipped_slot,
    quantity: r.quantity,
    description: r.description,
  }));
}

function ensureItem(code, name, options = {}) {
  let item = db.prepare("SELECT * FROM items WHERE code = ?").get(code);
  if (!item) {
    const stmt = db.prepare(
      `INSERT INTO items
       (code, name, rarity, type, base_attack, base_defense, equip_slot, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const info = stmt.run(
      code,
      name,
      options.rarity || "common",
      options.type || "misc",
      options.base_attack || 0,
      options.base_defense || 0,
      options.equip_slot || null,
      options.description || null
    );
    item = db.prepare("SELECT * FROM items WHERE id = ?").get(info.lastInsertRowid);
  }
  return item;
}

function grantItemByCode(userId, code, name, options = {}, quantity = 1) {
  const item = ensureItem(code, name, options);
  const existing = db
    .prepare(
      "SELECT id, quantity FROM user_items WHERE user_id = ? AND item_id = ? AND equipped_slot IS NULL"
    )
    .get(userId, item.id);

  if (existing) {
    db.prepare("UPDATE user_items SET quantity = quantity + ? WHERE id = ?").run(
      quantity,
      existing.id
    );
  } else {
    db.prepare(
      "INSERT INTO user_items (user_id, item_id, quantity, equipped_slot) VALUES (?, ?, ?, NULL)"
    ).run(userId, item.id, quantity);
  }
  return getInventory(userId);
}

// 장비 착용
function equipItem(userId, userItemId, slotName) {
  const row = db
    .prepare(
      `SELECT ui.id AS user_item_id, ui.user_id, ui.item_id, i.equip_slot
       FROM user_items ui
       JOIN items i ON ui.item_id = i.id
       WHERE ui.id = ? AND ui.user_id = ?`
    )
    .get(userItemId, userId);
  if (!row) return { ok: false, message: "해당 아이템이 없습니다." };

  const slotToUse = slotName || row.equip_slot || "tool";

  // 해당 슬롯에 이미 장착된 아이템 unequip
  db.prepare(
    "UPDATE user_items SET equipped_slot = NULL WHERE user_id = ? AND equipped_slot = ?"
  ).run(userId, slotToUse);

  // 새로운 아이템 equip
  db.prepare(
    "UPDATE user_items SET equipped_slot = ? WHERE id = ? AND user_id = ?"
  ).run(slotToUse, userItemId, userId);

  return { ok: true, inventory: getInventory(userId) };
}

// 장비 해제 또는 창고 보관
function storeItem(userId, userItemId) {
  const row = db
    .prepare(
      "SELECT id, user_id FROM user_items WHERE id = ? AND user_id = ?"
    )
    .get(userItemId, userId);
  if (!row) return { ok: false, message: "해당 아이템이 없습니다." };

  // 여기서는 그냥 장착 해제만 (실제 창고 분리도 가능)
  db.prepare("UPDATE user_items SET equipped_slot = NULL WHERE id = ?").run(
    userItemId
  );

  return { ok: true, inventory: getInventory(userId) };
}

module.exports = {
  requiredExpForLevel,
  getUserProgress,
  addExp,
  getInventory,
  ensureItem,
  grantItemByCode,
  equipItem,
  storeItem,
};
