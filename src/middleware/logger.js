const logger = (req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next(); // 반드시 호출! 안하면 요청이 여기서 멈춘다
};

module.exports = logger;
