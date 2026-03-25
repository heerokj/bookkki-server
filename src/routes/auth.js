const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const supabase = require("../lib/supabase");

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

module.exports = router;
