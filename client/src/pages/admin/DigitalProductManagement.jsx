import { AlertCircle, BookOpen, Download, Eye, FileSpreadsheet, FolderPlus, Layout, Link2, Package, Plus, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, getChangedFields, getImageUrl } from '../../utils/api';

// Product type options for digital products
const serviceTypes = [
  { value: 'E-Book', label: 'E-Book', icon: BookOpen, suggestedCategory: 'E-Book' },
  { value: 'Template Spreadsheet', label: 'Template Spreadsheet', icon: FileSpreadsheet, suggestedCategory: 'Template Spreadsheet' },
  { value: 'Template WordPress', label: 'Template WordPress', icon: Layout, suggestedCategory: 'Template WordPress' },
  { value: 'Template Figma', label: 'Template Figma', icon: Layout, suggestedCategory: 'Template Figma' },
  { value: 'Digital Asset', label: 'Digital Asset', icon: Package, suggestedCategory: 'Digital Asset' },
];

const productTypeIcons = {
  'e-book': BookOpen,
  'ebook': BookOpen,
  'template spreadsheet': FileSpreadsheet,
  'template-spreadsheet': FileSpreadsheet,
  'spreadsheet': FileSpreadsheet,
  'template wordpress': Layout,
  'template-wordpress': Layout,
  'wordpress': Layout,
  'template figma': Layout,
  'figma': Layout,
  'digital': Package,
};

function DigitalProductManagement() {
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
    service_type: 'E-Book',
    input_fields: '[]',
    enabled: true
  });
  const [error, setError] = useState('');
  const [imageMode, setImageMode] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const originalDataRef = useRef(null);

  // New category creation state
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        adminAPI.getProducts(),
        adminAPI.getCategories()
      ]);
      
      // Filter to get only digital products
      const allProducts = Array.isArray(productsRes.data) ? productsRes.data : [];
      const digitalProducts = allProducts.filter(p => 
        p.service_type?.toLowerCase().includes('ebook') ||
        p.service_type?.toLowerCase().includes('e-book') ||
        p.service_type?.toLowerCase().includes('template') ||
        p.service_type?.toLowerCase().includes('digital') ||
        p.category_slug?.includes('ebook') ||
        p.category_slug?.includes('template') ||
        p.category_slug?.includes('digital')
      );
      
      setProducts(digitalProducts);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const getProductIcon = (serviceType) => {
    const type = serviceType?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(productTypeIcons)) {
      if (type.includes(key)) return icon;
    }
    return Package;
  };

  const filteredProducts = products.filter(product => {
    if (activeTab === 'all') return true;
    const type = product.service_type?.toLowerCase() || '';
    if (activeTab === 'ebook') return type.includes('ebook') || type.includes('e-book');
    if (activeTab === 'template') return type.includes('template');
    return true;
  });

  // Check if a category for the selected service type exists
  const getSuggestedCategory = () => {
    const serviceType = serviceTypes.find(t => t.value === formData.service_type);
    if (!serviceType) return null;
    
    // Check if a matching category exists
    const matchingCategory = categories.find(cat => 
      cat.name.toLowerCase().includes(serviceType.suggestedCategory.toLowerCase()) ||
      cat.slug.toLowerCase().includes(serviceType.suggestedCategory.toLowerCase().replace(/\s+/g, '-'))
    );
    
    return {
      exists: !!matchingCategory,
      category: matchingCategory,
      suggestedName: serviceType.suggestedCategory
    };
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      const initialData = {
        category_id: product.category_id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        image_url: product.image_url || '',
        service_type: product.service_type,
        input_fields: product.input_fields || '[]',
        enabled: product.enabled === 1
      };
      setFormData(initialData);
      originalDataRef.current = { ...initialData };
      
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
        service_type: 'E-Book',
        input_fields: '[]',
        enabled: true
      });
      setImagePreview(null);
      setImageMode('url');
      originalDataRef.current = null;
    }
    setError('');
    setShowNewCategoryForm(false);
    setNewCategoryName('');
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
      service_type: 'E-Book',
      input_fields: '[]',
      enabled: true
    });
    setError('');
    setImagePreview(null);
    setImageMode('url');
    setShowNewCategoryForm(false);
    setNewCategoryName('');
    originalDataRef.current = null;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

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

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      slug: editingProduct ? formData.slug : generateSlug(name)
    });
  };

  // Handle creating new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    setCreatingCategory(true);
    setError('');

    try {
      const slug = generateSlug(newCategoryName);
      const response = await adminAPI.createCategory({
        name: newCategoryName.trim(),
        slug: slug,
        description: `Category for ${newCategoryName}`,
        icon: '📦'
      });

      // Add new category to list and select it
      const newCategory = response.data;
      setCategories([...categories, newCategory]);
      setFormData({ ...formData, category_id: newCategory.id.toString() });
      setShowNewCategoryForm(false);
      setNewCategoryName('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  // Auto-select or suggest category when service type changes
  const handleServiceTypeChange = (serviceType) => {
    setFormData({ ...formData, service_type: serviceType });
    
    // Try to auto-select matching category
    const matchingCategory = categories.find(cat => 
      cat.name.toLowerCase().includes(serviceType.toLowerCase()) ||
      cat.slug.toLowerCase().includes(serviceType.toLowerCase().replace(/\s+/g, '-'))
    );
    
    if (matchingCategory && !formData.category_id) {
      setFormData(prev => ({ ...prev, service_type: serviceType, category_id: matchingCategory.id.toString() }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.category_id) {
      setError('Please select or create a category');
      return;
    }

    // Default input fields for digital products (email for delivery)
    const defaultInputFields = JSON.stringify([
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com', help: 'Download link will be sent to this email' },
      { name: 'name', label: 'Your Name', type: 'text', required: false, placeholder: 'Your name', help: '' }
    ]);

    const currentData = {
      ...formData,
      input_fields: formData.input_fields === '[]' ? defaultInputFields : formData.input_fields,
      enabled: formData.enabled ? 1 : 0
    };

    try {
      if (editingProduct) {
        const originalData = {
          ...originalDataRef.current,
          enabled: originalDataRef.current.enabled ? 1 : 0
        };
        const changedFields = getChangedFields(originalData, currentData);
        
        if (Object.keys(changedFields).length === 0) {
          handleCloseModal();
          return;
        }
        
        await adminAPI.patchProduct(editingProduct.id, changedFields);
      } else {
        await adminAPI.createProduct(currentData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this digital product?')) {
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

  const suggestedCategory = getSuggestedCategory();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Digital Products</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Manage e-books, templates, and digital assets</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} className="mr-2" />
            Add Digital Product
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Package size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <BookOpen size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {products.filter(p => p.service_type?.toLowerCase().includes('ebook') || p.service_type?.toLowerCase().includes('e-book')).length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">E-Books</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <FileSpreadsheet size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {products.filter(p => p.service_type?.toLowerCase().includes('template')).length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Templates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'ebook', label: 'E-Books' },
            { id: 'template', label: 'Templates' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Product</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const IconComponent = getProductIcon(product.service_type);
                    return (
                      <tr key={product.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {product.image_url ? (
                                <img 
                                  src={getImageUrl(product.image_url)} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <IconComponent size={24} className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <IconComponent size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{product.service_type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{product.category_name}</td>
                        <td className="py-4 px-6">
                          <span className={`badge ${product.enabled ? 'badge-success' : 'badge-danger'}`}>
                            {product.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/digital/${product.id}`}
                              target="_blank"
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Preview"
                            >
                              <Eye size={18} />
                            </Link>
                            <Link
                              to={`/admin/products/${product.id}/packages`}
                              className="btn btn-secondary text-sm py-1.5 px-3"
                            >
                              <Download size={14} className="mr-1" />
                              Packages
                            </Link>
                            <button
                              className="btn btn-ghost text-sm py-1.5 px-3"
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                          <Package size={32} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No digital products found</p>
                        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                          <Plus size={18} className="mr-2" />
                          Create First Product
                        </button>
                      </div>
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
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingProduct ? 'Edit Digital Product' : 'Add Digital Product'}
                </h2>
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={handleCloseModal}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Product Type */}
                  <div>
                    <label className="label">Product Type *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {serviceTypes.map((type) => {
                        const TypeIcon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleServiceTypeChange(type.value)}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                              formData.service_type === type.value
                                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                            }`}
                          >
                            <TypeIcon size={24} className={formData.service_type === type.value ? 'text-primary-600' : 'text-gray-400'} />
                            <span className={`text-sm font-medium text-center ${formData.service_type === type.value ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}>
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="label">Category *</label>
                    
                    {!showNewCategoryForm ? (
                      <div className="space-y-3">
                        <select
                          className="input-field"
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        >
                          <option value="">Select a category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        
                        {/* Suggestion or create new */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewCategoryForm(true);
                              setNewCategoryName(suggestedCategory?.suggestedName || '');
                            }}
                            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            <FolderPlus size={16} className="mr-1" />
                            Create new category
                          </button>
                          
                          {suggestedCategory && !suggestedCategory.exists && !formData.category_id && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              (Suggested: {suggestedCategory.suggestedName})
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2 mb-3">
                          <FolderPlus size={18} className="text-primary-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Create New Category</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input-field flex-1"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Category name (e.g., E-Book)"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={creatingCategory || !newCategoryName.trim()}
                            className="btn btn-primary px-4"
                          >
                            {creatingCategory ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              'Create'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewCategoryForm(false);
                              setNewCategoryName('');
                            }}
                            className="btn btn-ghost px-3"
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          This will create a new category that you can use for your digital products.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Name & Slug */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Product Name *</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g., Excel Budget Template"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Slug *</label>
                      <input
                        type="text"
                        className="input-field font-mono text-sm"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="excel-budget-template"
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="label">Description</label>
                    <textarea
                      className="input-field"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your digital product..."
                    />
                  </div>

                  {/* Cover Image */}
                  <div>
                    <label className="label">Cover Image</label>
                    
                    <div className="flex gap-2 mb-3">
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
                        URL
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
                        Upload
                      </button>
                    </div>

                    {imageMode === 'url' && (
                      <input
                        type="url"
                        className="input-field"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value });
                          setImagePreview(e.target.value || null);
                        }}
                        placeholder="https://example.com/cover.jpg"
                      />
                    )}

                    {imageMode === 'upload' && (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex flex-col items-center">
                          {uploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                          ) : (
                            <>
                              <Upload size={24} className="text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">Click to upload cover image</p>
                              <p className="text-xs text-gray-400 mt-1">PNG, JPG, max 5MB</p>
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

                    {imagePreview && (
                      <div className="mt-3 relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Cover Preview"
                          className="h-32 w-auto rounded-lg object-cover border border-gray-200 dark:border-gray-700"
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

                  {/* Enabled Toggle */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enabled}
                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Product is active and visible</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DigitalProductManagement;
