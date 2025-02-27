import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AuthPage from './components/Auth/AuthPage';
import RoomList from './components/Room/RoomList';
import RoomPage from './components/Room/RoomPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  // Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      useAuthStore.setState({
        user: JSON.parse(storedUser),
        token: storedToken,
        isAuthenticated: true,
      });
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/rooms" /> : <AuthPage />} />
        <Route path="/rooms" element={isAuthenticated ? <RoomList /> : <Navigate to="/" />} />
        <Route path="/room/:roomId" element={isAuthenticated ? <RoomPage /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;