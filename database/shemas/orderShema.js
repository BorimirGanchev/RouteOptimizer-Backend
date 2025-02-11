const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  fullName: String,
  senderAddress: String,
  recipientAddress: String,
  orderStatus: String,
  senderPhone: String,
  recipientPhone: String,
  orderPrice: Number
}, { collection: 'Orders' });

module.exports = mongoose.model('Order', orderSchema,);