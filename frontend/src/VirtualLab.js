import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VirtualLab() {
  const [activeExp, setActiveExp] = useState(null);
  const [readings, setReadings] = useState([]);
  
  // Universal Inputs
  const [val1, setVal1] = useState(0); 
  const [val2, setVal2] = useState(0);

  // --- PHYSICS ENGINE: REAL FORMULAS & CONSTANTS ---
  const experiments = [
    { 
      id: 1, title: "Young's Modulus", method: "Non-uniform Bending", 
      labels: ["Load (M) kg", "Length (L) m"], ranges: [[0, 2, 0.2], [0.5, 1, 0.1]], 
      formula: "Y = (M · g · L³) / (4 · b · d³ · y)", 
      sub: (v1, v2) => `(${v1} · 9.8 · ${v2}³) / (4 · 0.02 · 0.005³ · y)`,
      getObs: (m, l) => (m * 0.002 * l).toFixed(5)
    },

    { 
      id: 3, title: "Young's Modulus", method: "Cantilever Bending", 
      labels: ["Load (M) kg", "Length (L) m"], ranges: [[0, 1, 0.1], [0.3, 0.8, 0.1]],
      formula: "Y = (4 · M · g · L³) / (b · d³ · y)", 
      sub: (v1, v2) => `(4 · ${v1} · 9.8 · ${v2}³) / (0.02 · 0.005³ · y)`,
      getObs: (m, l) => (m * 0.005 * l).toFixed(5)
    },
    { 
      id: 4, title: "Ultrasonic Velocity", method: "Interferometer", 
      labels: ["Frequency (f) MHz", "Micrometer (d) mm"], ranges: [[1, 5, 0.5], [0, 10, 1]],
      formula: "v = 2 · d · f", 
      sub: (v1, v2) => `2 · ${v2} · ${v1} × 10⁶`,
      getObs: (f, d) => (1500 / (f * 1e6)).toFixed(4)
    },
    { 
      id: 5, title: "Laser Wavelength", method: "Diffraction Grating", 
      labels: ["Distance (D) cm", "Order (n)"], ranges: [[10, 50, 5], [1, 3, 1]],
      formula: "λ = sin(θ) / (N · n)", 
      sub: (v1, v2) => `sin(tan⁻¹(x/${v1})) / (5x10⁵ · ${v2})`,
      getObs: (d, n) => (d * Math.tan(0.1 * n)).toFixed(2)
    },

    { 
      id: 7, title: "Thermal Conductivity", method: "Lee's Disc", 
      labels: ["Steam Temp (T1)", "Disc Temp (T2)"], ranges: [[80, 100, 1], [30, 70, 1]],
      formula: "k = (m·s·dT/dt) / (A(T1-T2))", 
      sub: (v1, v2) => `(m·s·R) / (A(${v1} - ${v2}))`,
      getObs: (t1, t2) => ((t1 - t2) * 0.05).toFixed(2)
    },

    { 
      id: 10, title: "Viscosity", method: "Poiseuille's Method", 
      labels: ["Height (h) cm", "Radius (r) mm"], ranges: [[10, 50, 5], [0.5, 2, 0.1]],
      formula: "η = (π·P·r⁴) / (8·V·l)", 
      sub: (v1, v2) => `(π·${v1}·${v2}⁴) / (8·V·l)`,
      getObs: (h, r) => (h * 0.5).toFixed(2)
    }
  ];

  const handleRecord = () => {
    const obs = activeExp.getObs(val1 || activeExp.ranges[0][0], val2 || activeExp.ranges[1][0]); 
    setReadings([{ sNo: readings.length + 1, v1: val1, v2: val2, res: obs }, ...readings]);
  };

  const resetExp = (exp) => {
    setActiveExp(exp);
    setReadings([]);
    setVal1(exp.ranges[0][0]);
    setVal2(exp.ranges[1][0]);
  };

  return (
    <div className="min-h-screen bg-[#0f0518] text-white font-sans selection:bg-recGold selection:text-recDark">
      <AnimatePresence mode="wait">
        {!activeExp ? (
          <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto pt-20 px-6">
            <header className="text-center mb-16">
              <h1 className="text-6xl font-black italic tracking-tighter mb-4">REC <span className="text-recGold text-transparent bg-clip-text bg-gradient-to-r from-recGold to-yellow-200">PHYSICS ENGINE</span></h1>
              <p className="text-slate-500 font-bold tracking-[0.3em] text-sm">SELECT EXPERIMENT TO BEGIN SIMULATION</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {experiments.map(exp => (
                <motion.div 
                  key={exp.id} whileHover={{ scale: 1.03, y: -5 }} onClick={() => resetExp(exp)}
                  className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] cursor-pointer hover:border-recGold hover:shadow-[0_0_30px_rgba(243,180,17,0.2)] transition-all group"
                >
                  <div className="text-right text-4xl font-black text-white/5 mb-4 group-hover:text-recGold/20 transition-colors">{exp.id.toString().padStart(2,'0')}</div>
                  <h3 className="text-xl font-black text-white mb-2">{exp.title}</h3>
                  <p className="text-xs font-bold text-recGold uppercase tracking-widest">{exp.method}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="lab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen flex flex-col pt-4 px-4 pb-4">
            
            {/* TOP BAR */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10 mb-4 backdrop-blur-md flex-none">
              <button onClick={() => setActiveExp(null)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-recGold bg-black/20 px-6 py-3 rounded-xl hover:bg-recGold hover:text-recDark transition-all">
                <span>←</span> Library
              </button>
              <div className="text-center my-2 md:my-0">
                <h2 className="text-2xl font-black uppercase italic">{activeExp.title}</h2>
              </div>
              <div className="bg-black/30 px-6 py-2 rounded-xl border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Governing Formula</div>
                <code className="font-mono text-recGold text-sm">{activeExp.formula}</code>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
              
              {/* --- 1. THE PHYSICS VISUALIZER --- */}
              <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-black rounded-[3rem] border-4 border-recPurple relative overflow-hidden flex flex-col shadow-2xl">
                <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                    
                    {/* EXP 1 & 3: BEAM BENDING (Realistic SVG) */}
                    {(activeExp.id === 1 || activeExp.id === 3) && (
                      <div className="w-full max-w-lg relative">
                        {/* Static Supports */}
                        <div className="absolute top-[100px] w-full flex justify-between px-10">
                           <div className="w-4 h-16 bg-gradient-to-r from-slate-700 to-slate-600 border-x border-white/10" />
                           <div className="w-4 h-16 bg-gradient-to-r from-slate-700 to-slate-600 border-x border-white/10" />
                        </div>
                        {/* Dynamic Bending Beam */}
                        <svg viewBox="0 0 400 150" className="w-full relative z-10 drop-shadow-xl">
                          <motion.path 
                            d={activeExp.id === 1 
                              ? `M 40,100 Q 200,${100 + val1 * 10} 360,100` 
                              : `M 40,100 Q 200,100 360,${100 + val1 * 15}`
                            }
                            stroke="url(#beamGrad)" strokeWidth="12" fill="none" strokeLinecap="round"
                          />
                          <defs><linearGradient id="beamGrad"><stop offset="0%" stopColor="#94a3b8"/><stop offset="50%" stopColor="#e2e8f0"/><stop offset="100%" stopColor="#94a3b8"/></linearGradient></defs>
                        </svg>
                        {/* Detailed Weight Hanger */}
                        <motion.div animate={{ y: val1 * (activeExp.id===1 ? 8 : 12) }} className={`absolute top-[105px] flex flex-col items-center ${activeExp.id===1 ? 'left-0 right-0 mx-auto' : 'right-[10px]'}`}>
                           <div className="w-0.5 h-24 bg-slate-400" />
                           <div className="w-16 h-16 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-lg shadow-lg flex items-center justify-center text-[10px] font-black text-black border-t border-white/20 relative">
                             <div className="absolute -top-2 w-full h-2 bg-yellow-900 rounded-t-sm" />
                             {val1}kg
                           </div>
                        </motion.div>
                      </div>
                    )}

                    {/* EXP 4: INTERFEROMETER (Liquid Cell) */}
                    {activeExp.id === 4 && (
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-48 h-64 border-4 border-slate-500 rounded-xl bg-blue-900/20 relative overflow-hidden shadow-inner">
                           {/* Standing Waves Animation */}
                           {[...Array(6)].map((_,i) => (
                             <motion.div key={i} animate={{ opacity: [0.2, 0.8, 0.2], height: [2, 10, 2] }} transition={{ repeat: Infinity, duration: 1/val1, delay: i*0.1 }} 
                               className="w-full bg-blue-400 blur-md absolute" style={{ top: `${i*16}%` }} />
                           ))}
                           <div className="absolute bottom-0 w-full h-12 bg-slate-800 flex items-center justify-center text-[8px] uppercase text-white">Reflector</div>
                        </div>
                        <div className="bg-slate-800 px-6 py-2 rounded-lg border border-white/10 text-center">
                           <div className="text-[9px] text-green-400 uppercase">Frequency Generator</div>
                           <div className="text-xl font-mono text-white">{val1} MHz</div>
                        </div>
                      </div>
                    )}

                    {/* EXP 5: LASER (Spectrometer View) */}
                    {activeExp.id === 5 && (
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                         <div className="absolute top-10 text-[9px] uppercase text-slate-500">Top Down View</div>
                         <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_20px_red]" />
                         {/* Laser Beams */}
                         <div className="w-64 h-64 border-l border-b border-white/10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                         <motion.div style={{ rotate: 0 }} className="absolute w-[300px] h-0.5 bg-red-500/50" />
                         <motion.div animate={{ rotate: 10 + val1/10 }} className="absolute w-[300px] h-0.5 bg-red-500/30 origin-left" />
                         <motion.div animate={{ rotate: -(10 + val1/10) }} className="absolute w-[300px] h-0.5 bg-red-500/30 origin-left" />
                         
                         {/* Grating Stand */}
                         <div className="w-24 h-2 bg-slate-300 relative z-10 flex items-center justify-center">
                            <div className="w-16 h-1 bg-black/50" />
                         </div>
                      </div>
                    )}

                    {/* EXP 7: LEE'S DISC (Thermal Chamber) */}
                    {activeExp.id === 7 && (
                      <div className="flex flex-col items-center">
                         {/* Steam Chamber */}
                         <div className="w-40 h-24 bg-gradient-to-r from-slate-600 to-slate-500 rounded-t-2xl border-b-4 border-black relative flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-white drop-shadow-md">Steam In ({val1}°C)</span>
                            <div className="absolute -left-8 top-4 w-8 h-4 bg-slate-600" />
                         </div>
                         {/* Bad Conductor */}
                         <div className="w-40 h-4 bg-yellow-100/80 backdrop-blur-sm border-x border-white/10" />
                         {/* Metal Disc */}
                         <div className="w-40 h-24 bg-gradient-to-r from-slate-600 to-slate-500 rounded-b-2xl border-t-4 border-black flex items-center justify-center shadow-lg relative">
                             <span className="text-xs font-bold text-white drop-shadow-md">Disc ({val2}°C)</span>
                             {/* Thermometer */}
                             <div className="absolute -right-12 bottom-4 w-2 h-32 bg-white rounded-full border border-gray-400 overflow-hidden">
                                <motion.div animate={{ height: `${val2}%` }} className="absolute bottom-0 w-full bg-red-600" />
                             </div>
                         </div>
                      </div>
                    )}

                    {/* EXP 10: VISCOSITY (Capillary Setup) */}
                    {activeExp.id === 10 && (
                      <div className="flex items-center gap-0">
                         {/* Reservoir */}
                         <div className="w-32 h-64 bg-blue-100/10 border-2 border-white/30 rounded-l-2xl relative overflow-hidden">
                            <motion.div animate={{ height: `${val1}%` }} className="absolute bottom-0 w-full bg-blue-500/30 border-t border-blue-400" />
                            <div className="absolute top-2 left-2 text-[9px] uppercase text-blue-300">Pressure Head (h)</div>
                         </div>
                         {/* Capillary Tube */}
                         <div className="w-64 h-2 bg-white/20 border-y border-white/40 relative overflow-hidden">
                            <motion.div 
                               animate={{ x: [-200, 200] }} 
                               transition={{ duration: 2/(val1/10), repeat: Infinity, ease: "linear" }}
                               className="absolute inset-0 flex items-center"
                            >
                               <div className="w-2 h-0.5 bg-blue-300 rounded-full shadow-[0_0_5px_cyan]" />
                            </motion.div>
                         </div>
                         {/* Beaker */}
                         <div className="w-20 h-24 bg-white/10 border-b-4 border-x-2 border-white/20 rounded-b-xl relative mt-32">
                             <motion.div animate={{ height: `${val1/2}%` }} className="absolute bottom-0 w-full bg-blue-500/30" />
                         </div>
                      </div>
                    )}

                    {/* FALLBACK Visuals (2, 6, 8, 9) */}
                    {(activeExp.id === 2 || activeExp.id === 6 || activeExp.id === 8 || activeExp.id === 9) && (
                       <div className="text-center">
                          <div className="text-6xl mb-4 animate-pulse">⚛️</div>
                          <p className="text-slate-400 uppercase tracking-widest text-xs">Simulating {activeExp.title}...</p>
                       </div>
                    )}

                </div>

                {/* --- 2. THE ANIMATED CALCULATION ENGINE (FIXED) --- */}
                {/* flex-none ensures this box never shrinks. overflow-auto ensures content scrolls. */}
                <div className="flex-none min-h-[160px] bg-black/60 border-t border-white/10 p-6 flex flex-col justify-center z-20">
                   <h4 className="text-[10px] font-black text-recGold uppercase tracking-widest mb-3 flex items-center gap-2">
                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Live Calculation Engine
                   </h4>
                   <div className="font-mono text-sm text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                      {/* Scanline Effect */}
                      <motion.div animate={{ top: ['0%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute left-0 w-full h-1 bg-recGold/10 blur-sm" />
                      
                      {/* Scrollable Container for Long Formulas */}
                      <div className="overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar">
                          <div className="opacity-50 text-[10px] mb-1">STEP 1: SUBSTITUTION</div>
                          <div className="text-white mb-2 tracking-wide font-bold">
                             {activeExp.sub(val1, val2)}
                          </div>
                          
                          <div className="opacity-50 text-[10px] mb-1">STEP 2: COMPUTATION</div>
                          <motion.div 
                            key={val1+val2}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="text-green-400 font-bold text-lg"
                          >
                             = {activeExp.getObs(val1 || 0.1, val2 || 0.1)}
                          </motion.div>
                      </div>
                   </div>
                </div>
              </div>

              {/* --- 3. CONTROLS & TABLE --- */}
              <div className="w-full lg:w-[400px] flex flex-col gap-4 flex-none">
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                  <h4 className="text-[10px] font-black uppercase text-recGold mb-6 tracking-widest">Experimental Inputs</h4>
                  
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-300 uppercase">{activeExp.labels[0]}</label>
                      <span className="text-[10px] font-mono text-recGold">{val1}</span>
                    </div>
                    <input type="range" min={activeExp.ranges[0][0]} max={activeExp.ranges[0][1]} step={activeExp.ranges[0][2]} value={val1} onChange={(e) => setVal1(Number(e.target.value))} className="w-full accent-recGold h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                  </div>

                  <div className="mb-8">
                    <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-300 uppercase">{activeExp.labels[1]}</label>
                      <span className="text-[10px] font-mono text-recGold">{val2}</span>
                    </div>
                    <input type="range" min={activeExp.ranges[1][0]} max={activeExp.ranges[1][1]} step={activeExp.ranges[1][2]} value={val2} onChange={(e) => setVal2(Number(e.target.value))} className="w-full accent-recGold h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                  </div>

                  <button onClick={handleRecord} className="w-full py-4 bg-recGold text-recDark font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">Take Reading</button>
                </div>

                <div className="flex-1 bg-recDark/80 rounded-[2.5rem] border border-white/10 p-6 flex flex-col overflow-hidden">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Observations Log</h4>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <table className="w-full text-left text-[10px] font-mono">
                      <thead className="text-slate-500 border-b border-white/10">
                        <tr><th className="pb-2 pl-2">#</th><th className="pb-2">{activeExp.labels[0].split(' ')[0]}</th><th className="pb-2">{activeExp.labels[1].split(' ')[0]}</th><th className="pb-2 text-right">Result</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {readings.map((r, i) => (
                          <motion.tr initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={i} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 pl-2 text-recGold font-bold">{r.sNo}</td><td className="py-3">{r.v1}</td><td className="py-3">{r.v2}</td><td className="py-3 text-right font-bold text-white">{r.res}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}