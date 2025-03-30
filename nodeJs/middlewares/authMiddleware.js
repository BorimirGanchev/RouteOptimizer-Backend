const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, "your_jwt_secret"); 

    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }

    req.user = decoded; 
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
