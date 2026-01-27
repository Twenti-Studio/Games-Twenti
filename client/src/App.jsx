import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import DigitalProductCatalog from './pages/DigitalProductCatalog';
import DigitalProductDetail from './pages/DigitalProductDetail';
import Home from './pages/Home';
import ProductCatalog from './pages/ProductCatalog';
import ProductDetail from './pages/ProductDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import CategoryManagement from './pages/admin/CategoryManagement';
import DigitalProductManagement from './pages/admin/DigitalProductManagement';
import OrderHistory from './pages/admin/OrderHistory';
import PackageManagement from './pages/admin/PackageManagement';
import ProductManagement from './pages/admin/ProductManagement';
import PromoManagement from './pages/admin/PromoManagement';
import Settings from './pages/admin/Settings';
import { authAPI } from './utils/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authAPI.me();
      setIsAuthenticated(response.data.authenticated);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const PrivateRoute = ({ children }) => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }
    return isAuthenticated ? children : <Navigate to="/admin/login" />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <>
              <Navbar />
              <Home />
              <Footer />
            </>
          } />
          <Route path="/products" element={
            <>
              <Navbar />
              <ProductCatalog />
              <Footer />
            </>
          } />
          <Route path="/products/:id" element={
            <>
              <Navbar />
              <ProductDetail />
              <Footer />
            </>
          } />
          <Route path="/category/:categoryId" element={
            <>
              <Navbar />
              <ProductCatalog />
              <Footer />
            </>
          } />

          {/* Digital Products Routes */}
          <Route path="/digital" element={
            <>
              <Navbar />
              <DigitalProductCatalog />
              <Footer />
            </>
          } />
          <Route path="/digital/:id" element={
            <>
              <Navbar />
              <DigitalProductDetail />
              <Footer />
            </>
          } />

          {/* Admin Routes */}
          <Route path="/admin/login" element={
            isAuthenticated ? <Navigate to="/admin/dashboard" /> : <AdminLogin onLogin={handleLogin} />
          } />
          <Route path="/admin/dashboard" element={
            <PrivateRoute>
              <>
                <Navbar isAdmin={true} onLogout={handleLogout} />
                <AdminDashboard />
              </>
            </PrivateRoute>
          } />
          <Route path="/admin/categories" element={
            <PrivateRoute>
              <>
                <Navbar isAdmin={true} onLogout={handleLogout} />
                <CategoryManagement />
              </>
            </PrivateRoute>
          } />
          <Route path="/admin/products" element={
            <PrivateRoute>
              <>
                <Navbar isAdmin={true} onLogout={handleLogout} />
                <ProductManagement />
              </>
            </PrivateRoute>
          } />
          <Route path="/admin/digital-products" element={
            <PrivateRoute>
              <>
                <Navbar isAdmin={true} onLogout={handleLogout} />
                <DigitalProductManagement />
              </>
            </PrivateRoute>
          } />
          <Route path="/admin/products/:productId/packages" element={
            <PrivateRoute>
              <>
                <Navbar isAdmin={true} onLogout={handleLogout} />
                <PackageManagement />
              </>
            </PrivateRoute>
          } />
          <Route path="/admin/orders" element={
            <PrivateRoute>
              <>
                <Navbar isAdmin={true} onLogout={handleLogout} />
                <OrderHistory />
              </>
            </PrivateRoute>
          } />
          <Route path="/admin/promo" element={
            <PrivateRoute>
              <>
                <Navbar isAdmin={true} onLogout={handleLogout} />
                <PromoManagement />
              </>
            </PrivateRoute>
          } />
          <Route path="/admin/settings" element={
            <PrivateRoute>
              <>
                <Navbar isAdmin={true} onLogout={handleLogout} />
                <Settings />
              </>
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
