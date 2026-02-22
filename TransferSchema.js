const mongoose = require('mongoose');

const TransferSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: String, required: true },
  txHash: { type: String, required: true },
  status: { type: String, default: 'Success' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transfer', TransferSchema);