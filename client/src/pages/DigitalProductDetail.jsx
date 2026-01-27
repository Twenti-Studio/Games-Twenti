import {
  AlertCircle, ArrowLeft, BookOpen, Check, CheckCircle, ChevronLeft, ChevronRight,
  Copy, CreditCard, Download, Eye, FileSpreadsheet, FileText, Layout,
  Loader2, Package, Shield, Star, Tag, Upload, X, Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getImageUrl, publicAPI } from '../utils/api';

// Map product type icons
const productTypeIcons = {
  'ebook': BookOpen,
  'template-spreadsheet': FileSpreadsheet,
  'template-wordpress': Layout,
  'template': Layout,
  'digital-product': Package,
};

function DigitalProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // User data for digital products
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  });
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  
  // Order success state
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);

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

  // Get product type
  const getProductType = (product) => {
    const serviceType = product?.service_type?.toLowerCase() || '';
    if (serviceType.includes('ebook')) return 'ebook';
    if (serviceType.includes('spreadsheet') || serviceType.includes('excel') || serviceType.includes('sheet')) return 'template-spreadsheet';
    if (serviceType.includes('wordpress') || serviceType.includes('theme')) return 'template-wordpress';
    if (serviceType.includes('template')) return 'template';
    return 'digital-product';
  };

  // Get product images (main + gallery from description if any)
  const getProductImages = () => {
    const images = [];
    if (product?.imageUrl) {
      images.push(product.imageUrl);
    }
    // Could parse additional images from product data if needed
    return images.length > 0 ? images : [null];
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
    if (!formData.email) {
      setError('Email is required for product delivery');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleProceedToPayment = () => {
    setError('');
    if (!validateForm()) {
      return;
    }
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
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

  // Handle promo code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Masukkan kode promo');
      return;
    }

    const selectedPkg = packages.find(p => p.id === selectedPackage);
    if (!selectedPkg) return;

    setPromoLoading(true);
    setPromoError('');

    try {
      const response = await publicAPI.validatePromoCode(promoCode, selectedPkg.price);
      setPromoApplied(response.data);
      setPromoError('');
    } catch (error) {
      setPromoError(error.response?.data?.error || 'Kode promo tidak valid');
      setPromoApplied(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoApplied(null);
    setPromoError('');
  };

  const handleConfirmPayment = async () => {
    if (!paymentProofUrl) {
      setError('Please upload payment proof');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create order with payment proof and promo (if applied)
      const orderPayload = {
        product_id: parseInt(id),
        package_id: selectedPackage,
        user_data: formData,
        payment_proof: paymentProofUrl
      };

      // Add promo info if applied
      if (promoApplied) {
        orderPayload.promo_code = promoApplied.code;
        orderPayload.discount_amount = promoApplied.discount_amount;
        orderPayload.final_price = promoApplied.final_price;
      }

      const response = await publicAPI.createOrder(orderPayload);
      
      // Show success message instead of redirecting to WhatsApp
      setOrderData(response.data);
      setOrderSuccess(true);
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.error || 'Failed to process checkout');
      setSubmitting(false);
    }
  };

  const handleClosePaymentModal = () => {
    if (orderSuccess) {
      // Reset everything on close after success
      setOrderSuccess(false);
      setOrderData(null);
    }
    setShowPaymentModal(false);
    setPaymentProofUrl('');
    setPaymentProofPreview(null);
    setPromoCode('');
    setPromoApplied(null);
    setPromoError('');
    setError('');
  };

  // Calculate final price
  const getFinalPrice = () => {
    const selectedPkg = packages.find(p => p.id === selectedPackage);
    if (!selectedPkg) return 0;
    if (promoApplied) return promoApplied.final_price;
    return Number(selectedPkg.price);
  };

  const productImages = getProductImages();

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
          <p className="text-gray-600 dark:text-gray-400 mb-6">The digital product you're looking for doesn't exist</p>
          <Link to="/digital" className="btn btn-primary">
            <ArrowLeft size={18} className="mr-2" />
            Back to Digital Products
          </Link>
        </div>
      </div>
    );
  }

  const productType = getProductType(product);
  const IconComponent = productTypeIcons[productType] || Package;
  const selectedPkg = packages.find(p => p.id === selectedPackage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/digital" 
            className="inline-flex items-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Digital Products
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[4/3] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
              {productImages[currentImageIndex] ? (
                <img 
                  src={getImageUrl(productImages[currentImageIndex])} 
                  alt={product.name}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => setShowPreview(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900">
                  <IconComponent size={80} className="text-primary-400 dark:text-primary-600" />
                </div>
              )}
              
              {/* Preview Button */}
              {productImages[currentImageIndex] && (
                <button
                  onClick={() => setShowPreview(true)}
                  className="absolute bottom-4 right-4 px-4 py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg flex items-center transition-colors"
                >
                  <Eye size={18} className="mr-2" />
                  Preview
                </button>
              )}

              {/* Navigation Arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(i => i === 0 ? productImages.length - 1 : i - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(i => i === productImages.length - 1 ? 0 : i + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex 
                        ? 'border-primary-600 ring-2 ring-primary-200' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'
                    }`}
                  >
                    {img ? (
                      <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <IconComponent size={24} className="text-gray-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Features */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Product Features</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Download size={16} className="mr-2 text-green-500" />
                  Instant Download
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Shield size={16} className="mr-2 text-blue-500" />
                  Secure Payment
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Zap size={16} className="mr-2 text-yellow-500" />
                  Email Delivery
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FileText size={16} className="mr-2 text-purple-500" />
                  {productType === 'ebook' ? 'PDF Format' : 'Original Files'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Product Info & Purchase */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-primary flex items-center">
                  <IconComponent size={14} className="mr-1" />
                  {product.service_type || 'Digital Product'}
                </span>
                <span className="badge badge-secondary">{product.category_name}</span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  {[1,2,3,4,5].map(i => (
                    <Star 
                      key={i} 
                      size={18} 
                      className={i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} 
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">4.0 (24 reviews)</span>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.description || 'High-quality digital product with instant download access after purchase.'}
              </p>
            </div>

            {/* Package Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Select Package
              </h2>
              
              {packages.length > 0 ? (
                <div className="space-y-3">
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
                      <div className="flex items-start gap-4">
                        {pkg.imageUrl && (
                          <img 
                            src={getImageUrl(pkg.imageUrl)} 
                            alt={pkg.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 pr-8">
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
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  No packages available.
                </p>
              )}
            </div>

            {/* Delivery Info Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Delivery Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Download link will be sent to this email
                  </p>
                </div>
                <div>
                  <label className="label">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Purchase Card */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-200 text-sm mb-1">Total Amount</p>
                    <p className="text-3xl font-bold">
                      {selectedPkg ? `Rp ${Number(selectedPkg.price).toLocaleString('id-ID')}` : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-primary-200 text-sm">
                      <CheckCircle size={16} className="mr-1" />
                      Instant delivery
                    </div>
                  </div>
                </div>
                <button
                  className="w-full flex items-center justify-center px-8 py-4 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleProceedToPayment}
                  disabled={submitting || !selectedPackage || packages.length === 0}
                >
                  <CreditCard size={20} className="mr-2" />
                  Purchase Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showPreview && productImages[currentImageIndex] && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
          >
            <X size={32} />
          </button>
          <img
            src={getImageUrl(productImages[currentImageIndex])}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complete Payment</h2>
              <button 
                onClick={handleClosePaymentModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Success View */}
              {orderSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} className="text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Pesanan Berhasil!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Order #{orderData?.id} telah diterima
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Admin telah diberitahu via email.</strong><br />
                      Link download akan dikirimkan ke <strong>{formData.email}</strong> setelah pembayaran dikonfirmasi.
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-left text-sm space-y-2">
                    <p><span className="text-gray-500">Produk:</span> <span className="font-medium text-gray-900 dark:text-white">{orderData?.product_name}</span></p>
                    <p><span className="text-gray-500">Paket:</span> <span className="font-medium text-gray-900 dark:text-white">{orderData?.package_name}</span></p>
                    <p><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900 dark:text-white">{formData.email}</span></p>
                    {orderData?.promo_code && (
                      <p><span className="text-gray-500">Kode Promo:</span> <span className="font-medium text-green-600">{orderData.promo_code}</span></p>
                    )}
                    <p className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-gray-500">Total Bayar:</span> 
                      <span className="font-bold text-lg text-secondary-600 dark:text-secondary-400 ml-2">
                        Rp {Number(orderData?.price).toLocaleString('id-ID')}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={handleClosePaymentModal}
                    className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <>
                  {/* Order Summary with Promo */}
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <div className="flex justify-between">
                        <span>Product:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{product?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Package:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedPkg?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery to:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Harga:</span>
                        <span className={`font-medium ${promoApplied ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          Rp {selectedPkg ? Number(selectedPkg.price).toLocaleString('id-ID') : '-'}
                        </span>
                      </div>
                      {promoApplied && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Diskon ({promoApplied.code}):</span>
                          <span>-Rp {Number(promoApplied.discount_amount).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="pt-2 mt-2 border-t border-primary-200 dark:border-primary-700 flex justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">Total Bayar:</span>
                        <span className="text-xl font-bold text-secondary-600 dark:text-secondary-400">
                          Rp {getFinalPrice().toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Promo Code Section */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag size={18} className="text-orange-600 dark:text-orange-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Kode Promo</h3>
                    </div>
                    
                    {promoApplied ? (
                      <div className="flex items-center justify-between bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">{promoApplied.code}</span>
                          <span className="text-green-600 text-sm">
                            (-Rp {Number(promoApplied.discount_amount).toLocaleString('id-ID')})
                          </span>
                        </div>
                        <button 
                          onClick={handleRemovePromo}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input-field flex-1 uppercase"
                          placeholder="Masukkan kode promo"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                        />
                        <button
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoCode.trim()}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {promoLoading ? <Loader2 size={18} className="animate-spin" /> : 'Gunakan'}
                        </button>
                      </div>
                    )}
                    
                    {promoError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{promoError}</p>
                    )}
                  </div>

                  {/* Payment Info */}
                  {paymentSettings && (paymentSettings.bank_name || paymentSettings.qr_code) ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Transfer to:</h3>
                      
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
                                >
                                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-500" />}
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
                        Payment details not configured. Please contact admin.
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
                              <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload</p>
                              <p className="text-xs text-gray-400 mt-1">PNG, JPG, max 5MB</p>
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

                  {/* Error */}
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
                        <CheckCircle size={20} className="mr-2" />
                        Konfirmasi Pembayaran
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Setelah konfirmasi, admin akan diberitahu via email. Link download akan dikirim ke email Anda setelah pembayaran diverifikasi.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DigitalProductDetail;
