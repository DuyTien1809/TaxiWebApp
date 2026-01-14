import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="gradient-primary shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🚕</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              TaxiGo
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'CUSTOMER' && (
                  <>
                    <NavLink to="/customer/booking" icon="🚗" text="Đặt xe" />
                    <NavLink to="/customer/trips" icon="📋" text="Chuyến đi" />
                  </>
                )}
                {user.role === 'DRIVER' && (
                  <NavLink to="/driver" icon="🛣️" text="Dashboard" />
                )}
                {user.role === 'ADMIN' && (
                  <NavLink to="/admin" icon="📊" text="Quản lý" />
                )}
                
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
                  <Link to="/profile" className="text-right hover:opacity-80 transition-opacity cursor-pointer">
                    <p className="text-white font-medium text-sm">{user.name}</p>
                    <p className="text-white/70 text-xs">{user.role}</p>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 group"
                  >
                    <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300">
                  Đăng nhập
                </Link>
                <Link to="/register" className="px-5 py-2 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300">
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            {user ? (
              <div className="space-y-2">
                {user.role === 'CUSTOMER' && (
                  <>
                    <MobileNavLink to="/customer/booking" icon="🚗" text="Đặt xe" onClick={() => setIsMenuOpen(false)} />
                    <MobileNavLink to="/customer/trips" icon="📋" text="Chuyến đi" onClick={() => setIsMenuOpen(false)} />
                  </>
                )}
                {user.role === 'DRIVER' && (
                  <MobileNavLink to="/driver" icon="🛣️" text="Dashboard" onClick={() => setIsMenuOpen(false)} />
                )}
                {user.role === 'ADMIN' && (
                  <MobileNavLink to="/admin" icon="📊" text="Quản lý" onClick={() => setIsMenuOpen(false)} />
                )}
                <MobileNavLink to="/profile" icon="👤" text="Thông tin cá nhân" onClick={() => setIsMenuOpen(false)} />
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-white/90 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-3"
                >
                  <span>🚪</span> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <MobileNavLink to="/login" icon="🔑" text="Đăng nhập" onClick={() => setIsMenuOpen(false)} />
                <MobileNavLink to="/register" icon="✨" text="Đăng ký" onClick={() => setIsMenuOpen(false)} />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, icon, text }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-all duration-300 flex items-center gap-2"
    >
      <span>{icon}</span>
      <span>{text}</span>
    </Link>
  );
}

function MobileNavLink({ to, icon, text, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-3 text-white/90 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-3"
    >
      <span>{icon}</span>
      <span>{text}</span>
    </Link>
  );
}
