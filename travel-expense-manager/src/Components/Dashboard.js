import React, { useState, useEffect } from 'react';
import { Layout, Menu, message, Progress, Table, Input, Button, Divider, DatePicker, Select } from 'antd';
import { PlusOutlined, UserOutlined, FileTextOutlined, LogoutOutlined, TeamOutlined, CalculatorOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ExpenseForm from './ExpenseForm';
import Approval from './Approval';
import MyExpenses from './MyExpenses';
import Reports from './Reports';
import ExpenseAnalytics from './ExpenseAnalytics';
import axios from 'axios';
import './Dashboard.css';
import moment from 'moment';

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = () => {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [current, setCurrent] = useState('submit');
  const [budgetData, setBudgetData] = useState({ totalExpenses: 0, budget: 0, categories: [] });

  // State for Group Expense Splitting
  const [companions, setCompanions] = useState([]);
  const [companionName, setCompanionName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [splitResults, setSplitResults] = useState([]);
  const [splitType, setSplitType] = useState('even'); // 'even' or 'percentage'

  // State for Trip Planner
  const [tripDetails, setTripDetails] = useState({
    destination: '',
    dates: null,
    travelers: 1,
    category: 'all',
  });
  const [estimatedExpenses, setEstimatedExpenses] = useState([]);
  const [totalEstimatedCost, setTotalEstimatedCost] = useState(0);

  useEffect(() => {
    const pathToKey = {
      '/dashboard': 'submit',
      '/my-expenses': 'myExpenses',
      '/approval': 'approval',
      '/reports': 'reports',
      '/analytics': 'analytics',
    };
    const key = pathToKey[location.pathname] || 'submit';
    setCurrent(key);
    fetchBudgetData(); // Fetch real data on mount
  }, [location.pathname]);

  const fetchBudgetData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/expenses/analytics/monthly', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { totalExpenses, budget, categories } = response.data;
      setBudgetData({ totalExpenses, budget, categories });
    } catch (error) {
      console.error('Error fetching budget data:', error);
      message.error('Failed to fetch budget data. Using mock data.');
      setBudgetData({ totalExpenses: 500, budget: 1000, categories: [] });
    }
  };

  const handleExpenseSubmit = () => {
    fetchBudgetData(); // Refresh budget summary
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAuth({ token: null, role: null });
    message.success('Logged out successfully');
    navigate('/login');
  };

  const items = [
    { key: 'submit', icon: <PlusOutlined />, label: 'Submit Expense', onClick: () => { setCurrent('submit'); } },
    { key: 'myExpenses', icon: <UserOutlined />, label: 'My Expenses', onClick: () => { setCurrent('myExpenses'); } },
    ...(auth.role === 'manager' ? [{ key: 'approval', icon: <UserOutlined />, label: 'Approvals', onClick: () => { setCurrent('approval'); } }] : []),
    { key: 'reports', icon: <FileTextOutlined />, label: 'Reports', onClick: () => { setCurrent('reports'); } },
    { key: 'analytics', icon: <FileTextOutlined />, label: 'Analytics', onClick: () => { setCurrent('analytics'); } },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout },
  ];

  const renderContent = () => {
    switch (current) {
      case 'submit':
        return <ExpenseForm onSubmit={handleExpenseSubmit} />;
      case 'myExpenses':
        return <MyExpenses />;
      case 'approval':
        return <Approval />;
      case 'reports':
        return <Reports />;
      case 'analytics':
        return <ExpenseAnalytics />;
      default:
        return <div>Select a section to view content.</div>;
    }
  };

  const remainingBudget = budgetData.budget - budgetData.totalExpenses;
  const percentUsed = budgetData.budget ? (budgetData.totalExpenses / budgetData.budget) * 100 : 0;
  const progressStatus = percentUsed > 100 ? 'exception' : 'active';

  // Define columns for the category-wise breakdown table
  const categoryColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Expenses ($)',
      dataIndex: 'expenses',
      key: 'expenses',
      render: (value) => value.toFixed(2),
    },
    {
      title: 'Budget ($)',
      dataIndex: 'budget',
      key: 'budget',
      render: (value) => value.toFixed(2),
    },
    {
      title: 'Remaining ($)',
      key: 'remaining',
      render: (record) => (record.budget - record.expenses).toFixed(2),
    },
    {
      title: 'Usage (%)',
      key: 'usage',
      render: (record) => record.budget ? ((record.expenses / record.budget) * 100).toFixed(2) : '0.00',
    },
  ];

  // Group Expense Splitting Logic
  const addCompanion = () => {
    if (!companionName) {
      message.error('Please enter a companion name');
      return;
    }
    const newCompanion = {
      name: companionName,
      percentage: splitType === 'percentage' && percentage ? parseFloat(percentage) : 0,
    };
    setCompanions([...companions, newCompanion]);
    setCompanionName('');
    setPercentage('');
    message.success(`${newCompanion.name} added to the group`);
  };

  const splitExpenses = () => {
    if (companions.length === 0) {
      message.error('Please add at least one companion');
      return;
    }

    const totalExpenses = budgetData.totalExpenses;
    const totalPeople = companions.length + 1; // Including the user
    let results = [];

    if (splitType === 'even') {
      const evenShare = totalExpenses / totalPeople;
      results = [
        { name: 'You', share: evenShare.toFixed(2) },
        ...companions.map(comp => ({
          name: comp.name,
          share: evenShare.toFixed(2),
        })),
      ];
    } else {
      const totalPercentage = companions.reduce((sum, comp) => sum + comp.percentage, 0);
      const userPercentage = 100 - totalPercentage;

      if (totalPercentage > 100) {
        message.error('Total percentage exceeds 100%');
        return;
      }

      results = [
        { name: 'You', share: ((totalExpenses * userPercentage) / 100).toFixed(2) },
        ...companions.map(comp => ({
          name: comp.name,
          share: ((totalExpenses * comp.percentage) / 100).toFixed(2),
        })),
      ];
    }

    setSplitResults(results);
  };

  const splitColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Share ($)',
      dataIndex: 'share',
      key: 'share',
    },
  ];

  // Trip Planner Logic
  const handleTripInputChange = (field, value) => {
    setTripDetails({ ...tripDetails, [field]: value });
  };

  const estimateTripExpenses = () => {
    const { destination, dates, travelers, category } = tripDetails;

    // Validate inputs
    if (!destination || !dates || !travelers) {
      message.error('Please fill in all trip details');
      return;
    }

    const [startDate, endDate] = dates;
    const tripDays = moment(endDate).diff(moment(startDate), 'days') + 1; // Include both start and end dates
    if (tripDays <= 0) {
      message.error('End date must be after start date');
      return;
    }

    // Calculate average daily expense per category from historical data
    const categoriesToEstimate = category === 'all' ? budgetData.categories : budgetData.categories.filter(cat => cat.category === category);
    if (categoriesToEstimate.length === 0) {
      message.error('No historical data available for estimation');
      return;
    }

    // Assume historical data covers 30 days (1 month) for simplicity
    const historicalDays = 30;
    const estimates = categoriesToEstimate.map(cat => {
      const avgDailyCost = cat.expenses / historicalDays; // Average daily cost per category
      const estimatedCost = avgDailyCost * tripDays * travelers; // Cost for the trip duration and number of travelers
      return {
        category: cat.category,
        avgDailyCost: avgDailyCost.toFixed(2),
        estimatedCost: estimatedCost.toFixed(2),
      };
    });

    const totalCost = estimates.reduce((sum, est) => sum + parseFloat(est.estimatedCost), 0);
    setEstimatedExpenses(estimates);
    setTotalEstimatedCost(totalCost);
  };

  // Table columns for estimated expenses
  const estimateColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Avg. Daily Cost ($)',
      dataIndex: 'avgDailyCost',
      key: 'avgDailyCost',
    },
    {
      title: 'Estimated Cost ($)',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, #1890ff, #40a9ff)', padding: '0 20px' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Travel Expense Tracker</div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[current]}
          items={items}
          style={{ background: 'transparent', color: 'white', flex: 1, justifyContent: 'flex-end' }}
        />
      </Header>
      <Content style={{ padding: '20px', background: '#f0f2f5' }}>
        {renderContent()}
        <div className="budget-summary" style={{ marginTop: '20px', padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ color: '#1890ff', marginBottom: '12px' }}>Budget Summary</h3>
          <p>Total Expenses: $<span style={{ fontWeight: 'bold' }}>{budgetData.totalExpenses.toFixed(2)}</span></p>
          <p>Monthly Budget: $<span style={{ fontWeight: 'bold' }}>{budgetData.budget.toFixed(2)}</span></p>
          <p>Remaining Budget: $<span style={{ fontWeight: 'bold', color: remainingBudget < 0 ? '#ff4d4f' : '#52c41a' }}>{remainingBudget.toFixed(2)}</span></p>
          <Progress percent={parseFloat(percentUsed.toFixed(2))} status={progressStatus} style={{ marginTop: '12px' }} />
        </div>
        <div className="category-breakdown" style={{ marginTop: '20px', padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ color: '#1890ff', marginBottom: '12px' }}>Category-wise Breakdown</h3>
          <Table
            columns={categoryColumns}
            dataSource={budgetData.categories}
            rowKey="category"
            pagination={false}
            style={{ marginTop: '12px' }}
          />
        </div>
        {/* Group Expense Splitting Section */}
        <div className="group-expense-splitting" style={{ marginTop: '20px', padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <Divider orientation="left" style={{ color: '#1890ff', fontWeight: 'bold' }}>
            <TeamOutlined /> Group Expense Splitting
          </Divider>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
            <Input
              placeholder="Companion Name"
              value={companionName}
              onChange={(e) => setCompanionName(e.target.value)}
              style={{ width: '200px', borderRadius: '6px' }}
            />
            {splitType === 'percentage' && (
              <Input
                placeholder="Percentage (%)"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                type="number"
                style={{ width: '120px', borderRadius: '6px' }}
              />
            )}
            <Button
              type="primary"
              onClick={addCompanion}
              style={{ borderRadius: '6px', background: '#1890ff', borderColor: '#1890ff' }}
            >
              Add Companion
            </Button>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Button
              onClick={() => setSplitType('even')}
              style={{
                marginRight: '10px',
                background: splitType === 'even' ? '#1890ff' : '#fff',
                color: splitType === 'even' ? '#fff' : '#1890ff',
                borderColor: '#1890ff',
                borderRadius: '6px',
              }}
            >
              Split Evenly
            </Button>
            <Button
              onClick={() => setSplitType('percentage')}
              style={{
                background: splitType === 'percentage' ? '#1890ff' : '#fff',
                color: splitType === 'percentage' ? '#fff' : '#1890ff',
                borderColor: '#1890ff',
                borderRadius: '6px',
              }}
            >
              Split by Percentage
            </Button>
          </div>
          {companions.length > 0 && (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '16px', color: '#555' }}>Travel Companions:</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {companions.map((comp, index) => (
                  <li key={index} style={{ color: '#333', margin: '5px 0' }}>
                    {comp.name} {splitType === 'percentage' && `(${comp.percentage}%)`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={splitExpenses}
              style={{ borderRadius: '6px', background: '#1890ff', borderColor: '#1890ff' }}
            >
              Calculate Split
            </Button>
          </div>
          {splitResults.length > 0 && (
            <Table
              dataSource={splitResults}
              columns={splitColumns}
              pagination={false}
              bordered
              style={{ background: '#fff', borderRadius: '6px' }}
              rowClassName={(record, index) =>
                index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
              }
            />
          )}
        </div>
        {/* Trip Planner Section */}
        <div className="trip-planner" style={{ marginTop: '20px', padding: '16px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <Divider orientation="left" style={{ color: '#1890ff', fontWeight: 'bold' }}>
            <CalendarOutlined /> Trip Planner
          </Divider>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Input
              placeholder="Destination"
              value={tripDetails.destination}
              onChange={(e) => handleTripInputChange('destination', e.target.value)}
              style={{ width: '200px', borderRadius: '6px' }}
            />
            <RangePicker
              value={tripDetails.dates}
              onChange={(dates) => handleTripInputChange('dates', dates)}
              style={{ borderRadius: '6px' }}
            />
            <Input
              placeholder="Number of Travelers"
              value={tripDetails.travelers}
              onChange={(e) => handleTripInputChange('travelers', parseInt(e.target.value) || 1)}
              type="number"
              min={1}
              style={{ width: '150px', borderRadius: '6px' }}
            />
            <Select
              value={tripDetails.category}
              onChange={(value) => handleTripInputChange('category', value)}
              style={{ width: '150px', borderRadius: '6px' }}
            >
              <Option value="all">All Categories</Option>
              {budgetData.categories.map(cat => (
                <Option key={cat.category} value={cat.category}>{cat.category}</Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={estimateTripExpenses}
              style={{ borderRadius: '6px', background: '#1890ff', borderColor: '#1890ff' }}
            >
              Estimate Expenses
            </Button>
          </div>
          {estimatedExpenses.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', color: '#555', textAlign: 'center' }}>
                Estimated Expenses for {tripDetails.destination} ({tripDetails.travelers} Traveler{tripDetails.travelers > 1 ? 's' : ''})
              </h3>
              <Table
                dataSource={estimatedExpenses}
                columns={estimateColumns}
                pagination={false}
                bordered
                style={{ background: '#fff', borderRadius: '6px', marginTop: '12px' }}
                rowClassName={(record, index) =>
                  index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
                }
              />
              <p style={{ textAlign: 'center', marginTop: '12px', fontWeight: 'bold', color: '#1890ff' }}>
                Total Estimated Cost: ${totalEstimatedCost.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;