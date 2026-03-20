const express = require("express");
const router = express.Router();

// GET /api/hello
router.get("/hello", (req, res) => {
  res.json({ message: "서버 연결 성공! 👋" });
});

module.exports = router;
