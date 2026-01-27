import { Calendar, Percent, Tag, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { adminAPI, getChangedFields } from '../../utils/api';

function PromoManagement() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '',
    max_discount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    enabled: true
  });
  const [error, setError] = useState('');
  const originalDataRef = useRef(null);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const response = await adminAPI.getPromoCodes();
      setPromos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching promos:', error);
      setPromos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      const initialData = {
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        min_purchase: promo.min_purchase || '',
        max_discount: promo.max_discount || '',
        usage_limit: promo.usage_limit || '',
        start_date: promo.start_date ? new Date(promo.start_date).toISOString().split('T')[0] : '',
        end_date: promo.end_date ? new Date(promo.end_date).toISOString().split('T')[0] : '',
        enabled: promo.enabled
      };
      setFormData(initialData);
      originalDataRef.current = { ...initialData };
    } else {
      setEditingPromo(null);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase: '',
        max_discount: '',
        usage_limit: '',
        start_date: '',
        end_date: '',
        enabled: true
      });
      originalDataRef.current = null;
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPromo(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase: '',
      max_discount: '',
      usage_limit: '',
      start_date: '',
      end_date: '',
      enabled: true
    });
    setError('');
    originalDataRef.current = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.code || !formData.discount_value) {
      setError('Code and discount value are required');
      return;
    }

    const submitData = {
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : null,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      enabled: formData.enabled
    };

    try {
      if (editingPromo) {
        const originalData = {
          ...originalDataRef.current,
          code: originalDataRef.current.code.toUpperCase(),
          discount_value: parseFloat(originalDataRef.current.discount_value),
          min_purchase: originalDataRef.current.min_purchase ? parseFloat(originalDataRef.current.min_purchase) : null,
          max_discount: originalDataRef.current.max_discount ? parseFloat(originalDataRef.current.max_discount) : null,
          usage_limit: originalDataRef.current.usage_limit ? parseInt(originalDataRef.current.usage_limit) : null,
          start_date: originalDataRef.current.start_date || null,
          end_date: originalDataRef.current.end_date || null,
        };
        const changedFields = getChangedFields(originalData, submitData);
        
        if (Object.keys(changedFields).length === 0) {
          handleCloseModal();
          return;
        }
        
        await adminAPI.patchPromoCode(editingPromo.id, changedFields);
      } else {
        await adminAPI.createPromoCode(submitData);
      }
      handleCloseModal();
      fetchPromos();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save promo code');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) {
      return;
    }

    try {
      await adminAPI.deletePromoCode(id);
      fetchPromos();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete promo code');
    }
  };

  const handleToggleEnabled = async (promo) => {
    try {
      await adminAPI.patchPromoCode(promo.id, { enabled: !promo.enabled });
      fetchPromos();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update promo code');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isPromoActive = (promo) => {
    if (!promo.enabled) return false;
    const now = new Date();
    if (promo.start_date && now < new Date(promo.start_date)) return false;
    if (promo.end_date && now > new Date(promo.end_date)) return false;
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return false;
    return true;
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Promo Codes
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage discount codes and promotions
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              + Add Promo Code
            </button>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Discount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Min. Purchase</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Usage</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Period</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.length > 0 ? (
                  promos.map((promo) => (
                    <tr key={promo.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-primary-600" />
                          <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{promo.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {promo.discount_type === 'percentage' ? (
                            <>
                              <Percent size={14} className="text-green-600" />
                              <span className="font-semibold text-green-600">{promo.discount_value}%</span>
                              {promo.max_discount && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (max Rp {Number(promo.max_discount).toLocaleString('id-ID')})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="font-semibold text-green-600">
                              Rp {Number(promo.discount_value).toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {promo.min_purchase 
                          ? `Rp ${Number(promo.min_purchase).toLocaleString('id-ID')}` 
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`font-medium ${promo.usage_limit && promo.usage_count >= promo.usage_limit ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                          {promo.usage_count}
                        </span>
                        <span className="text-gray-500">
                          {promo.usage_limit ? ` / ${promo.usage_limit}` : ' (unlimited)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>
                            {promo.start_date || promo.end_date 
                              ? `${formatDate(promo.start_date)} - ${formatDate(promo.end_date)}`
                              : 'No limit'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleEnabled(promo)}
                          className={`badge ${isPromoActive(promo) ? 'badge-success' : 'badge-danger'} cursor-pointer`}
                        >
                          {isPromoActive(promo) ? 'Active' : promo.enabled ? 'Expired/Full' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="btn btn-secondary text-sm py-1.5 px-3"
                            onClick={() => handleOpenModal(promo)}
                          >
                            Edit
                          </button>
                          <button
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            onClick={() => handleDelete(promo.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                      No promo codes found. Create your first promo code!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <div 
              className="card max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingPromo ? 'Edit Promo Code' : 'Add Promo Code'}
                </h2>
                <button 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  onClick={handleCloseModal}
                >
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    className="input-field uppercase"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., NEWYEAR25"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Code will be automatically uppercased</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Discount Type *
                    </label>
                    <select
                      className="input-field"
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (Rp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      placeholder={formData.discount_type === 'percentage' ? 'e.g., 10' : 'e.g., 50000'}
                      min="0"
                      max={formData.discount_type === 'percentage' ? 100 : undefined}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Purchase
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.min_purchase}
                      onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                      placeholder="e.g., 100000"
                      min="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave empty for no minimum</p>
                  </div>

                  {formData.discount_type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Max Discount (Rp)
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        value={formData.max_discount}
                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                        placeholder="e.g., 50000"
                        min="0"
                      />
                      <p className="mt-1 text-xs text-gray-500">Cap for percentage discount</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="e.g., 100"
                    min="1"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty for unlimited usage</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>Enabled</span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingPromo ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PromoManagement;
