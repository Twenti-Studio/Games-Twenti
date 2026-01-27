import { Download, FileText, Link2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminAPI, getChangedFields, getImageUrl, publicAPI } from '../../utils/api';

// Check if product is digital
const isDigitalProduct = (product) => {
  if (!product) return false;
  const serviceType = product.serviceType?.toLowerCase() || product.service_type?.toLowerCase() || '';
  return (
    serviceType.includes('ebook') ||
    serviceType.includes('e-book') ||
    serviceType.includes('template') ||
    serviceType.includes('digital')
  );
};

// File type options for digital products
const fileTypeOptions = [
  { value: '', label: 'Select file type' },
  { value: 'PDF', label: 'PDF Document' },
  { value: 'XLSX', label: 'Excel Spreadsheet (.xlsx)' },
  { value: 'XLS', label: 'Excel Spreadsheet (.xls)' },
  { value: 'DOCX', label: 'Word Document (.docx)' },
  { value: 'ZIP', label: 'ZIP Archive' },
  { value: 'RAR', label: 'RAR Archive' },
  { value: 'PSD', label: 'Photoshop (.psd)' },
  { value: 'AI', label: 'Illustrator (.ai)' },
  { value: 'FIG', label: 'Figma File' },
  { value: 'OTHER', label: 'Other' },
];

function PackageManagement() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', description: '', price: '', image_url: '', 
    download_url: '', file_type: '', enabled: true 
  });
  const [error, setError] = useState('');
  const [imageMode, setImageMode] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const originalDataRef = useRef(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchData = async () => {
    try {
      const [productRes, packagesRes] = await Promise.all([
        publicAPI.getProduct(productId),
        adminAPI.getPackages(productId)
      ]);
      setProduct(productRes.data || null);
      setPackages(Array.isArray(packagesRes.data) ? packagesRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setProduct(null);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      const initialData = {
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price,
        image_url: pkg.image_url || '',
        download_url: pkg.download_url || '',
        file_type: pkg.file_type || '',
        enabled: pkg.enabled === 1
      };
      setFormData(initialData);
      originalDataRef.current = { ...initialData };
      if (pkg.image_url) {
        setImagePreview(getImageUrl(pkg.image_url));
        setImageMode(pkg.image_url.startsWith('/uploads') ? 'upload' : 'url');
      } else {
        setImagePreview(null);
        setImageMode('url');
      }
    } else {
      setEditingPackage(null);
      setFormData({ 
        name: '', description: '', price: '', image_url: '', 
        download_url: '', file_type: '', enabled: true 
      });
      setImagePreview(null);
      setImageMode('url');
      originalDataRef.current = null;
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPackage(null);
    setFormData({ 
      name: '', description: '', price: '', image_url: '', 
      download_url: '', file_type: '', enabled: true 
    });
    setError('');
    setImagePreview(null);
    setImageMode('url');
    originalDataRef.current = null;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const response = await adminAPI.uploadImage(file);
      setFormData({ ...formData, image_url: response.data.url });
      setImagePreview(getImageUrl(response.data.url));
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' });
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const currentData = {
      ...formData,
      price: parseFloat(formData.price),
      enabled: formData.enabled ? 1 : 0
    };

    try {
      if (editingPackage) {
        // Get only changed fields for PATCH
        const originalData = {
          ...originalDataRef.current,
          price: parseFloat(originalDataRef.current.price),
          enabled: originalDataRef.current.enabled ? 1 : 0
        };
        const changedFields = getChangedFields(originalData, currentData);
        
        // Only send request if there are changes
        if (Object.keys(changedFields).length === 0) {
          handleCloseModal();
          return;
        }
        
        await adminAPI.patchPackage(editingPackage.id, changedFields);
      } else {
        await adminAPI.createPackage({
          ...currentData,
          product_id: parseInt(productId)
        });
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save package');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) {
      return;
    }

    try {
      await adminAPI.deletePackage(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete package');
    }
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
          <Link 
            to="/admin/products" 
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium mb-2 inline-block"
          >
            ← Back to Products
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Packages for: {product?.name}
            </h1>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              + Add Package
            </button>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Image</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                  {isDigitalProduct(product) && (
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Download</th>
                  )}
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.length > 0 ? (
                  packages.map((pkg) => (
                    <tr key={pkg.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        {pkg.image_url ? (
                          <img 
                            src={getImageUrl(pkg.image_url)} 
                            alt={pkg.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                            -
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{pkg.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{pkg.description || '-'}</td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Rp {pkg.price.toLocaleString('id-ID')}</td>
                      {isDigitalProduct(product) && (
                        <td className="py-3 px-4">
                          {pkg.download_url ? (
                            <div className="flex items-center gap-2">
                              <span className="badge badge-info flex items-center gap-1">
                                <FileText size={12} />
                                {pkg.file_type || 'File'}
                              </span>
                              <a 
                                href={pkg.download_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 text-xs"
                              >
                                View Link
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not set</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className={`badge ${pkg.enabled ? 'badge-success' : 'badge-danger'}`}>
                          {pkg.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="btn btn-secondary text-sm py-1.5 px-3"
                            onClick={() => handleOpenModal(pkg)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger text-sm py-1.5 px-3"
                            onClick={() => handleDelete(pkg.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isDigitalProduct(product) ? 7 : 6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                      No packages found. Create your first package!
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
              className="card max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingPackage ? 'Edit Package' : 'Add Package'}
                </h2>
                <button 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
                  onClick={handleCloseModal}
                >
                  ×
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
                    Package Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Package Image
                  </label>
                  
                  {/* Image Mode Toggle */}
                  <div className="flex space-x-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        imageMode === 'url'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Link2 size={14} className="mr-1" />
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        imageMode === 'upload'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Upload size={14} className="mr-1" />
                      Upload
                    </button>
                  </div>

                  {/* URL Input */}
                  {imageMode === 'url' && (
                    <input
                      type="url"
                      className="input-field"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value || null);
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                  )}

                  {/* File Upload */}
                  {imageMode === 'upload' && (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex flex-col items-center justify-center py-4">
                        {uploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                        ) : (
                          <>
                            <Upload size={20} className="text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">Click to upload</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-20 w-auto rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Digital Product Fields */}
                {isDigitalProduct(product) && (
                  <>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Download size={18} className="text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-blue-800 dark:text-blue-200">Digital Product Settings</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Download URL / Link
                          </label>
                          <input
                            type="url"
                            className="input-field"
                            value={formData.download_url}
                            onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                            placeholder="https://drive.google.com/... or direct link"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Link download yang akan diberikan ke pembeli setelah konfirmasi
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            File Type
                          </label>
                          <select
                            className="input-field"
                            value={formData.file_type}
                            onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                          >
                            {fileTypeOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}

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
                    {editingPackage ? 'Update' : 'Create'}
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

export default PackageManagement;
