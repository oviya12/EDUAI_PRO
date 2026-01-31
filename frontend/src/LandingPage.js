import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const Typewriter = ({ text, delay = 150 }) => {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{currentText}</span>;
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 pt-16 overflow-hidden bg-white dark:bg-[#1a0b2e]">
      {/* --- BACKGROUND ANIMATIONS --- */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-recPurple/30 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-recDark/50 rounded-full blur-[150px]"
        />
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #F3B411 1px, transparent 0)`, backgroundSize: '32px 32px' }}>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-6xl text-center flex flex-col justify-center flex-grow px-4"
      >
        <div className="mb-12">
          <h1 className="text-5xl md:text-7xl font-black text-black dark:text-white tracking-tighter mb-4">
            <Typewriter text="EduAI " />
            <span className="text-recGold drop-shadow-[0_0_20px_rgba(243,180,17,0.4)]">Pro</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl font-medium tracking-wide max-w-xl mx-auto">
            Next-gen intelligence for <span className="text-recGold font-bold italic">Rajalakshmi Engineering College</span> students and faculty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 max-w-4xl mx-auto">
          <motion.div 
            whileHover={{ y: -20, scale: 1.02 }}
            className="group relative bg-white/80 backdrop-blur-20xl p-10 rounded-[3rem] border border-black/15 cursor-pointer overflow-hidden transition-all" 
            onClick={() => navigate('/login-faculty')}
          >
            <div className="bg-gradient-to-br from-recPurple to-recDark text-black w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-xl">👨‍🏫</div>
            <h2 className="text-2xl font-black text-black mb-2 text-left tracking-tight">Faculty Portal</h2>
            <p className="text-slate-400 text-left text-sm font-medium leading-relaxed mb-8">Sync syllabus to AI and monitor real-time student analytics.</p>
            <div className="flex items-center gap-2 font-black text-recGold uppercase tracking-[0.2em] text-[10px]">
              Login here <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -20, scale: 1.02 }}
            className="group relative bg-recDark backdrop-blur-2xl p-10 rounded-[3rem] border border-recGold/20 cursor-pointer overflow-hidden transition-all" 
            onClick={() => navigate('/login-student')}
          >
            <div className="bg-recGold text-recDark w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-yellow-500/20">🎓</div>
            <h2 className="text-2xl font-black text-white mb-2 text-left tracking-tight">Student Portal</h2>
            <p className="text-slate-300 text-left text-sm font-medium leading-relaxed mb-8">Your personal AI tutor trained on your specific curriculum.</p>
            <div className="flex items-center gap-2 font-black text-recGold uppercase tracking-[0.2em] text-[10px]">
              START LEARNING <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}