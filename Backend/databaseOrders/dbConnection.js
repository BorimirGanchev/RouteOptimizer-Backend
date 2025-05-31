require('dotenv').config();
const mongoose  = require('mongoose');

const DBURI = process.env.MONGODB_URI;
const DB_NAME = 'Route-Optimizer'; // Explicit database name

async function connectDB() {
    try{
        await mongoose.connect(DBURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: false,
            directConnection: true,
            ssl: false,
            tls: false,
            dbName: DB_NAME, // Explicitly set the database name
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to DB');
        // Log the connection state to debug
        console.log('Connection state:', mongoose.connection.readyState);
        // Log the current database
        console.log('Current database:', mongoose.connection.db.databaseName);
        
        // Verify collections exist
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
    } catch(err) {
        console.log('Error connecting to DB:', err.message);
        console.log('Full error:', err);
        throw err;
    }
}

module.exports = connectDB;