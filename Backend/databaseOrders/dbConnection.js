require('dotenv').config();
const mongoose  = require('mongoose');

const DBURI = process.env.MONGODB_URI

async function connectDB() {
    try{
        await mongoose.connect(DBURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: false,
            directConnection: true,
            ssl: false,
            tls: false,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to DB');
        // Log the connection state to debug
        console.log('Connection state:', mongoose.connection.readyState);
        // Log the current database
        console.log('Current database:', mongoose.connection.db.databaseName);
    } catch(err) {
        console.log('Error connecting to DB:', err.message);
        console.log('Full error:', err);
        throw err;
    }
}

module.exports = connectDB;