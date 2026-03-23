const express = require("express");
const router = express.Router();

// GET /api/books?query=책제목&page=1&display=10
router.get("/", async (req, res) => {
  const bookTitle = req.query.query || "";
  const pageParam = Number(req.query.page) || 1;
  const display = Number(req.query.display) || 10;

  const start = (pageParam - 1) * display + 1;
  const to = pageParam * display;

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(
        bookTitle
      )}&start=${start}&display=${display}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "네이버 API 오류",
      });
    }

    const data = await response.json();
    const hasNext = to < (data.total || 0);

    return res.status(200).json({
      data: data.items,
      count: data.total,
      hasNext,
      nextPage: pageParam + 1,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

module.exports = router;
