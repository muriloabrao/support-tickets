import React, { useState } from 'react';
import { Phone, Server, List, PlusCircle, LogOut, Menu, X, ChevronRight, BarChart3 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const AGENT_EMAILS = ['helder.filho@grupoep.com.br'];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/'));
  };

  const isActive = (path: string) => location.pathname === path;

  const isAgent = auth.currentUser ? AGENT_EMAILS.includes(auth.currentUser.email || '') : false;

  const navItems = [
    { path: '/dashboard', label: 'Meus Chamados', icon: List },
    { path: '/novo-chamado', label: 'Novo Chamado', icon: PlusCircle },
    ...(isAgent ? [{ path: '/relatorios', label: 'Relatórios', icon: BarChart3 }] : []),
  ];

  const systems = [
    { name: 'Plandoc', status: 'Operacional' },
    { name: 'Mylims Producer', status: 'Operacional' },
    { name: 'Mylims Consumer', status: 'Operacional' },
  ];

  const sidebarContent = (
    <>
      {/* — Logo — */}
      <div className="px-5 pt-7 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ backgroundColor: 'hsl(197 68% 30%)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4.5C2 3.67 2.67 3 3.5 3H12.5C13.33 3 14 3.67 14 4.5V6H2V4.5Z" fill="white" opacity="0.9"/>
              <rect x="2" y="6" width="12" height="7" rx="0.5" fill="white" opacity="0.7"/>
              <line x1="5" y1="8.5" x2="11" y2="8.5" stroke="white" strokeWidth="1" opacity="0.5"/>
              <line x1="5" y1="10.5" x2="9" y2="10.5" stroke="white" strokeWidth="1" opacity="0.5"/>
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: 'hsl(224 71% 4%)' }}>
              EP Resolve
            </span>
            <span className="block text-[10px] font-medium" style={{ color: 'hsl(220 9% 46%)' }}>
              Service Desk
            </span>
          </div>
        </div>
      </div>

      {/* — Primary Navigation — */}
      <nav className="px-3 mt-6 flex flex-col gap-0.5">
        <span className="section-label px-3 mb-2">Menu</span>
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={`nav-item ${isActive(path) ? 'nav-item--active' : ''}`}
          >
            <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
            <span className="flex-1">{label}</span>
            {isActive(path) && (
              <ChevronRight className="w-3.5 h-3.5 opacity-50" strokeWidth={2} />
            )}
          </Link>
        ))}
      </nav>

      {/* — Systems Status — */}
      <div className="px-3 mt-8 hidden lg:block">
        <span className="section-label px-3 mb-3 block">Sistemas</span>
        <div className="px-3 flex flex-col gap-2.5">
          {systems.map((sys) => (
            <div key={sys.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="status-dot status-dot--ok" />
                <span className="text-[13px]" style={{ color: 'hsl(224 71% 4%)' }}>
                  {sys.name}
                </span>
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'hsl(142 71% 45%)' }}>
                {sys.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* — Contact — */}
      <div className="px-3 mt-8 hidden lg:block">
        <span className="section-label px-3 mb-3 block">Contato</span>
        <div className="px-3">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Phone className="w-3.5 h-3.5" strokeWidth={1.8} style={{ color: 'hsl(220 9% 46%)' }} />
            <span className="text-[12px]" style={{ color: 'hsl(220 9% 46%)' }}>
              Emergências
            </span>
          </div>
          <a
            href="mailto:ti@grupoep.com.br"
            className="text-[13px] font-medium transition-colors duration-150"
            style={{ color: 'hsl(197 68% 30%)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(197 68% 22%)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(197 68% 30%)')}
          >
            ti@grupoep.com.br
          </a>
        </div>
      </div>

      {/* — Spacer + Logout — */}
      <div className="mt-auto px-3 pb-5">
        <div className="border-t mb-3" style={{ borderColor: 'hsl(220 13% 91%)' }} />
        <button onClick={handleLogout} className="logout-btn">
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row">
      {/* — Mobile Header — */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b"
           style={{ backgroundColor: 'hsl(220 20% 99%)', borderColor: 'hsl(220 13% 91%)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center"
               style={{ backgroundColor: 'hsl(197 68% 30%)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4.5C2 3.67 2.67 3 3.5 3H12.5C13.33 3 14 3.67 14 4.5V6H2V4.5Z" fill="white" opacity="0.9"/>
              <rect x="2" y="6" width="12" height="7" rx="0.5" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ color: 'hsl(224 71% 4%)' }}>
            EP Resolve
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-150"
          style={{ color: 'hsl(220 9% 46%)' }}
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X className="w-5 h-5" strokeWidth={1.8} /> : <Menu className="w-5 h-5" strokeWidth={1.8} />}
        </button>
      </div>

      {/* — Mobile Overlay — */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'hsl(224 71% 4% / 0.3)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* — Sidebar — */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 sidebar-surface flex flex-col
          transition-transform duration-300 ease-out
          lg:sticky lg:top-0 lg:h-[100dvh] lg:w-[var(--sidebar-width)] lg:translate-x-0 lg:shrink-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* — Main Content — */}
      <main className="flex-1 min-w-0 p-4 lg:p-8">
        <div className="content-surface p-6 lg:p-10 min-h-[calc(100dvh-4rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
