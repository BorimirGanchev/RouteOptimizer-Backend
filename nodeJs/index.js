require('dotenv').config();
const cors = require('cors')
const express  = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const connectDB = require('./databaseOrders/dbConnection');
const UserModel = require('./databaseUsers/shemas/users');
const verifyToken = require('./middleware/verifyToken');

const PORT = 8000;

const getOrders = require('./routes/orders');

app.use(cors())
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use('/orders', getOrders);

app.get('/', (req, res) => {
    res.send('Welcome to the Route Optimizer Backend!');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.password !== password) { 
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, "your_jwt_secret", { expiresIn: "1h" });

    res.json({ message: "Login successful", token, user: { role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

app.post('/signup', (req, res) => {
  UserModel.create(req.body)
  .then(users => res.json(users))
  .catch(err => res.json(err))
});


connectDB();