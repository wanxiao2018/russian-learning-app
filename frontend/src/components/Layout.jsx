import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: '🏠 首页' },
    { to: '/vocab', label: '📖 词汇' },
    { to: '/flashcard', label: '🃏 闪卡' },
    { to: '/quiz', label: '❓ 测验' },
    { to: '/profile', label: '👤 我的' },
  ];

  return (
    <div className="app-layout">
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🇷🇺 俄语学习</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <ThemeToggle />
          <button className="btn btn-secondary logout-btn" onClick={handleLogout}>
            🚪 退出
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="mobile-header">
        <h2>🇷🇺 俄语学习</h2>
        <div className="mobile-header-actions">
          <ThemeToggle />
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <button className="btn btn-secondary logout-btn" onClick={handleLogout}>
              🚪 退出
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{item.label.split(' ')[0]}</span>
            <span className="bottom-nav-label">{item.label.split(' ').slice(1).join(' ')}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
