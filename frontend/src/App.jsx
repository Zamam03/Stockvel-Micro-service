import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';
import './App.css';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-container loading-page">
        <div className="loading-spinner">
          <p>Loading Stockvel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        <Route 
          path="/login" 
          element={!currentUser ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!currentUser ? <Register /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/dashboard" 
          element={currentUser ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/group/:groupId" 
          element={currentUser ? <GroupDetail /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} 
        />
        <Route 
          path="*" 
          element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </div>
  );
}

export default App;
