import { AlertCircle, ArrowLeft, Check, Copy, CreditCard, Gamepad2, Loader2, MessageCircle, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getImageUrl, publicAPI } from '../utils/api';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchPackages();
    fetchPaymentSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPaymentSettings = async () => {
    try {
      const response = await publicAPI.getPaymentSettings();
      setPaymentSettings(response.data);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

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

  const handleProceedToPayment = () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    // Show payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingProof(true);
    setError('');

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload file
      const response = await publicAPI.uploadPaymentProof(file);
      setPaymentProofUrl(response.data.url);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload payment proof');
      setPaymentProofPreview(null);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleRemoveProof = () => {
    setPaymentProofUrl('');
    setPaymentProofPreview(null);
  };

  const copyAccountNumber = () => {
    if (paymentSettings?.account_number) {
      navigator.clipboard.writeText(paymentSettings.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentProofUrl) {
      setError('Please upload payment proof');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create order with payment proof
      await publicAPI.createOrder({
        product_id: parseInt(id),
        package_id: selectedPackage,
        user_data: formData,
        payment_proof: paymentProofUrl
      });

      // Get WhatsApp URL with payment proof
      const response = await publicAPI.getCheckoutUrl({
        product_id: parseInt(id),
        package_id: selectedPackage,
        user_data: formData,
        payment_proof: getImageUrl(paymentProofUrl)
      });

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.error || 'Failed to process checkout');
      setSubmitting(false);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentProofUrl('');
    setPaymentProofPreview(null);
    setError('');
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
                  src={getImageUrl(product.imageUrl)} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className={`w-full h-full items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}>
                <Gamepad2 size={64} className="text-primary-400 dark:text-primary-600" />
              </div>
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
                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center z-10">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  <div className="flex gap-3">
                    {/* Package Image */}
                    {pkg.imageUrl && (
                      <div className="flex-shrink-0">
                        <img 
                          src={getImageUrl(pkg.imageUrl)} 
                          alt={pkg.name}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 pr-8 truncate">
                        {pkg.name}
                      </h3>
                      {pkg.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                          {pkg.description}
                        </p>
                      )}
                      <p className="text-xl font-bold text-secondary-500">
                        Rp {Number(pkg.price).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
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
              onClick={handleProceedToPayment}
              disabled={submitting || !selectedPackage || packages.length === 0}
            >
              <CreditCard size={20} className="mr-2" />
              Proceed to Payment
            </button>
          </div>
          <p className="mt-4 text-sm text-primary-200 text-center sm:text-left">
            Complete payment and upload proof before confirming via WhatsApp
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={handleClosePaymentModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Details</h2>
              <button 
                onClick={handleClosePaymentModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Order Summary</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><span className="font-medium">Product:</span> {product?.name}</p>
                  <p><span className="font-medium">Package:</span> {selectedPkg?.name}</p>
                  <p className="text-lg font-bold text-secondary-600 dark:text-secondary-400 pt-2">
                    Total: Rp {selectedPkg ? Number(selectedPkg.price).toLocaleString('id-ID') : '-'}
                  </p>
                </div>
              </div>

              {/* Payment Info */}
              {paymentSettings && (paymentSettings.bank_name || paymentSettings.qr_code) ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Transfer to:</h3>
                  
                  {/* Bank Details */}
                  {paymentSettings.bank_name && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bank / E-Wallet</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-lg">{paymentSettings.bank_name}</p>
                      
                      {paymentSettings.account_number && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account Number</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xl font-bold text-primary-600 dark:text-primary-400">
                              {paymentSettings.account_number}
                            </p>
                            <button
                              onClick={copyAccountNumber}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              title="Copy account number"
                            >
                              {copied ? (
                                <Check size={18} className="text-green-500" />
                              ) : (
                                <Copy size={18} className="text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {paymentSettings.account_name && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account Name</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{paymentSettings.account_name}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QR Code */}
                  {paymentSettings.qr_code && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Or scan QR Code:</p>
                      <img
                        src={getImageUrl(paymentSettings.qr_code)}
                        alt="Payment QR Code"
                        className="mx-auto max-w-[200px] rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    Payment details have not been configured. Please contact admin.
                  </p>
                </div>
              )}

              {/* Upload Payment Proof */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Upload Payment Proof <span className="text-red-500">*</span>
                </h3>
                
                {!paymentProofPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex flex-col items-center justify-center py-4">
                      {uploadingProof ? (
                        <Loader2 size={32} className="text-primary-600 animate-spin" />
                      ) : (
                        <>
                          <Upload size={32} className="text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                            Click to upload payment proof
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            PNG, JPG, max 5MB
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePaymentProofUpload}
                      disabled={uploadingProof}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={paymentProofPreview}
                      alt="Payment Proof"
                      className="w-full max-h-48 object-contain rounded-xl border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      onClick={handleRemoveProof}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleConfirmPayment}
                disabled={submitting || !paymentProofUrl}
                className="w-full flex items-center justify-center px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <MessageCircle size={20} className="mr-2" />
                    Confirm & Send via WhatsApp
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                After clicking confirm, you will be redirected to WhatsApp to send your order details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
