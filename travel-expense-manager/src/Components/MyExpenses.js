import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Table, message } from 'antd';
import axios from 'axios';
import './MyExpenses.css';

const MyExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const alertTriggered = useRef(false); // To prevent multiple alerts

  // Fetch expenses function wrapped in useCallback to avoid re-creation
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/expenses/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      console.log('Fetched expenses:', data); // Debug log
      setExpenses(data);

      if (data.length > 0 && !alertTriggered.current) {
        // Find the latest expense by date
        const latestExpense = data.reduce((latest, current) =>
          new Date(latest.date) > new Date(current.date) ? latest : current
        );
        console.log('Latest Expense:', latestExpense); // Debug log
        checkBudgetAlert(latestExpense.budget, latestExpense.convertedAmount);
        alertTriggered.current = true; // Mark alert as triggered
      }
    } catch (error) {
      message.error('Failed to fetch expenses: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Budget alert checker
  const checkBudgetAlert = (budget, amount) => {
    if (budget && amount) {
      const percentageUsed = (amount / budget) * 100;
      console.log(`Budget: ${budget}, Amount: ${amount}, Percentage Used: ${percentageUsed}`); // Debug log
      if (percentageUsed >= 80) {
        message.warning(
          `Warning: The latest expense of ${amount.toFixed(2)} exceeds 80% of your ${budget} budget!`,
          1.5
        );
      } else if (percentageUsed >= 50) {
        message.info(
          `Note: The latest expense of ${amount.toFixed(2)} is ${percentageUsed.toFixed(1)}% of your ${budget} budget.`,
          1.5
        );
      }
    }
  };

  // useEffect to fetch expenses on component mount
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Table columns definition
  const columns = [
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount' },
    { title: 'Currency', dataIndex: 'currency', key: 'currency' },
    { title: 'Converted Amount', dataIndex: 'convertedAmount', key: 'convertedAmount' },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (text) => text || 'Not set',
    },
    { title: 'Total Expenses', dataIndex: 'totalExpenses', key: 'totalExpenses' },
  ];

  return (
    <div className="my-expenses-container">
      <h2 style={{ color: '#1890ff', fontSize: '24px', marginBottom: '20px' }}>My Expenses</h2>
      <Table
        columns={columns}
        dataSource={expenses}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default MyExpenses;