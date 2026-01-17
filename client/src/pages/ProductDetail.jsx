import { AlertCircle, ArrowLeft, Check, Gamepad2, Loader2, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicAPI } from '../utils/api';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProduct();
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await publicAPI.getProduct(id);
      setProduct(response.data);
      const inputFields = response.data.inputFields || [];
      const initialData = {};
      inputFields.forEach(field => {
        initialData[field.name] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await publicAPI.getPackages(id);
      const data = Array.isArray(response.data) ? response.data : [];
      setPackages(data);
      if (data.length > 0) {
        setSelectedPackage(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!selectedPackage) {
      setError('Please select a package');
      return false;
    }

    const inputFields = product.inputFields || [];
    for (const field of inputFields) {
      if (field.required && !formData[field.name]) {
        setError(`${field.label} is required`);
        return false;
      }
    }

    return true;
  };

  const handleCheckout = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await publicAPI.createOrder({
        product_id: parseInt(id),
        package_id: selectedPackage,
        user_data: formData
      });

      const response = await publicAPI.getCheckoutUrl({
        product_id: parseInt(id),
        package_id: selectedPackage,
        user_data: formData
      });

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.error || 'Failed to process checkout');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The product you're looking for doesn't exist</p>
          <Link to="/products" className="btn btn-primary">
            <ArrowLeft size={18} className="mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const inputFields = product.inputFields || [];
  const selectedPkg = packages.find(p => p.id === selectedPackage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-primary-600 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/products" 
            className="inline-flex items-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Products
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="md:w-72 h-56 md:h-auto bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex-shrink-0">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gamepad2 size={64} className="text-primary-400 dark:text-primary-600" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 p-6">
              <div className="mb-3">
                <span className="badge badge-primary">
                  {product.category_name}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {product.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.description || 'No description available'}
              </p>
            </div>
          </div>
        </div>

        {/* Package Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Select Package
          </h2>
          
          {packages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedPackage === pkg.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  {selectedPackage === pkg.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 pr-8">
                    {pkg.name}
                  </h3>
                  {pkg.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {pkg.description}
                    </p>
                  )}
                  <p className="text-xl font-bold text-secondary-500">
                    Rp {Number(pkg.price).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No packages available for this product.
            </p>
          )}
        </div>

        {/* Dynamic Form Fields */}
        {inputFields.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Required Information
            </h2>
            <div className="space-y-4">
              {inputFields.map((field) => (
                <div key={field.name}>
                  <label className="label">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="input-field"
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                      rows={4}
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      className="input-field"
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  )}
                  {field.help && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{field.help}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Checkout Card */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-primary-200 text-sm mb-1">Total Amount</p>
              <p className="text-3xl font-bold">
                {selectedPkg ? `Rp ${Number(selectedPkg.price).toLocaleString('id-ID')}` : '-'}
              </p>
            </div>
            <button
              className="flex items-center justify-center px-8 py-4 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCheckout}
              disabled={submitting || !selectedPackage || packages.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <MessageCircle size={20} className="mr-2" />
                  Checkout via WhatsApp
                </>
              )}
            </button>
          </div>
          <p className="mt-4 text-sm text-primary-200 text-center sm:text-left">
            You will be redirected to WhatsApp to complete your order
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
