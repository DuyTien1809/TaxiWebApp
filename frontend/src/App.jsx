import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CreateBooking from './pages/customer/CreateBooking';
import MyTrips from './pages/customer/MyTrips';
import DriverDashboard from './pages/driver/DriverDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ user, roles, children }) {
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float shadow-xl">
            <span className="text-4xl">🚕</span>
          </div>
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" /> : <Login setUser={setUser} />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/" /> : <Register setUser={setUser} />
        } />
        
        <Route path="/customer/booking" element={
          <ProtectedRoute user={user} roles={['CUSTOMER']}>
            <CreateBooking />
          </ProtectedRoute>
        } />
        <Route path="/customer/trips" element={
          <ProtectedRoute user={user} roles={['CUSTOMER']}>
            <MyTrips />
          </ProtectedRoute>
        } />
        
        <Route path="/driver" element={
          <ProtectedRoute user={user} roles={['DRIVER']}>
            <DriverDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute user={user} roles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute user={user}>
            <Profile user={user} setUser={setUser} />
          </ProtectedRoute>
        } />

        <Route path="/" element={
          user ? (
            user.role === 'CUSTOMER' ? <Navigate to="/customer/booking" /> :
            user.role === 'DRIVER' ? <Navigate to="/driver" /> :
            <Navigate to="/admin" />
          ) : <Navigate to="/login" />
        } />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
