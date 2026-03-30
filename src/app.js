const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const postsRouter = require("./routes/posts");
const commentsRouter = require("./routes/comments");
const booksRouter = require("./routes/books");
const cafesRouter = require("./routes/cafes");
const uploadsRouter = require("./routes/uploads");
const logger = require("./middleware/logger");

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(logger); // 추가 (모든 요청에 적용)

// 라우터 연결
app.use("/api", indexRouter);
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/books", booksRouter);
app.use("/api/cafes", cafesRouter);
app.use("/api/uploads", uploadsRouter);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 실행중 → http://localhost:${PORT}`);
});
