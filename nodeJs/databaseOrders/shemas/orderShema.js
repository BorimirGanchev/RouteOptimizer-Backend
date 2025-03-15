const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  senderAddress: { type: String, required: true },
  recipientAddress: { type: String, required: true },
  orderStatus: { type: String, enum: ["for deployment", "postponed", "caceled"], default: "for deployment" },
  senderPhone: { type: String, required: true },
  recipientPhone: { type: String, required: true },
  orderPrice: { type: Number, required: true }
}, { collection: 'Orders' });

module.exports = mongoose.model('Order', orderSchema);