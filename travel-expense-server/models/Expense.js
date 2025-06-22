const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Changed from userId to username
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['USD', 'EUR', 'GBP', 'JPY'], required: true },
  category: String,
  date: { type: Date, default: Date.now },
  description: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Reimbursed'], default: 'Pending' },
  budget: { type: Number },
  totalExpenses: { type: Number },
  convertedAmount: { type: Number },
  policyCompliant: { type: Boolean, default: true },
});

module.exports = mongoose.model('Expense', expenseSchema);