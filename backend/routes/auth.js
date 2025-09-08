const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// Register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users(username, password) VALUES($1, $2) RETURNING id, username",
      [username, hash]
    );

    console.log("✅ User đã đăng ký:", result.rows[0]);
    res.json({ message: "Đăng ký thành công", user: result.rows[0] });
  } catch (err) {
    console.error("❌ Lỗi trong /register:", err.message);
    res.status(500).json({ message: "Lỗi server hoặc user đã tồn tại" });
  }
});


// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Vui lòng nhập username và password" });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, password FROM users WHERE username = $1",
      [username]
    );

    const user = result.rows[0];
    if (!user) {
      console.log("❌ Không tìm thấy user:", username);
      return res.status(400).json({ message: "User không tồn tại" });
    }

    console.log("👉 Password nhập vào:", password);
    console.log("👉 Password hash trong DB:", user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Sai mật khẩu cho user:", username);
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    console.log("✅ Login thành công:", username);

    res.json({
      message: "Đăng nhập thành công ✅",
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error("❌ Lỗi trong /login:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
