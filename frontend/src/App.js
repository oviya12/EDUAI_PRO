import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import FacultyDashboard from './FacultyDashboard';
import StudentDashboard from './StudentDashboard';
import VirtualLab from './VirtualLab';
import LandingPage from './LandingPage';
import StudentLogin from './StudentLogin';
import FacultyLogin from './FacultyLogin';
import Navbar from './Navbar';

// We create a wrapper component so we can use the 'useLocation' hook
function AppContent() {
  const location = useLocation();
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("edu_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("isDarkMode") === "true";
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("isDarkMode", newMode);
    document.documentElement.classList.toggle("dark", newMode);
  };

  const hideNavbarPaths = ["/login-student", "/login-faculty"];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);
  const isLandingPage = location.pathname === "/";

  return (
    <div className="w-full min-h-screen">
      {shouldShowNavbar && <Navbar user={user} setUser={setUser} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      
      {/* We remove 'container mx-auto' and 'py-8' here. 
          If you want your Dashboards to still have padding, 
          we apply it conditionally or inside those components.
      */}
      <main className={isLandingPage ? "w-full" : "flex-1 overflow-auto"}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login-student" element={<StudentLogin setUser={setUser} />} />
          <Route path="/login-faculty" element={<FacultyLogin setUser={setUser}/>} />
          <Route path="/faculty" element={<FacultyDashboard  />} />
          <Route path="/student" element={<StudentDashboard  />} />
          <Route path="/virtual-lab" element={<VirtualLab  />} />
        </Routes>
      </main>
    </div>
  );
}


function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;