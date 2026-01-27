import {
  BookOpen,
  FolderOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DarkModeToggle from '../DarkModeToggle';

function Navbar({ isAdmin = false, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const publicLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/products', label: 'Game Top-Up', icon: Store },
    { to: '/digital', label: 'Digital Products', icon: BookOpen },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
    { to: '/admin/products', label: 'Game Products', icon: Package },
    { to: '/admin/digital-products', label: 'Digital Products', icon: BookOpen },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/admin/promo', label: 'Promo Codes', icon: Tag },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const links = isAdmin ? adminLinks : publicLinks;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">

            <img src="/twenti-studio-v2.png" alt="GameTwenti" className="w-15 h-12" />
            <div className="hidden sm:block">
              <span className="text-4xl font-bold text-primary-600 dark:text-white">
                Game
              </span>
              <span className="text-4xl font-bold text-secondary-500">Twenti</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${isActive(link.to) 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-secondary-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            
            {isAdmin && (
              <button 
                onClick={onLogout} 
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 ml-2"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            <DarkModeToggle />
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200
                    ${isActive(link.to) 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-secondary-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            
            {isAdmin && (
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
