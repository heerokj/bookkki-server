const jwt = require("jsonwebtoken");

// 검증하고 -> 라우터로 넘겨줌
const authMiddleware = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: "로그인이 필요해요" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 이후 라우터에서 req.user로 접근 가능!
    next(); // 통과! 다음으로 넘어가
  } catch (error) {
    return res.status(401).json({ message: "토큰이 유효하지 않아요" });
  }
};

module.exports = authMiddleware;
