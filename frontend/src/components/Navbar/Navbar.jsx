import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ handleLogout }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check auth status whenever the component mounts or localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      setIsAuthenticated(!!user);
    };

    checkAuth();

    // Listen for storage events (changes from other tabs)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      // Clear all auth-related data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // If a custom logout handler was provided, use it
      if (typeof handleLogout === 'function') {
        handleLogout();
      }
      
      // Force reload to reset all component states
      window.location.href = '/auth';
      window.location.reload();
    } else {
      navigate('/auth');
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="nav-brand">
          <span className="logo-icon">📊</span>
          <h1 className="logo-text">KanbanFlow</h1>
        </div>
        
        {isAuthenticated && (
          <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              <span className="link-icon">🏠</span>
              <span className="link-text">Dashboard</span>
            </Link>
            <Link to="/progress" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              <span className="link-icon">📈</span>
              <span className="link-text">Progress</span>
            </Link>
          </div>
        )}
        
        <div className="nav-actions">
          <button 
            className={`auth-btn ${isAuthenticated ? "logout" : "login"}`} 
            onClick={handleAuthClick}
          >
            {isAuthenticated ? (
              <>
                <span className="btn-icon">🚪</span>
                <span className="btn-text">Logout</span>
              </>
            ) : (
              <>
                <span className="btn-icon">🔑</span>
                <span className="btn-text">Login</span>
              </>
            )}
          </button>
        </div>
        
        {isAuthenticated && (
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;