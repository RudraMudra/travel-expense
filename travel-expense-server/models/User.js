const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  budget: { type: Number, default: 0 },
  role: { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee' },
});

module.exports = mongoose.model('User', userSchema);