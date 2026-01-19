import { Link2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { adminAPI, getChangedFields, getImageUrl } from '../../utils/api';

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', icon: '' });
  const [error, setError] = useState('');
  const [iconMode, setIconMode] = useState('emoji'); // 'emoji', 'url', or 'upload'
  const [uploading, setUploading] = useState(false);
  const [iconPreview, setIconPreview] = useState(null);
  const originalDataRef = useRef(null); // Store original data for comparison

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getCategories();
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      const initialData = {
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        icon: category.icon || ''
      };
      setFormData(initialData);
      // Store original data for comparison
      originalDataRef.current = { ...initialData };
      // Determine icon mode based on value
      if (category.icon) {
        if (category.icon.startsWith('/uploads') || category.icon.startsWith('http')) {
          setIconMode(category.icon.startsWith('/uploads') ? 'upload' : 'url');
          setIconPreview(getImageUrl(category.icon));
        } else {
          setIconMode('emoji');
          setIconPreview(null);
        }
      } else {
        setIconMode('emoji');
        setIconPreview(null);
      }
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', icon: '' });
      setIconMode('emoji');
      setIconPreview(null);
      originalDataRef.current = null;
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', icon: '' });
    setError('');
    setIconMode('emoji');
    setIconPreview(null);
    originalDataRef.current = null;
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only image files are allowed');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const response = await adminAPI.uploadImage(file);
      setFormData({ ...formData, icon: response.data.url });
      setIconPreview(getImageUrl(response.data.url));
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload icon');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveIcon = () => {
    setFormData({ ...formData, icon: '' });
    setIconPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingCategory) {
        // Get only changed fields for PATCH
        const changedFields = getChangedFields(originalDataRef.current, formData);
        
        // Only send request if there are changes
        if (Object.keys(changedFields).length === 0) {
          handleCloseModal();
          return;
        }
        
        await adminAPI.patchCategory(editingCategory.id, changedFields);
      } else {
        await adminAPI.createCategory(formData);
      }
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await adminAPI.deleteCategory(id);
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete category');
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Category Management</h1>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add Category
          </button>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Icon</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Slug</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        {category.icon?.startsWith('/uploads') || category.icon?.startsWith('http') ? (
                          <img 
                            src={getImageUrl(category.icon)} 
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{category.icon || '📦'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{category.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono">{category.slug}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{category.description || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="btn btn-secondary text-sm py-1.5 px-3"
                            onClick={() => handleOpenModal(category)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger text-sm py-1.5 px-3"
                            onClick={() => handleDelete(category.id)}
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
                      No categories found. Create your first category!
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
              className="card max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
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
                    Name *
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
                    placeholder="category-slug"
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
                    Icon
                  </label>
                  
                  {/* Icon Mode Toggle */}
                  <div className="flex space-x-2 mb-3">
                    <button
                      type="button"
                      onClick={() => { setIconMode('emoji'); setIconPreview(null); }}
                      className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        iconMode === 'emoji'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      😀 Emoji
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIconMode('url'); setIconPreview(formData.icon?.startsWith('http') ? formData.icon : null); }}
                      className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        iconMode === 'url'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Link2 size={14} className="mr-1" />
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconMode('upload')}
                      className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        iconMode === 'upload'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Upload size={14} className="mr-1" />
                      Upload
                    </button>
                  </div>

                  {/* Emoji Input */}
                  {iconMode === 'emoji' && (
                    <input
                      type="text"
                      className="input-field text-2xl"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="🎮"
                    />
                  )}

                  {/* URL Input */}
                  {iconMode === 'url' && (
                    <input
                      type="url"
                      className="input-field"
                      value={formData.icon}
                      onChange={(e) => {
                        setFormData({ ...formData, icon: e.target.value });
                        setIconPreview(e.target.value || null);
                      }}
                      placeholder="https://example.com/icon.png"
                    />
                  )}

                  {/* File Upload */}
                  {iconMode === 'upload' && (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex flex-col items-center justify-center py-4">
                        {uploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                        ) : (
                          <>
                            <Upload size={20} className="text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">Click to upload icon</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleIconUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}

                  {/* Icon Preview */}
                  {iconPreview && (iconMode === 'url' || iconMode === 'upload') && (
                    <div className="mt-3 relative inline-block">
                      <img
                        src={iconPreview}
                        alt="Icon Preview"
                        className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveIcon}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCategory ? 'Update' : 'Create'}
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

export default CategoryManagement;
