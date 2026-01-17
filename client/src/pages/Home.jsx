import { ArrowRight, Clock, Gamepad2, Headphones, Shield, Tv, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../utils/api';

// Map category icons
const categoryIcons = {
  'game': Gamepad2,
  'digital-subscription': Tv,
  'social-media-services': Users,
};

function Home() {
  const [data, setData] = useState({ categories: [], featuredProducts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      const response = await publicAPI.getHomepage();
      setData(response.data);
    } catch (error) {
      console.error('Error fetching homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-primary-600 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* Accent Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary-500 opacity-20 transform skew-x-12 translate-x-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-white/90 text-sm font-medium mb-6">
                <Shield size={16} className="mr-2" />
                Trusted by 10,000+ customers
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Top-up Game &<br />
                <span className="text-secondary-400">Digital Services</span>
              </h1>
              <p className="text-lg text-primary-100 mb-8 max-w-lg">
                Platform terpercaya untuk semua kebutuhan digital Anda. Top-up game, langganan streaming, dan layanan media sosial dengan harga terbaik.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/products" 
                  className="btn btn-secondary btn-lg group"
                >
                  Browse Products
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/products" 
                  className="btn btn-lg bg-white/10 hover:bg-white/20 text-white border-2 border-white/30"
                >
                  View Categories
                </Link>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center mb-4">
                  <Clock size={24} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">24/7</h3>
                <p className="text-primary-200">Fast Processing</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mt-8">
                <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center mb-4">
                  <Shield size={24} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">100%</h3>
                <p className="text-primary-200">Secure Payment</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center mb-4">
                  <Users size={24} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">10K+</h3>
                <p className="text-primary-200">Happy Customers</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mt-8">
                <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center mb-4">
                  <Headphones size={24} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">Live</h3>
                <p className="text-primary-200">Customer Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">
              Shop by <span className="text-secondary-500">Category</span>
            </h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              Temukan berbagai produk dan layanan digital berkualitas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.categories.map((category) => {
              const IconComponent = categoryIcons[category.slug] || Gamepad2;
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  {/* Accent Border */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-secondary-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  
                  <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary-100 dark:group-hover:bg-secondary-900/30 transition-colors">
                    <IconComponent size={32} className="text-primary-600 dark:text-primary-400 group-hover:text-secondary-500 transition-colors" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {category.description || 'Browse products in this category'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="badge badge-primary">
                      {category.product_count} {category.product_count === 1 ? 'product' : 'products'}
                    </span>
                    <ArrowRight size={20} className="text-gray-400 group-hover:text-secondary-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {data.featuredProducts.length > 0 && (
        <section className="py-16 lg:py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
              <div>
                <h2 className="section-title">
                  Featured <span className="text-secondary-500">Products</span>
                </h2>
                <p className="section-subtitle">
                  Produk populer pilihan pelanggan kami
                </p>
              </div>
              <Link 
                to="/products" 
                className="mt-4 md:mt-0 inline-flex items-center text-primary-600 dark:text-secondary-400 font-semibold hover:underline"
              >
                View All Products
                <ArrowRight size={18} className="ml-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 relative overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 size={48} className="text-primary-400 dark:text-primary-600" />
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 rounded-full text-xs font-semibold text-primary-600 dark:text-secondary-400">
                        {product.category_name}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {product.description || 'Click to view details and available packages'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-primary-200 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and experience the best digital marketplace in Indonesia
          </p>
          <Link 
            to="/products" 
            className="btn btn-secondary btn-lg"
          >
            Browse All Products
            <ArrowRight size={20} className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
