import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Select, DatePicker, message } from 'antd';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, CategoryScale, BarElement, Tooltip, Legend, Title } from 'chart.js';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import './Reports.css';

// Register Chart.js components
ChartJS.register(LinearScale, CategoryScale, BarElement, Tooltip, Legend, Title);

const styles = StyleSheet.create({
  page: { padding: 30 },
  section: { marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

const PdfDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Expense Report - {new Date().toLocaleDateString()}</Text>
        {data.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text>Category: {item._id}</Text>
            <Text>Total Amount: {item.totalAmount}</Text>
            <Text>Converted Total: {item.convertedTotal}</Text>
            <Text>Status: {item.status}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', dateRange: null });
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.dateRange) {
          params.startDate = filters.dateRange[0]?.format('YYYY-MM-DD');
          params.endDate = filters.dateRange[1]?.format('YYYY-MM-DD');
        }
        const response = await axios.get('http://localhost:5000/api/expenses/report', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params,
        });
        setReportData(response.data);
      } catch (error) {
        message.error('Failed to fetch reports: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [filters]); // Only depends on filters

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  const handleExportPDF = () => {
    if (reportData.length === 0) {
      message.warning('No data to export');
      return;
    }
    import('@react-pdf/renderer').then((module) => {
      const { pdf } = module;
      pdf(<PdfDocument data={reportData} />).toBlob().then((blob) => {
        saveAs(blob, `expense_report_${new Date().toISOString().split('T')[0]}.pdf`);
        message.success('PDF exported successfully');
      });
    }).catch((error) => {
      message.error('Failed to export PDF: ' + error.message);
    });
  };

  const handleFilterChange = (value, field) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const chartData = {
    labels: reportData.map(item => item._id || 'Unknown'),
    datasets: [
      {
        label: 'Total Converted Amount (USD)',
        data: reportData.map(item => item.convertedTotal || 0),
        backgroundColor: reportData.map((_, index) => `rgba(24, 144, 255, ${0.6 - index * 0.1})`),
        borderColor: reportData.map((_, index) => `rgba(24, 144, 255, ${1 - index * 0.1})`),
        borderWidth: 1,
        borderRadius: 5,
        barThickness: 30,
      },
      {
        label: 'Total Amount (Original)',
        data: reportData.map(item => item.totalAmount || 0),
        backgroundColor: reportData.map((_, index) => `rgba(255, 99, 132, ${0.6 - index * 0.1})`),
        borderColor: reportData.map((_, index) => `rgba(255, 99, 132, ${1 - index * 0.1})`),
        borderWidth: 1,
        borderRadius: 5,
        barThickness: 30,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad',
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Amount (USD)', font: { size: 14 } },
        type: 'linear',
        ticks: { font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
      },
      x: {
        type: 'category',
        title: { display: true, text: 'Categories', font: { size: 14 } },
        ticks: { font: { size: 12 } },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      title: { display: true, text: 'Expense Summary by Category', font: { size: 16 } },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
  };

  return (
    <div className="reports-container">
      <h2 style={{ color: '#1890ff', fontSize: '24px', marginBottom: '20px' }}>Reports</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <Select
          placeholder="Filter by Status"
          onChange={(value) => handleFilterChange(value, 'status')}
          style={{ width: 200 }}
          allowClear
        >
          <Select.Option value="Pending">Pending</Select.Option>
          <Select.Option value="Approved">Approved</Select.Option>
          <Select.Option value="Rejected">Rejected</Select.Option>
        </Select>
        <DatePicker.RangePicker
          onChange={(dates) => handleFilterChange(dates, 'dateRange')}
          style={{ width: 300 }}
        />
        <Button type="primary" onClick={handleExportPDF}>Export PDF</Button>
      </div>
      <div style={{ height: '500px', marginBottom: '20px', position: 'relative' }}>
        {reportData.length > 0 ? (
          <Bar
            data={chartData}
            options={chartOptions}
            ref={chartRef}
          />
        ) : (
          <div style={{ textAlign: 'center', paddingTop: '50px' }}>No data available for chart</div>
        )}
      </div>
      <Table
        columns={[
          { title: 'Category', dataIndex: '_id', key: '_id', sorter: (a, b) => a._id.localeCompare(b._id) },
          { title: 'Total Amount', dataIndex: 'totalAmount', key: 'totalAmount', sorter: (a, b) => a.totalAmount - b.totalAmount },
          { title: 'Converted Total', dataIndex: 'convertedTotal', key: 'convertedTotal', sorter: (a, b) => a.convertedTotal - b.convertedTotal },
          { title: 'Status', dataIndex: 'status', key: 'status', filters: [
            { text: 'Pending', value: 'Pending' },
            { text: 'Approved', value: 'Approved' },
            { text: 'Rejected', value: 'Rejected' },
          ], onFilter: (value, record) => record.status === value },
        ]}
        dataSource={reportData}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 5 }}
        onChange={(pagination, filters, sorter) => {
          console.log('Table sorted/filtered:', { filters, sorter });
        }}
      />
    </div>
  );
};

export default Reports;