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

// Users
export const getUser = (id) => api.get(`/users/${id}`);
export const getAllUsers = () => api.get('/users');
export const setDriverFree = (id) => api.put(`/drivers/${id}/free`);
export const setDriverBusy = (id) => api.put(`/drivers/${id}/busy`);

// Bookings
export const createBooking = (data) => api.post('/bookings', data);
export const getBookings = () => api.get('/bookings');
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const acceptBooking = (id) => api.put(`/bookings/${id}/nhan`);
export const startTrip = (id) => api.put(`/bookings/${id}/bat-dau`);
export const updateDriverLocation = (id, data) => api.put(`/bookings/${id}/vi-tri`, data);
export const completeBooking = (id) => api.put(`/bookings/${id}/hoan-thanh`);
export const cancelBooking = (id) => api.put(`/bookings/${id}/huy`);

// Payments
export const createPayment = (data) => api.post('/payments', data);
export const getPayment = (bookingId) => api.get(`/payments/${bookingId}`);

export default api;
