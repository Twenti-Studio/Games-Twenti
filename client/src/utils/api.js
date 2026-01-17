import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public API
export const publicAPI = {
  getHomepage: () => api.get('/public/homepage'),
  getCategories: () => api.get('/categories'),
  getCategory: (id) => api.get(`/categories/${id}`),
  getProducts: () => api.get('/products'),
  getProductsByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
  getProduct: (id) => api.get(`/products/${id}`),
  getPackages: (productId) => api.get(`/packages/product/${productId}`),
  getCheckoutUrl: (data) => api.post('/public/checkout-url', data),
  createOrder: (data) => api.post('/orders', data),
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Admin API
export const adminAPI = {
  // Categories
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  
  // Products
  getProducts: () => api.get('/products/admin'),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Packages
  getPackages: (productId) => api.get(`/packages/product/${productId}/admin`),
  createPackage: (data) => api.post('/packages', data),
  updatePackage: (id, data) => api.put(`/packages/${id}`, data),
  deletePackage: (id) => api.delete(`/packages/${id}`),
  
  // Orders
  getOrders: () => api.get('/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  
  // Settings
  getSettings: () => api.get('/settings'),
  updateSetting: (key, value) => api.put(`/settings/${key}`, { value }),
};

export default api;
