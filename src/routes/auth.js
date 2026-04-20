const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const supabase = require("../lib/supabase");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
const axios = require("axios");

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
    sameSite: "none", // lax → none 으로 변경 (크로스 도메인 허용)
    secure: true, // none 쓰려면 https 필수
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

// POST /api/auth/logout - 로그아웃
router.post("/logout", async (req, res) => {
  res.clearCookie("token", {
    sameSite: "none",
    secure: true,
  });
  res.json({ message: "로그아웃 성공!" });
});

// GET /api/auth/me - 내 정보 조회
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, user_id, nickname, email, profile_url, provider, created_at")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(500).json({
        message: "사용자 정보를 불러오는데 실패했습니다.",
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    return res.status(200).json({
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "서버 오류가 발생했습니다.",
      error: error.message,
    });
  }
});
// GET /api/auth/kakao - 카카오 인증 URL로 리다이렉트
router.get("/kakao", (req, res) => {
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}&response_type=code`;
  res.redirect(kakaoAuthUrl); //브라우저한테 이 URL로 이동해!
});

// GET /api/auth/kakao/callback - 카카오 콜백
router.get("/kakao/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: "카카오 인증 코드가 없어요" });
  }

  try {
    // 1. code로 카카오 access_token 교환
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );
    const kakaoAccessToken = tokenResponse.data.access_token;

    // 2. 카카오 access_token으로 유저 정보 조회
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });
    const kakaoUser = userResponse.data;
    const kakaoId = String(kakaoUser.id);
    const nickname = kakaoUser.kakao_account?.profile?.nickname || null;
    const profile_url =
      kakaoUser.kakao_account?.profile?.profile_image_url || null;

    // 3. Supabase에서 기존 유저 조회
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", kakaoId)
      .eq("provider", "kakao")
      .single();

    let user = existingUser;

    // 4. 없으면 새로 저장 (소셜 로그인은 비밀번호 없음)
    if (!user) {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          user_id: kakaoId,
          nickname,
          profile_url,
          provider: "kakao",
        })
        .select()
        .single();

      if (error) return res.status(500).json({ message: error.message });
      user = newUser;
    }

    // 5. 북끼 JWT 발급
    const token = jwt.sign(
      {
        id: user.id,
        user_id: user.user_id,
        nickname: user.nickname,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. 쿠키 저장 후 프론트로 리다이렉트
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // 7. 로그인 성공 후 프론트 메인 페이지로 이동
    res.redirect(process.env.CLIENT_URL);
  } catch (error) {
    console.error("카카오 로그인 오류:", error.message);
    res.status(500).json({ message: "카카오 로그인에 실패했어요" });
  }
});

// GET /api/auth/naver - 네이버 인증 URL로 리다이렉트
router.get("/naver", (req, res) => {
  const state = Math.random().toString(36).substring(2); // CSRF 방어용 랜덤값
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?client_id=${process.env.NAVER_CLIENT_ID}&redirect_uri=${process.env.NAVER_REDIRECT_URI}&response_type=code&state=${state}`;
  res.redirect(naverAuthUrl);
});

// GET /api/auth/naver/callback - 네이버 콜백
router.get("/naver/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ message: "네이버 인증 코드가 없어요" });
  }

  try {
    // 1. code로 네이버 access_token 교환
    const tokenResponse = await axios.get(
      "https://nid.naver.com/oauth2.0/token",
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.NAVER_CLIENT_ID,
          client_secret: process.env.NAVER_CLIENT_SECRET,
          redirect_uri: process.env.NAVER_REDIRECT_URI,
          code,
          state,
        },
      }
    );

    const naverAccessToken = tokenResponse.data.access_token;

    // 2. 네이버 access_token으로 유저 정보 조회
    const userResponse = await axios.get(
      "https://openapi.naver.com/v1/nid/me",
      {
        headers: { Authorization: `Bearer ${naverAccessToken}` },
      }
    );

    const naverUser = userResponse.data.response;
    const naverId = naverUser.id;
    const nickname = naverUser.nickname || null;
    const profile_url = naverUser.profile_image || null;

    // 3. Supabase에서 기존 유저 조회
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", naverId)
      .eq("provider", "naver")
      .single();

    let user = existingUser;

    // 4. 없으면 새로 저장
    if (!user) {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          user_id: naverId,
          nickname,
          profile_url,
          provider: "naver",
        })
        .select()
        .single();

      if (error) return res.status(500).json({ message: error.message });
      user = newUser;
    }

    // 5. 북끼 JWT 발급
    const token = jwt.sign(
      { id: user.id, user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. 쿠키 저장 후 리다이렉트
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // 7. 로그인 성공 후 프론트 메인 페이지로 이동
    res.redirect(process.env.CLIENT_URL);
  } catch (error) {
    console.error("네이버 로그인 오류:", error.message);
    res.status(500).json({ message: "네이버 로그인에 실패했어요" });
  }
});

module.exports = router;
