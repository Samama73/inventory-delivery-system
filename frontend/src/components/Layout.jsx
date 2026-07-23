import { Link, useLocation, useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/inventory', label: 'Inventory', icon: '📦' },
    { path: '/deliveries', label: 'Delivery', icon: '🚚' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation - Graphite (Deep Slate) for ultimate professionalism */}
      <aside className="w-72 bg-slate-900 text-slate-400 flex flex-col shadow-2xl border-r border-slate-800">
        <div className="p-6 flex items-center justify-center border-b border-slate-800/80">
          <h1 className="text-xl font-extrabold tracking-widest text-white uppercase drop-shadow-sm">
             Management Portal
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-violet-600 text-white font-semibold shadow-lg shadow-violet-600/30'
                    : 'hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors duration-200"
          >
            <span className="font-medium tracking-wide">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {navItems.find((item) => item.path === location.pathname)?.label || 'Administration'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold border border-violet-200 shadow-sm">
              AD
            </div>
            <div className="text-sm">
              <p className="font-bold text-slate-800 tracking-wide">Administrator</p>
              <p className="text-slate-500 font-medium">System Operations</p>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
