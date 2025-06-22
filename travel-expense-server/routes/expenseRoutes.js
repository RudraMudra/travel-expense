const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Submit expense
router.post('/submit', async (req, res) => {
  const { username, amount, currency, category, date, description, budget } = req.body;
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.decode(token);
    const requestUsername = decoded.username;

    // Validate username
    if (requestUsername !== username) {
      return res.status(403).json({ message: 'Username mismatch' });
    }

    const response = await axios.get('https://api.exchangerate.host/convert', {
      params: { from: currency, to: 'USD', amount, access_key: process.env.EXCHANGE_RATE_API_KEY },
    });
    const convertedAmount = response.data.result;
    const expense = new Expense({
      username,
      amount,
      currency,
      category,
      date,
      description,
      convertedAmount,
      policyCompliant: amount <= 500,
      status: 'Pending',
      budget, // Save the budget specific to this expense
    });
    await expense.save();

    // Update user budget only if it doesn't exist or needs updating
    if (budget !== undefined) {
      const existingUser = await User.findOne({ username });
      if (!existingUser || existingUser.budget !== budget) {
        const user = await User.findOneAndUpdate(
          { username },
          { $set: { budget } },
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );
        console.log('Updated user budget:', user); // Debug log
      }
    }

    res.status(201).json({ message: 'Expense submitted', expense });
  } catch (error) {
    console.error('Error in submit:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to submit expense', error: error.message });
  }
});

// Fetch my expenses
router.get('/my', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET);
  const decoded = jwt.decode(token);
  const username = decoded.username;

  try {
    const expenses = await Expense.find({ username });
    const user = await User.findOne({ username });
    const categoryTotals = await Expense.aggregate([
      { $match: { username } },
      { $group: { _id: '$category', total: { $sum: '$convertedAmount' } } },
    ]);
    const totalByCategory = categoryTotals.reduce((acc, curr) => {
      acc[curr._id] = curr.total;
      return acc;
    }, {});
    const responseData = expenses.map(expense => ({
      ...expense.toObject(),
      budget: expense.budget || user?.budget || 0,
      totalExpenses: totalByCategory[expense.category] || 0,
    }));
    res.json(responseData);
    // console.log('Response data:', responseData); // Debug log
  } catch (error) {
    console.error('Error in /my:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
});

// Fetch report summary
router.get('/report', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET);
    const decoded = jwt.decode(token);
    const username = decoded.username;

    const report = await Expense.aggregate([
      { $match: { username } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          convertedTotal: { $sum: '$convertedAmount' },
          status: { $first: '$status' },
        },
      },
    ]);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch report', error: error.message });
  }
});

// Fetch pending expenses (admin/manager)
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find({ status: 'Pending' });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
});

// Approve expense
router.post('/approve', async (req, res) => {
  const { expenseId } = req.body;
  try {
    const expense = await Expense.findByIdAndUpdate(expenseId, { status: 'Approved' }, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense approved', expense });
  } catch (error) {
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
});

// Reject expense
router.post('/reject', async (req, res) => {
  const { expenseId } = req.body;
  try {
    const expense = await Expense.findByIdAndUpdate(expenseId, { status: 'Rejected' }, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense rejected', expense });
  } catch (error) {
    res.status(500).json({ message: 'Rejection failed', error: error.message });
  }
});

// Analytics
router.get('/analytics', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET);
  const decoded = jwt.decode(token);
  const username = decoded.username;

  try {
    const analytics = await Expense.aggregate([
      { $match: { username } }, // Match expenses for the logged-in user
      {
        $group: {
          _id: '$category', // Group by category
          totalAmount: { $sum: '$amount' }, // Sum of original currency amounts
          totalConvertedAmount: { $sum: '$convertedAmount' }, // Sum of converted amounts
          averageConvertedAmount: { $avg: '$convertedAmount' }, // Average of converted amounts
          expenseCount: { $sum: 1 }, // Count of expenses
        },
      },
      { $sort: { totalConvertedAmount: -1 } }, // Sort by total converted amount in descending order
    ]);
    res.json(analytics);
    // console.log('Analytics:', analytics); // Debug log
  } catch (error) {
    console.error('Error in /analytics:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
});

// Monthly Analytics Route
router.get('/analytics/monthly', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET);
  const decoded = jwt.decode(token);
  const username = decoded.username;

  try {
    // Get current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Aggregate total expenses and total budget for the current month
    const overallStats = await Expense.aggregate([
      { $match: { username, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$convertedAmount' },
          totalBudget: { $sum: '$budget' },
        },
      },
    ]);

    // Aggregate category-wise expenses and budgets
    const categoryStats = await Expense.aggregate([
      { $match: { username, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      {
        $group: {
          _id: '$category',
          categoryExpenses: { $sum: '$convertedAmount' },
          categoryBudget: { $sum: '$budget' },
        },
      },
      { $sort: { categoryExpenses: -1 } }, // Sort by expenses descending
    ]);

    const totalExpenses = overallStats.length > 0 ? overallStats[0].totalExpenses : 0;
    const totalBudget = overallStats.length > 0 ? overallStats[0].totalBudget : 1000;

    // Format category-wise data
    const categories = categoryStats.map(stat => ({
      category: stat._id,
      expenses: stat.categoryExpenses,
      budget: stat.categoryBudget,
    }));

    res.json({ totalExpenses, budget: totalBudget, categories });
  } catch (error) {
    console.error('Error in /analytics/monthly:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch monthly analytics', error: error.message });
  }
});

module.exports = router;