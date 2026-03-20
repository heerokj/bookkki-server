const express = require("express");
const router = express.Router();

// 임시 데이터 (나중에 Supabase로 교체)
const posts = [
  { id: 1, title: "첫번째 글", content: "내용1" },
  { id: 2, title: "두번째 글", content: "내용2" },
];

// GET /api/posts - 목록 조회
router.get("/", (req, res) => {
  res.json({ data: posts });
});

module.exports = router;
