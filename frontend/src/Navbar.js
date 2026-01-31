import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, setUser, isDarkMode, toggleDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userRole = localStorage.getItem("edu_role"); 
  const dashboardLink = userRole === 'faculty' ? '/faculty' : '/student';
  const handleLogout = () => {
    localStorage.removeItem("edu_user");
    localStorage.removeItem("edu_role");
    setUser(null);
    navigate('/');
  };

  console.log("Navbar Rendered - isLanding:", isLanding, "User:", user, "Dashboard Link:", dashboardLink);


  return (
    <nav className={`top-0 w-full z-50 px-4 md:px-8 py-4 flex justify-between items-center transition-all ${
      isLanding ? 'fixed bg-transparent border-none' : 'sticky bg-white dark:bg-gray-900 dark:border-gray-700 border-b border-slate-200'
    }`}>
      {/* LEFT CORNER: College Logo & Site Title */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/images.png" 
            alt="REC Logo" 
            className="h-10 w-auto object-contain" 
          />
        </Link>
      </div>

      {/* RIGHT CORNER: Navigation, Deer Image, and Profile */}
      <div className="hidden md:flex items-center gap-6">
        {!isLanding && (
          <div className="flex gap-6 font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-300">
            <Link to="/virtual-lab" className="text-recPurple dark:text-recGold hover:text-recDark dark:hover:text-recGold transition-colors">🔬 Virtual Lab</Link>
            <Link to={dashboardLink} className="text-slate-600 dark:text-slate-300 hover:text-recPurple dark:hover:text-recGold transition-colors">Dashboard</Link>
          </div>
        )}

        <button 
          onClick={toggleDarkMode}
          className="bg-gray-200 dark:bg-purple-600 text-gray-800 dark:text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-purple-700 transition-all"
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>

        <img 
          src="/deer.jpg" 
          alt="Secondary Logo" 
          className="h-10 w-auto object-contain rounded-lg border border-slate-100 shadow-sm" 
        />

        {!isLanding && (
          <div className="flex items-center gap-3 border-l pl-6 border-slate-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-recPurple dark:text-recGold uppercase leading-none">
                {user || "Guest User"}
              </p>
            </div>
            <div className="w-10 h-10 bg-recPurple rounded-xl flex items-center justify-center text-recGold font-black shadow-lg border-2 border-recGold">
              {user ? user.charAt(0).toUpperCase() : "?"}
            </div>
            <button 
              onClick={handleLogout}
              className="text-rose-500 dark:text-rose-400 font-bold text-xs uppercase hover:bg-rose-50 dark:hover:bg-rose-900/30 px-2 py-1 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-gray-800 dark:text-white focus:outline-none"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 md:hidden">
          {!isLanding && (
            <div className="flex flex-col gap-4 font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-300">
              <Link to="/virtual-lab" className="text-recPurple dark:text-recGold hover:text-recDark dark:hover:text-recGold transition-colors">🔬 Virtual Lab</Link>
              <Link to={dashboardLink} className="text-slate-600 dark:text-slate-300 hover:text-recPurple dark:hover:text-recGold transition-colors">Dashboard</Link>
            </div>
          )}

          <button 
            onClick={toggleDarkMode}
            className="w-full bg-gray-200 dark:bg-purple-600 text-gray-800 dark:text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-purple-700 transition-all mt-4"
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>

          {!isLanding && (
            <div className="flex items-center gap-3 border-t pt-4 mt-4 border-slate-200">
              <div className="w-10 h-10 bg-recPurple rounded-xl flex items-center justify-center text-recGold font-black shadow-lg border-2 border-recGold">
                {user ? user.charAt(0).toUpperCase() : "?"}
              </div>
              <button 
                onClick={handleLogout}
                className="text-rose-500 font-bold text-xs uppercase hover:bg-rose-50 px-2 py-1 rounded-lg transition-all"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}