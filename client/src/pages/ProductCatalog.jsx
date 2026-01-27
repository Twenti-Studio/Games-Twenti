import { BookOpen, Download, FileSpreadsheet, Filter, Gamepad2, Layout, Package, Search, Tv, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getImageUrl, publicAPI } from '../utils/api';


// Map category icons
const categoryIcons = {
  'game': Gamepad2,
  'digital-subscription': Tv,
  'social-media-services': Users,
  'ebook': BookOpen,
  'e-book': BookOpen,
  'template': Layout,
  'template-spreadsheet': FileSpreadsheet,
  'template-wordpress': Layout,
  'digital-product': Package,
  'digital': Package,
};

// Check if product is digital
const isDigitalProduct = (product) => {
  const serviceType = (product.serviceType || product.service_type || '').toLowerCase().replace(/-/g, '');
  const categorySlug = (product.category_slug || '').toLowerCase().replace(/-/g, '');
  return (
    serviceType.includes('ebook') ||
    serviceType.includes('template') ||
    serviceType.includes('digital') ||
    categorySlug.includes('ebook') ||
    categorySlug.includes('template') ||
    categorySlug.includes('digital')
  );
};

// Product type filters
const productTypeFilters = [
  { id: 'all', name: 'All Products', icon: Filter },
  { id: 'game', name: 'Game Top-Up', icon: Gamepad2 },
  { id: 'digital', name: 'Digital Products', icon: BookOpen },
];

function ProductCatalog() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState(searchParams.get('type') || 'all');

  useEffect(() => {
    fetchCategories();
    if (categoryId) {
      fetchProductsByCategory(categoryId);
    } else {
      fetchAllProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchCategories = async () => {
    try {
      const response = await publicAPI.getCategories();
      const data = Array.isArray(response.data) ? response.data : [];
      setCategories(data);
      if (categoryId) {
        const category = data.find(c => c.id === parseInt(categoryId));
        setSelectedCategory(category || null);
      } else {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await publicAPI.getProducts();
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByCategory = async (id) => {
    try {
      const response = await publicAPI.getProductsByCategory(id);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle product type filter change
  const handleTypeFilterChange = (typeId) => {
    setProductTypeFilter(typeId);
    if (typeId === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', typeId);
    }
    setSearchParams(searchParams);
  };

  // Filter products by search and type
  const filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter
    if (productTypeFilter === 'all') return matchesSearch;
    if (productTypeFilter === 'game') return matchesSearch && !isDigitalProduct(product);
    if (productTypeFilter === 'digital') return matchesSearch && isDigitalProduct(product);
    
    return matchesSearch;
  });

  // Get product detail link based on type
  const getProductLink = (product) => {
    return isDigitalProduct(product) ? `/digital/${product.id}` : `/products/${product.id}`;
  };

  // Get product icon based on type
  const getProductIcon = (product) => {
    if (isDigitalProduct(product)) {
      const serviceType = (product.serviceType || product.service_type || '').toLowerCase();
      if (serviceType.includes('ebook') || serviceType.includes('e-book')) return BookOpen;
      if (serviceType.includes('spreadsheet') || serviceType.includes('excel')) return FileSpreadsheet;
      if (serviceType.includes('template')) return Layout;
      return Package;
    }
    return Gamepad2;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-primary-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {selectedCategory ? selectedCategory.name : 'All Products'}
            </h1>
            {selectedCategory && (
              <p className="text-primary-200 text-lg">
                {selectedCategory.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
          
          {/* Category Filter Dropdown (Mobile) */}
          <div className="md:hidden">
            <select
              value={categoryId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  window.location.href = `/category/${e.target.value}`;
                } else {
                  window.location.href = '/products';
                }
              }}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Type Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {productTypeFilters.map((filter) => {
            const IconComponent = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => handleTypeFilterChange(filter.id)}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  productTypeFilter === filter.id
                    ? 'bg-secondary-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <IconComponent size={16} className="mr-2" />
                {filter.name}
              </button>
            );
          })}
        </div>

        {/* Category Filter (Desktop) */}
        <div className="hidden md:flex flex-wrap gap-3 mb-8">
          <Link
            to="/products"
            className={`inline-flex items-center px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              !categoryId
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Filter size={18} className="mr-2" />
            All Categories
          </Link>
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.slug] || Package;
            return (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className={`inline-flex items-center px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  categoryId === category.id.toString()
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <IconComponent size={18} className="mr-2" />
                {category.name}
              </Link>
            );
          })}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const ProductIcon = getProductIcon(product);
              const isDigital = isDigitalProduct(product);
              
              return (
                <Link
                  key={product.id}
                  to={getProductLink(product)}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 relative overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={getImageUrl(product.imageUrl)} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className={`w-full h-full items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}>
                      <ProductIcon size={48} className="text-primary-400 dark:text-primary-600" />
                    </div>
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 rounded-full text-xs font-semibold text-primary-600 dark:text-secondary-400">
                        {product.category_name}
                      </span>
                    </div>
                    {/* Digital Badge */}
                    {isDigital && (
                      <div className="absolute bottom-3 right-3">
                        <span className="px-2.5 py-1.5 bg-green-500/90 text-white rounded-lg text-xs font-medium flex items-center">
                          <Download size={12} className="mr-1" />
                          Digital
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {product.description || (isDigital ? 'Digital product with instant download' : 'Click to view details and packages')}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'Try a different search term' : 'No products available in this category'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCatalog;
