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
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://bookkki.vercel.app", // 배포된 프론트 주소
    ],
    credentials: true, // 쿠키 허용
  })
);
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
if (process.env.NODE_ENV !== "production") {
  app.listen(4000, () => console.log("Server running on 4000"));
}

module.exports = app;
