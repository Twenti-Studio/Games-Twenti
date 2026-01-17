import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, getImageUrl } from '../../utils/api';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    slug: '',
    description: '',
    image_url: '',
    service_type: '',
    input_fields: '[]',
    enabled: true
  });
  const [inputFields, setInputFields] = useState([]);
  const [error, setError] = useState('');
  const [imageMode, setImageMode] = useState('url'); // 'url' or 'upload'
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        adminAPI.getProducts(),
        adminAPI.getCategories()
      ]);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      const fields = JSON.parse(product.input_fields || '[]');
      setFormData({
        category_id: product.category_id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        image_url: product.image_url || '',
        service_type: product.service_type,
        input_fields: product.input_fields,
        enabled: product.enabled === 1
      });
      setInputFields(fields);
      // Set image preview if exists
      if (product.image_url) {
        setImagePreview(getImageUrl(product.image_url));
        setImageMode(product.image_url.startsWith('/uploads') ? 'upload' : 'url');
      } else {
        setImagePreview(null);
        setImageMode('url');
      }
    } else {
      setEditingProduct(null);
      setFormData({
        category_id: '',
        name: '',
        slug: '',
        description: '',
        image_url: '',
        service_type: '',
        input_fields: '[]',
        enabled: true
      });
      setInputFields([]);
      setImagePreview(null);
      setImageMode('url');
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      category_id: '',
      name: '',
      slug: '',
      description: '',
      image_url: '',
      service_type: '',
      input_fields: '[]',
      enabled: true
    });
    setInputFields([]);
    setError('');
    setImagePreview(null);
    setImageMode('url');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only image files are allowed (JPEG, PNG, GIF, WebP)');
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

  const addInputField = () => {
    setInputFields([...inputFields, { name: '', label: '', type: 'text', required: false, placeholder: '', help: '' }]);
  };

  const updateInputField = (index, field) => {
    const updated = [...inputFields];
    updated[index] = field;
    setInputFields(updated);
  };

  const removeInputField = (index) => {
    setInputFields(inputFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const submitData = {
      ...formData,
      input_fields: JSON.stringify(inputFields),
      enabled: formData.enabled ? 1 : 0
    };

    try {
      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, submitData);
      } else {
        await adminAPI.createProduct(submitData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await adminAPI.deleteProduct(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete product');
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Product Management</h1>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add Product
          </button>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Service Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{product.category_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{product.service_type}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${product.enabled ? 'badge-success' : 'badge-danger'}`}>
                          {product.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/admin/products/${product.id}/packages`}
                            className="btn btn-secondary text-sm py-1.5 px-3"
                          >
                            Packages
                          </Link>
                          <button
                            className="btn btn-secondary text-sm py-1.5 px-3"
                            onClick={() => handleOpenModal(product)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger text-sm py-1.5 px-3"
                            onClick={() => handleDelete(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500 dark:text-gray-400">
                      No products found. Create your first product!
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={handleCloseModal}
          >
            <div 
              className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
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
                    Category *
                  </label>
                  <select
                    className="input-field"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Product Name *
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
                    Slug *
                  </label>
                  <input
                    type="text"
                    className="input-field font-mono"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    placeholder="product-slug"
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
                    Product Image
                  </label>
                  
                  {/* Image Mode Toggle */}
                  <div className="flex space-x-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        imageMode === 'url'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Link2 size={16} className="mr-2" />
                      URL Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        imageMode === 'upload'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Upload size={16} className="mr-2" />
                      Upload File
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
                    <div className="space-y-3">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                          ) : (
                            <>
                              <Upload size={24} className="text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                PNG, JPG, GIF, WebP (max 5MB)
                              </p>
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
                    </div>
                  )}

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-32 w-auto rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Service Type *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    required
                    placeholder="e.g., Game Top-Up, Digital Subscription"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Input Fields
                  </label>
                  <div className="space-y-4">
                    {inputFields.map((field, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="Field name (e.g., user_id)"
                            value={field.name}
                            onChange={(e) => updateInputField(index, { ...field, name: e.target.value })}
                            className="input-field"
                          />
                          <input
                            type="text"
                            placeholder="Label (e.g., User ID)"
                            value={field.label}
                            onChange={(e) => updateInputField(index, { ...field, label: e.target.value })}
                            className="input-field"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateInputField(index, { ...field, type: e.target.value })}
                            className="input-field"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="number">Number</option>
                            <option value="textarea">Textarea</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="Placeholder"
                            value={field.placeholder || ''}
                            onChange={(e) => updateInputField(index, { ...field, placeholder: e.target.value })}
                            className="input-field"
                          />
                          <input
                            type="text"
                            placeholder="Help text"
                            value={field.help || ''}
                            onChange={(e) => updateInputField(index, { ...field, help: e.target.value })}
                            className="input-field"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateInputField(index, { ...field, required: e.target.checked })}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span>Required</span>
                          </label>
                          <button
                            type="button"
                            className="btn btn-danger text-sm py-1.5 px-3"
                            onClick={() => removeInputField(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary text-sm"
                      onClick={addInputField}
                    >
                      + Add Field
                    </button>
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
                    {editingProduct ? 'Update' : 'Create'}
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

export default ProductManagement;
