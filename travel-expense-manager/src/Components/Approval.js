import React, { useState, useEffect } from 'react';
import { Table, Button, message, Space, Select, DatePicker } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
// import './Approval.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Approval = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ user: '', dateRange: null });

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/expenses?status=Pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setExpenses(response.data);
    } catch (error) {
      message.error('Failed to fetch expenses: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (record) => {
    try {
      await axios.post('http://localhost:5000/api/expenses/approve', { expenseId: record._id }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      message.success('Expense approved');
      fetchExpenses();
    } catch (error) {
      message.error('Approval failed: ' + error.message);
    }
  };

  const handleReject = async (record) => {
    try {
      await axios.post('http://localhost:5000/api/expenses/reject', { expenseId: record._id }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      message.success('Expense rejected');
      fetchExpenses();
    } catch (error) {
      message.error('Rejection failed: ' + error.message);
    }
  };

  const handleFilterChange = (value, field) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const columns = [
    { title: 'User', dataIndex: 'userId', key: 'userId' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount' },
    { title: 'Currency', dataIndex: 'currency', key: 'currency' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space>
          <Button icon={<CheckOutlined />} onClick={() => handleApprove(record)} type="primary">Approve</Button>
          <Button icon={<CloseOutlined />} onClick={() => handleReject(record)} danger>Reject</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="approval-container">
      <h2 style={{ color: '#1890ff', fontSize: '24px', marginBottom: '20px' }}>Expense Approvals</h2>
      <div style={{ marginBottom: '20px' }}>
        <Space>
          <Select
            placeholder="Filter by User"
            onChange={(value) => handleFilterChange(value, 'user')}
            style={{ width: 200 }}
            allowClear
          >
            <Option value="user1">User 1</Option>
            <Option value="user2">User 2</Option>
          </Select>
          <RangePicker onChange={(dates) => handleFilterChange(dates, 'dateRange')} />
        </Space>
      </div>
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

export default Approval;