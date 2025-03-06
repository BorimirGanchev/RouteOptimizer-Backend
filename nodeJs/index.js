require('dotenv').config();
const cors = require('cors')
const express  = require('express');
const app = express();
const connectDB = require('./databaseOrders/dbConnection');
const UserModel = require('./databaseUsers/shemas/users');

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

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  UserModel.findOne({email: email})
  .then(user => {
    if(user){
      if (user.password === password) {
        res.json({message: 'Login successful'});
      } else {
        res.json({message: 'Invalid password'});
      }
    } else {
      res.json({message: 'User not found'});
    }
  })
}); 

app.post('/signup', (req, res) => {
  UserModel.create(req.body)
  .then(users => res.json(users))
  .catch(err => res.json(err))
});

connectDB();