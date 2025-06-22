import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './Components/Login';
import Dashboard from './Components/Dashboard';
import Approval from './Components/Approval';
import MyExpenses from './Components/MyExpenses'; // Import MyExpenses
import Reports from './Components/Reports'; // Import Reports
import ExpenseAnalytics from './Components/ExpenseAnalytics'; // Import ExpenseAnalytics

const AppContent = () => {
  const { auth } = useAuth();
  // console.log('AppContent auth:', auth);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={auth.token ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/approval"
        element={auth.token && auth.role === 'manager' ? <Approval /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/my-expenses"
        element={auth.token ? <MyExpenses /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/reports"
        element={auth.token ? <Reports /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/analytics"
        element={auth.token ? <ExpenseAnalytics /> : <Navigate to="/login" replace />}
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppContent;