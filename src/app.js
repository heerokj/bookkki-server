const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

const indexRouter = require("./routes/index");
const postsRouter = require("./routes/posts");
const logger = require("./middleware/logger");

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(logger); // 추가 (모든 요청에 적용)

// 라우터 연결
app.use("/api", indexRouter);
app.use("/api/posts", postsRouter);

// 서버 시작
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
