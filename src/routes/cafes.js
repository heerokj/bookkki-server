const express = require("express");
const router = express.Router();
const { XMLParser } = require("fast-xml-parser");

const parser = new XMLParser();

// GET  /api/cafes
router.get("/", async (req, res) => {
  const cafeName = req.query.keyword || "";
  const pageNo = Number(req.query.pageNo) || 1;
  const numOfRows = Number(req.query.numOfRows) || 5;

  const isSearch = Boolean(String(cafeName).trim());
  const start = (pageNo - 1) * numOfRows + 1;
  const to = pageNo * numOfRows;

  try {
    const response = await fetch(
      isSearch
        ? `https://api.kcisa.kr/openapi/API_CIA_090/request?serviceKey=${
            process.env.CAFE_SERVICE_KEY
          }&keyword=${encodeURIComponent(
            cafeName
          )}&numOfRows=${numOfRows}&pageNo=${start}`
        : `https://api.kcisa.kr/openapi/API_CIA_090/request?serviceKey=${process.env.CAFE_SERVICE_KEY}&numOfRows=5&pageNo=20`
    );

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "공공데이터 API 오류",
      });
    }

    const xml = await response.text();
    const json = parser.parse(xml);

    if (!isSearch) {
      return res.status(200).json(json);
    }

    const items = json.response.body.items.item ?? [];
    const totalCount = json.response.body.totalCount;
    const hasNext = to < (totalCount || 0);

    return res.status(200).json({
      data: items,
      count: totalCount,
      hasNext,
      nextPage: pageNo + 1,
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
