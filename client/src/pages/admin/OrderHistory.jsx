import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminAPI, getImageUrl } from '../../utils/api';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await adminAPI.getOrders();
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'badge-success',
      processing: 'badge-info',
      cancelled: 'badge-danger',
      pending: 'badge-warning'
    };
    return badges[status] || 'badge-info';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Order History</h1>

        <div className="card">
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
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
                        {new Date(order.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          className="btn btn-secondary text-sm py-1.5 px-3"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500 dark:text-gray-400">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setSelectedOrder(null)}
          >
            <div 
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Order Details #{selectedOrder.id}
                </h2>
                <button 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
                  onClick={() => setSelectedOrder(null)}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Product</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.product_name}</p>
                </div>
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Category</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.category_name}</p>
                </div>
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Package</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.package_name}</p>
                </div>
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price</p>
                  <p className="font-medium text-gray-900 dark:text-white">Rp {selectedOrder.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                  <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Order Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(selectedOrder.created_at).toLocaleString('id-ID')}
                  </p>
                </div>

                {selectedOrder.user_data && Object.keys(selectedOrder.user_data).length > 0 && (
                  <div className="pt-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">User Data</p>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                      {Object.entries(selectedOrder.user_data).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[150px]">{key}:</span>
                          <span className="text-gray-900 dark:text-gray-100">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Proof */}
                {selectedOrder.payment_proof && (
                  <div className="pt-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment Proof</p>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <img 
                        src={getImageUrl(selectedOrder.payment_proof)} 
                        alt="Payment Proof"
                        className="max-w-full max-h-64 rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      <a 
                        href={getImageUrl(selectedOrder.payment_proof)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-3 text-sm text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        Open in new tab
                      </a>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`btn text-sm py-2 px-4 ${selectedOrder.status === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(selectedOrder.id, 'pending')}
                    >
                      Pending
                    </button>
                    <button
                      className={`btn text-sm py-2 px-4 ${selectedOrder.status === 'processing' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(selectedOrder.id, 'processing')}
                    >
                      Processing
                    </button>
                    <button
                      className={`btn text-sm py-2 px-4 ${selectedOrder.status === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(selectedOrder.id, 'completed')}
                    >
                      Completed
                    </button>
                    <button
                      className={`btn text-sm py-2 px-4 ${selectedOrder.status === 'cancelled' ? 'btn-primary' : 'btn-danger'}`}
                      onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;
