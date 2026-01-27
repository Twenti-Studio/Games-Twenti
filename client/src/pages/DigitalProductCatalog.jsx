import { BookOpen, Download, FileSpreadsheet, Layout, Package, Search, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getImageUrl, publicAPI } from '../utils/api';

// Map category/product type icons
const productTypeIcons = {
  'ebook': BookOpen,
  'template-spreadsheet': FileSpreadsheet,
  'template-wordpress': Layout,
  'template': Layout,
  'digital-product': Package,
};

// Product type filters
const productTypeFilters = [
  { id: 'all', name: 'All Products', icon: Package },
  { id: 'ebook', name: 'E-Books', icon: BookOpen },
  { id: 'template-spreadsheet', name: 'Spreadsheet Templates', icon: FileSpreadsheet },
  { id: 'template-wordpress', name: 'WordPress Themes', icon: Layout },
];

function DigitalProductCatalog() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('type') || 'all');

  useEffect(() => {
    fetchCategories();
    fetchDigitalProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchCategories = async () => {
    try {
      const response = await publicAPI.getCategories();
      const data = Array.isArray(response.data) ? response.data : [];
      if (categoryId) {
        const category = data.find(c => c.id === parseInt(categoryId));
        setSelectedCategory(category || null);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchDigitalProducts = async () => {
    try {
      let response;
      if (categoryId) {
        response = await publicAPI.getProductsByCategory(categoryId);
      } else {
        response = await publicAPI.getProducts();
      }
      const data = Array.isArray(response.data) ? response.data : [];
      // Filter digital products (ebook, template categories)
      // Handle both serviceType (camelCase from API) and service_type (snake_case)
      const digitalProducts = data.filter(p => {
        const serviceType = (p.serviceType || p.service_type || '').toLowerCase().replace(/-/g, '');
        const categorySlug = (p.category_slug || '').toLowerCase().replace(/-/g, '');
        
        return (
          serviceType.includes('ebook') ||
          serviceType.includes('template') ||
          serviceType.includes('digital') ||
          categorySlug.includes('ebook') ||
          categorySlug.includes('template') ||
          categorySlug.includes('digital')
        );
      });
      setProducts(digitalProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get product type from service_type or serviceType
  const getProductType = (product) => {
    const serviceType = (product.serviceType || product.service_type || '').toLowerCase();
    if (serviceType.includes('ebook') || serviceType.includes('e-book')) return 'ebook';
    if (serviceType.includes('spreadsheet') || serviceType.includes('excel') || serviceType.includes('sheet')) return 'template-spreadsheet';
    if (serviceType.includes('wordpress') || serviceType.includes('theme')) return 'template-wordpress';
    if (serviceType.includes('template')) return 'template';
    return 'digital-product';
  };

  // Get service type display name
  const getServiceTypeDisplay = (product) => {
    return product.serviceType || product.service_type || 'Digital';
  };

  // Filter products
  const filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    
    const productType = getProductType(product);
    return matchesSearch && productType.includes(activeFilter.replace('template-', ''));
  });

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    if (filterId === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', filterId);
    }
    setSearchParams(searchParams);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading digital products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-white/90 text-sm font-medium mb-4">
              <Download size={16} className="mr-2" />
              Instant Download
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              {selectedCategory ? selectedCategory.name : 'Digital Products'}
            </h1>
            <p className="text-lg text-primary-200 max-w-2xl mx-auto">
              {selectedCategory?.description || 'E-Books, Templates, dan produk digital berkualitas untuk kebutuhan Anda'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ebooks, templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {productTypeFilters.map((filter) => {
            const IconComponent = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`inline-flex items-center px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  activeFilter === filter.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <IconComponent size={18} className="mr-2" />
                {filter.name}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const productType = getProductType(product);
              const IconComponent = productTypeIcons[productType] || Package;
              
              return (
                <Link
                  key={product.id}
                  to={`/digital/${product.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                  {/* Image/Cover */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 relative overflow-hidden">
                    {(product.imageUrl || product.image_url) ? (
                      <img 
                        src={getImageUrl(product.imageUrl || product.image_url)} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className={`w-full h-full items-center justify-center ${(product.imageUrl || product.image_url) ? 'hidden' : 'flex'}`}>
                      <IconComponent size={56} className="text-primary-400 dark:text-primary-600" />
                    </div>
                    
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1.5 bg-white/95 dark:bg-gray-900/95 rounded-lg text-xs font-semibold text-primary-600 dark:text-secondary-400 flex items-center shadow-sm">
                        <IconComponent size={14} className="mr-1.5" />
                        {getServiceTypeDisplay(product)}
                      </span>
                    </div>

                    {/* Download indicator */}
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-1.5 bg-green-500/90 text-white rounded-lg text-xs font-medium flex items-center">
                        <Download size={12} className="mr-1" />
                        Instant
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                      {product.description || 'Digital product with instant download'}
                    </p>
                    
                    {/* Rating placeholder */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-yellow-500">
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} className="text-gray-300" />
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(4.0)</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {product.category_name}
                      </span>
                    </div>
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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No digital products found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'Try a different search term' : 'No digital products available yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DigitalProductCatalog;
