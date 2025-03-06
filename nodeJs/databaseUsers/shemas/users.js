const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
}, { collection: 'Users' });

module.exports = mongoose.model('Users', userSchema,);