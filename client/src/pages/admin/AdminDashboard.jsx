import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

function AdminDashboard() {
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    orders: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [categoriesRes, productsRes, ordersRes] = await Promise.all([
        adminAPI.getCategories(),
        adminAPI.getProducts(),
        adminAPI.getOrders()
      ]);

      const categories = categoriesRes.data;
      const products = productsRes.data;
      const orders = ordersRes.data;

      setStats({
        categories: categories.length,
        products: products.length,
        orders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      processing: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card card-hover bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Categories</p>
                <p className="text-3xl font-bold">{stats.categories}</p>
              </div>
              <div className="text-4xl opacity-80">📁</div>
            </div>
            <Link to="/admin/categories" className="mt-4 inline-block text-blue-100 hover:text-white text-sm font-medium">
              Manage →
            </Link>
          </div>

          <div className="card card-hover bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Products</p>
                <p className="text-3xl font-bold">{stats.products}</p>
              </div>
              <div className="text-4xl opacity-80">📦</div>
            </div>
            <Link to="/admin/products" className="mt-4 inline-block text-purple-100 hover:text-white text-sm font-medium">
              Manage →
            </Link>
          </div>

          <div className="card card-hover bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Total Orders</p>
                <p className="text-3xl font-bold">{stats.orders}</p>
              </div>
              <div className="text-4xl opacity-80">📋</div>
            </div>
            <Link to="/admin/orders" className="mt-4 inline-block text-green-100 hover:text-white text-sm font-medium">
              View →
            </Link>
          </div>

          <div className="card card-hover bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium mb-1">Pending Orders</p>
                <p className="text-3xl font-bold">{stats.pendingOrders}</p>
              </div>
              <div className="text-4xl opacity-80">⏳</div>
            </div>
            <Link to="/admin/orders" className="mt-4 inline-block text-yellow-100 hover:text-white text-sm font-medium">
              View →
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link to="/admin/orders" className="btn btn-secondary text-sm">
              View All
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Package</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">#{order.id}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{order.product_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{order.package_name}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">Rp {order.price.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">No orders yet.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/admin/categories" className="btn btn-primary">
              Add Category
            </Link>
            <Link to="/admin/products" className="btn btn-primary">
              Add Product
            </Link>
            <Link to="/admin/settings" className="btn btn-secondary">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
