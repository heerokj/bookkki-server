const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const supabase = require("../lib/supabase");
const jwt = require("jsonwebtoken");

// POST /api/auth/signup - 회원가입
router.post("/signup", async (req, res) => {
  const { user_id, password, nickname } = req.body;

  if (!user_id || !password || !nickname) {
    return res
      .status(400)
      .json({ message: "user_id, 비밀번호, 닉네임을 입력해주세요" });
  }

  if (user_id.length > 20) {
    return res.status(400).json({ message: "아이디는 20자 이하입니다." });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "비밀번호는 8자 이상입니다." });
  }

  if (password.length > 12) {
    return res.status(400).json({ message: "비밀번호는 12자 이하입니다." });
  }

  if (nickname.length > 10) {
    return res.status(400).json({ message: "닉네임은 10자 이하입니다." });
  }

  //중복 확인
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", user_id)
    .single();

  if (existingUser) {
    return res.status(409).json({ message: "이미 사용 중인 아이디입니다." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert({
      user_id,
      password: hashedPassword,
      nickname,
      provider: "email",
    })
    .select("id, user_id, nickname, created_at")
    .single();

  if (error) return res.status(500).json({ message: error.message });

  res.status(201).json({ message: "회원가입 성공!", data });
});

// POST /api/auth/login - 로그인
router.post("/login", async (req, res) => {
  const { user_id, password } = req.body;

  // 입력값 검증
  if (!user_id || !password) {
    return res
      .status(400)
      .json({ message: "user_id와 비밀번호를 입력해주세요" });
  }

  // 유저 조회
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (!user) {
    return res.status(401).json({ message: "아이디 또는 비밀번호가 틀렸어요" });
  }

  // 비밀번호 검증
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: "아이디 또는 비밀번호가 틀렸어요" });
  }

  // JWT 발급 - 엑세스토큰임
  const token = jwt.sign(
    {
      id: user.id,
      user_id: user.user_id,
      nickname: user.nickname,
    }, // 토큰에 담을 정보
    process.env.JWT_SECRET, // 서명 비밀키
    { expiresIn: "7d" } // 만료 기간
  );

  // 쿠키에 저장
  res.cookie("token", token, {
    httpOnly: true, // JS에서 접근 불가 (XSS 방어)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초)
    sameSite: "lax",
  });

  res.json({
    message: "로그인 성공!",
    data: {
      id: user.id,
      user_id: user.user_id,
      nickname: user.nickname,
      profile_url: user.profile_url,
    },
  });
});

module.exports = router;
