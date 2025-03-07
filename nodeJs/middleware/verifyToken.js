const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  
  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(token.split(" ")[1], "your_jwt_secret", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;