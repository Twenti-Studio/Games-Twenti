import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  getPaymentSettings: () => api.get('/public/payment-settings'),
  getCheckoutUrl: (data) => api.post('/public/checkout-url', data),
  createOrder: (data) => api.post('/orders', data),
  validatePromoCode: (code, price) => api.post('/promo/validate', { code, price }),
  uploadPaymentProof: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/payment-proof', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
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
  patchCategory: (id, data) => api.patch(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  
  // Products
  getProducts: () => api.get('/products/admin'),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  patchProduct: (id, data) => api.patch(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Packages
  getPackages: (productId) => api.get(`/packages/product/${productId}/admin`),
  createPackage: (data) => api.post('/packages', data),
  updatePackage: (id, data) => api.put(`/packages/${id}`, data),
  patchPackage: (id, data) => api.patch(`/packages/${id}`, data),
  deletePackage: (id) => api.delete(`/packages/${id}`),
  
  // Orders
  getOrders: () => api.get('/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  patchOrder: (id, data) => api.patch(`/orders/${id}`, data),
  
  // Promo Codes
  getPromoCodes: () => api.get('/promo'),
  getPromoCode: (id) => api.get(`/promo/${id}`),
  createPromoCode: (data) => api.post('/promo', data),
  updatePromoCode: (id, data) => api.put(`/promo/${id}`, data),
  patchPromoCode: (id, data) => api.patch(`/promo/${id}`, data),
  deletePromoCode: (id) => api.delete(`/promo/${id}`),
  
  // Settings
  getSettings: () => api.get('/settings'),
  updateSetting: (key, value) => api.put(`/settings/${key}`, { value }),
  
  // Upload
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteImage: (filename) => api.delete(`/upload/image/${filename}`),
};

// Helper to get changed fields only (for PATCH requests)
export const getChangedFields = (original, current) => {
  const changes = {};
  for (const key in current) {
    if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
      changes[key] = current[key];
    }
  }
  return changes;
};

// Helper to get full image URL
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${path}`;
};

export default api;
