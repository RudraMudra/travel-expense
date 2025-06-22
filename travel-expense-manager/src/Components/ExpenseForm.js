import React, { useState } from 'react';
import { Form, Input, Select, DatePicker, Button, message, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import './ExpenseForm.css';

const { Option } = Select;

const ExpenseForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const onFinish = async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      console.log('Decoded JWT:', decoded); // <-- Add this
      const username = decoded.username; // <-- Use username, not userId
      const category = values.category === 'Other' ? customCategory.trim() : values.category;

      if (category === '' && values.category === 'Other') {
        message.error('Please enter a custom category!');
        setLoading(false);
        return;
      }

      console.log({ ...values, username, category, budget: values.budget });

      await axios.post(
        'http://localhost:5000/api/expenses/submit',
        { ...values, username, category, budget: values.budget }, // <-- send username
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Expense submitted successfully');
      form.resetFields();
      setCustomCategory('');
      setIsCustomCategory(false);
      checkBudgetAlert(values.budget, values.amount);
    } catch (error) {
      message.error('Failed to submit expense: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value) => {
    form.setFieldsValue({ category: value });
    setIsCustomCategory(value === 'Other');
    if (value !== 'Other') {
      setCustomCategory('');
    }
  };

  const checkBudgetAlert = (budget, amount) => {
    if (budget && amount) {
      const totalExpenses = form.getFieldValue('totalExpenses') || 0;
      const newTotal = totalExpenses + amount;
      if (newTotal >= budget * 0.8) {
        message.warning(`Warning: You’ve used ${((newTotal / budget) * 100).toFixed(1)}% of your budget!`);
      }
    }
  };

  return (
    <motion.div
      className="expense-form-container"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="expense-form-card">
        <h2 style={{ color: '#1890ff', fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>Submit Expense</h2>
        <Form
          form={form}
          name="expenseForm"
          onFinish={onFinish}
          layout="vertical"
          initialValues={{ date: dayjs() }}
          onValuesChange={(changedValues) => {
            if (changedValues.category) {
              handleCategoryChange(changedValues.category);
            }
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="amount"
                label={<span style={{ fontWeight: 'bold', color: '#333' }}>Amount</span>}
                rules={[{ required: true, message: 'Please input the amount!' }]}
              >
                <Input placeholder="Enter amount" type="number" className="custom-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="currency"
                label={<span style={{ fontWeight: 'bold', color: '#333' }}>Currency</span>}
                rules={[{ required: true, message: 'Please select currency!' }]}
              >
                <Select placeholder="Select currency" className="custom-input">
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                  <Option value="GBP">GBP</Option>
                  <Option value="JPY">JPY</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="category"
                label={<span style={{ fontWeight: 'bold', color: '#333' }}>Category</span>}
                rules={[{ required: true, message: 'Please select or enter a category!' }]}
              >
                <Select
                  placeholder="Select category"
                  allowClear
                  onChange={handleCategoryChange}
                  className="custom-input"
                >
                  <Option value="Travel">Travel</Option>
                  <Option value="Accommodation">Accommodation</Option>
                  <Option value="Meals">Meals</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
              {isCustomCategory && (
                <Form.Item
                  name="customCategory"
                  label={<span style={{ fontWeight: 'bold', color: '#333' }}>Enter Custom Category</span>}
                  rules={[{ required: true, message: 'Please enter a custom category!' }]}
                >
                  <Input
                    placeholder="e.g., Shopping, Gasoline"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="custom-input"
                  />
                </Form.Item>
              )}
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="budget"
                label={<span style={{ fontWeight: 'bold', color: '#333' }}>Monthly Budget</span>}
                rules={[{ required: true, message: 'Please set a monthly budget!' }]}
              >
                <Input placeholder="Enter monthly budget" type="number" className="custom-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="date"
                label={<span style={{ fontWeight: 'bold', color: '#333' }}>Date</span>}
                rules={[{ required: true, message: 'Please select date!' }]}
              >
                <DatePicker style={{ width: '100%' }} className="custom-input" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="description"
                label={<span style={{ fontWeight: 'bold', color: '#333' }}>Description</span>}
              >
                <Input.TextArea placeholder="Enter description" className="custom-input" />
              </Form.Item>
            </Col>
            <Col span={24} style={{ textAlign: 'center' }}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusOutlined />}
                  loading={loading}
                  className="submit-button"
                >
                  Submit
                </Button>
                <Button
                  type="default"
                  style={{ marginLeft: '10px' }}
                  onClick={() => form.resetFields()}
                  className="reset-button"
                >
                  Reset
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </motion.div>
  );
};

export default ExpenseForm;