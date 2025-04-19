const jwt = require('jsonwebtoken');
const UserModel = require('../databaseUsers/shemas/users');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = req.headers.authorization.split(" ")[1];
  console.log("Token:", token);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user; 
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    res.status(401).json({ message: 'Invalid token', error: err });
  }
};

module.exports = authenticate;
