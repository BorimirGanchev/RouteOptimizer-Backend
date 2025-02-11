require('dotenv').config();
const express  = require('express');
const app = express();
const connectDB = require('./database/dbConnection');

const PORT = 8000;

const getOrders = require('./routes/orders');

app.use('/orders', getOrders);

connectDB();

app.get('/', (req, res) => {
    res.send('Welcome to the Route Optimizer Backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});