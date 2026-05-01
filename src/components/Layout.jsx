import { Link, Outlet, useLocation } from 'react-router-dom';
import { QrCode, LayoutDashboard } from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          TEDx<span className="text-tedx-red">AJCE</span>
        </div>
        <nav className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <QrCode size={18} /> Scanner
          </Link>
          <Link 
            to="/dashboard" 
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </Link>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
