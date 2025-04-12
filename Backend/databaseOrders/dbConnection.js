require('dotenv').config();
const mongoose  = require('mongoose');

const DBURI = process.env.MONGODB_URI

async function connectDB() {
    try{
        await mongoose.connect(DBURI);
        console.log('Connected to DB');
    } catch(err) {
        console.log('Error connecting to DB', err);
    }
}

module.exports = connectDB;