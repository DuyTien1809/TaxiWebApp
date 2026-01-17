import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// OTP
export const sendRegisterOTP = (phone) => api.post('/otp/register/send', { phone });
export const verifyRegisterOTP = (data) => api.post('/otp/register/verify', data);
export const sendForgotPasswordOTP = (phone) => api.post('/otp/forgot-password/send', { phone });
export const verifyForgotPasswordOTP = (phone, code) => api.post('/otp/forgot-password/verify', { phone, code });
export const resetPassword = (resetToken, newPassword) => api.post('/otp/reset-password', { resetToken, newPassword });

// Users
export const getUser = (id) => api.get(`/users/${id}`);
export const getAllUsers = () => api.get('/users');
export const setDriverFree = (id) => api.put(`/drivers/${id}/free`);
export const setDriverBusy = (id) => api.put(`/drivers/${id}/busy`);
export const updateDriverLocation = (data) => api.put('/users/location', data);
export const getDriverLocation = () => api.get('/users/location');

// Bookings
export const createBooking = (data) => api.post('/bookings', data);
export const getBookings = () => api.get('/bookings');
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const acceptBooking = (id) => api.put(`/bookings/${id}/nhan`);
export const startTrip = (id) => api.put(`/bookings/${id}/bat-dau`);
export const updateBookingDriverLocation = (id, data) => api.put(`/bookings/${id}/vi-tri`, data);
export const completeBooking = (id) => api.put(`/bookings/${id}/hoan-thanh`);
export const cancelBooking = (id) => api.put(`/bookings/${id}/huy`);
export const rejectBooking = (id, reason) => api.put(`/bookings/${id}/tu-choi`, { reason });

// Payments
export const createPayment = (data) => api.post('/payments', data);
export const getPayment = (bookingId) => api.get(`/payments/${bookingId}`);

// Wallet
export const getWallet = () => api.get('/wallet');
export const linkBankAccount = (data) => api.post('/wallet/link-bank', data);
export const unlinkBankAccount = () => api.post('/wallet/unlink-bank');
export const topUpWallet = (data) => api.post('/wallet/top-up', data);
export const withdrawWallet = (data) => api.post('/wallet/withdraw', data);
export const getTransactions = () => api.get('/wallet/transactions');

// Driver Earnings
export const getEarningSummary = () => api.get('/driver-earnings/summary');
export const getCompletedTrips = () => api.get('/driver-earnings/trips');
export const addTip = (data) => api.post('/driver-earnings/tip', data);

// Admin
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = () => api.get('/admin/users');
export const getAdminBookings = () => api.get('/admin/bookings');
export const getAdminDrivers = () => api.get('/admin/drivers');
export const getDriverDetail = (driverId) => api.get(`/admin/drivers/${driverId}`);
export const updateDriverStatus = (driverId, status) => api.put(`/admin/drivers/${driverId}/status`, { status });
export const lockDriver = (driverId, reason) => api.put(`/admin/drivers/${driverId}/lock`, { reason });
export const unlockDriver = (driverId) => api.put(`/admin/drivers/${driverId}/unlock`);
export const getServiceQualityStats = () => api.get('/admin/service-quality');

// Ratings
export const createRating = (data) => api.post('/ratings', data);
export const getPendingRatingsCount = () => api.get('/ratings/pending-count');
export const getUserRatings = (userId, type) => api.get(`/ratings/user/${userId}`, { params: { type } });
export const getBookingRatings = (bookingId) => api.get(`/ratings/booking/${bookingId}`);

// Driver Onboarding
export const agreeToRules = () => api.post('/users/driver/agree-rules');
export const updateDriverProfile = (data) => api.put('/users/driver/profile', data);
export const getDriverProfile = () => api.get('/users/driver/profile');

// Admin - Pending Drivers
export const getPendingDrivers = () => api.get('/admin/pending-drivers');
export const getPendingDriverDetail = (driverId) => api.get(`/admin/pending-drivers/${driverId}`);
export const approveDriver = (driverId) => api.put(`/admin/pending-drivers/${driverId}/approve`);
export const rejectDriver = (driverId, reason) => api.put(`/admin/pending-drivers/${driverId}/reject`, { reason });

// Price Config
export const getCurrentPrice = () => api.get('/price-config/current');
export const calculatePrice = (distance) => api.post('/price-config/calculate', { distance });
export const getAllPriceConfigs = () => api.get('/price-config');
export const getPriceByMonth = (year, month) => api.get(`/price-config/${year}/${month}`);
export const createOrUpdatePrice = (data) => api.post('/price-config', data);
export const deletePriceConfig = (id) => api.delete(`/price-config/${id}`);

// Notifications
export const getNotifications = (params) => api.get('/notifications', { params });
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllAsRead = () => api.put('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
export const deleteAllRead = () => api.delete('/notifications/read/all');

export default api;
