import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'antd';
import axios from 'axios';
import Chart from 'chart.js/auto';
import './ExpenseAnalytics.css';

const ExpenseAnalytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/expenses/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Analytics response:', response.data);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error.message, error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleShowChart = () => {
    setShowChart(true);
  };

  useEffect(() => {
    if (showChart && analytics.length > 0 && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: analytics.map(a => a._id), // Categories (e.g., expense categories)
          datasets: [
            {
              label: 'Total Amount (Original Currency)',
              data: analytics.map(a => a.totalAmount), // Total Amount
              backgroundColor: 'rgba(255, 99, 132, 0.2)', // Light red
              borderColor: 'rgba(255, 99, 132, 1)', // Red border
              borderWidth: 1,
            },
            {
              label: 'Total Converted Amount (USD)',
              data: analytics.map(a => a.totalConvertedAmount), // Total Converted Amount
              backgroundColor: 'rgba(75, 192, 192, 0.2)', // Light green
              borderColor: 'rgba(75, 192, 192, 1)', // Green border
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            legend: {
              position: 'top',
            },
          },
        },
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [showChart, analytics]);

  return (
    <div className="analytics-container">
      <h2 style={{ color: '#1890ff', fontSize: '24px', marginBottom: '20px' }}>Expense Analytics</h2>
      {loading ? (
        <p>Loading analytics...</p>
      ) : analytics.length === 0 ? (
        <p>No analytics data available. Submit some expenses to see results!</p>
      ) : (
        <div>
          <div className="analytics-list">
            {analytics.map((item, index) => (
              <div key={index} className="analytics-card">
                <h3>{item._id}</h3>
                <p><strong>Total:</strong> <span className="highlight">${item.totalConvertedAmount.toFixed(2)}</span></p>
                <p><strong>Average:</strong> <span className="highlight">${item.averageConvertedAmount.toFixed(2)}</span></p>
                <p><strong>Count:</strong> {item.expenseCount}</p>
              </div>
            ))}
          </div>
          <Button type="primary" onClick={handleShowChart} disabled={analytics.length === 0} style={{ marginTop: '20px' }}>
            View Chart
          </Button>
          {showChart && (
            <div className="chart-container">
              <canvas ref={chartRef} width="400" height="150"></canvas>
              <Button type="link" onClick={() => setShowChart(false)} style={{ marginTop: '10px' }}>
                Hide Chart
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseAnalytics;