const mongoose = require('mongoose');

const VictimSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  amount: { type: String, default: '0' },
  status: { type: String, enum: ['Pending', 'Approved', 'Withdrawn'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Victim', VictimSchema);