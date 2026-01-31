import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// --- SIMULATION CARD COMPONENT ---
const SimulationCard = ({ sim }) => {
  const [showFrame, setShowFrame] = useState(false);
  return (
    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-xl border-l-4 border-indigo-500 shadow-sm animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-2 gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-2xl flex-shrink-0">🧪</span>
          <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">Interactive Lab</p>
              <h4 className="font-bold text-indigo-700 dark:text-indigo-400 truncate text-sm md:text-base">{sim.title}</h4>
          </div>
        </div>
        {!showFrame && (
            <button onClick={() => setShowFrame(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex-shrink-0">
              Launch Simulation
            </button>
        )}
      </div>
      {showFrame && (
          <div className="mt-2 w-full h-[350px] md:h-[450px] bg-black rounded-lg overflow-hidden border border-gray-300 relative">
              <iframe src={sim.url} className="w-full h-full border-none" title={sim.title} allowFullScreen></iframe>
              <button onClick={() => setShowFrame(false)} className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-md hover:bg-red-700">Close</button>
          </div>
      )}
    </div>
  );
};

export default function StudentDashboard() {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);

  // --- QUIZ STATES (NEW ADDITION) ---
  const [xp, setXp] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const chatEndRef = useRef(null);
const chatContainerRef = useRef(null); // <--- ADD THIS 1/3
const scrollToBottom = () => {
    if (chatContainerRef.current) {
        // This safely scrolls ONLY the chat container, not the whole page
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
};

useEffect(() => {
    scrollToBottom();
}, [chat, loading]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://ovi108-eduai.hf.space/faculty/units");
        if (res.data?.length > 0) { setUnits(res.data); setSelectedUnit(res.data[0]); }
        setIsSidebarLoading(false);

        // Fetch XP
        const stats = await axios.get("https://ovi108-eduai.hf.space/student/stats");
        setXp(stats.data.xp || 0);
      } catch (e) { console.error("Init Error", e); }
    };
    fetchData();
  }, []);

  const askAI = async () => {
    if (!question.trim() || !selectedUnit) return;
    setLoading(true);
    const updatedChat = [...chat, { role: 'user', text: question }];
    setChat(updatedChat);
    const currentInput = question;
    setQuestion("");

    const formData = new FormData();
    formData.append("question", currentInput);
    formData.append("unit", selectedUnit);
    formData.append("history", JSON.stringify(updatedChat));

    try {
      const res = await axios.post("https://ovi108-eduai.hf.space/student/ask", formData);
      setChat([...updatedChat, { role: 'ai', text: res.data.answer, simulation: res.data.simulation }]);
    } catch (err) { setChat([...updatedChat, { role: 'ai', text: "Error connecting." }]); }
    setLoading(false);
  };

  const handleRefreshContext = () => {
    if(window.confirm("Clear Conversation?")) { setChat([]); setQuestion(""); }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading && question.trim() && selectedUnit) {
      e.preventDefault(); askAI();
    }
  };

  // --- QUIZ HANDLERS ---
  const startQuiz = async () => {
    if (!selectedUnit) return alert("Select a unit first!");
    setQuizLoading(true); setShowQuiz(true); setQuizFinished(false);
    setQuizScore(0); setCurrentQIndex(0);

    const formData = new FormData();
    formData.append("unit", selectedUnit);
    try {
        const res = await axios.post("https://ovi108-eduai.hf.space/student/quiz/generate", formData);
        if (res.data.quiz) setQuizQuestions(res.data.quiz);
        else { alert("Quiz Gen Failed"); setShowQuiz(false); }
    } catch (e) { alert("Error starting quiz"); setShowQuiz(false); }
    setQuizLoading(false);
  };

  const handleAnswer = (selectedOption) => {
    const currentQ = quizQuestions[currentQIndex];
    if (selectedOption === currentQ.answer) setQuizScore(prev => prev + 10);
    
    if (currentQIndex + 1 < quizQuestions.length) setCurrentQIndex(prev => prev + 1);
    else finishQuiz();
  };

  const finishQuiz = async () => {
    setQuizFinished(true);
    const finalScore = quizScore + (quizQuestions[quizQuestions.length-1].answer === quizQuestions[currentQIndex]?.answer ? 10 : 0); // Check last Q logic
    setXp(prev => prev + finalScore);
    
    const formData = new FormData();
    formData.append("unit", selectedUnit);
    formData.append("score", finalScore);
    await axios.post("https://ovi108-eduai.hf.space/student/quiz/submit", formData);
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#1a0b2e] transition-colors duration-300">
      <div className="flex flex-col md:flex-row gap-8 w-full h-screen pt-24 p-8 overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-96 flex flex-col gap-4 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-gray-700 flex flex-col h-full">
            
            {/* XP BADGE (NEW) */}
            <div className="mb-6 bg-gradient-to-r from-amber-400 to-orange-500 p-4 rounded-xl text-white shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold uppercase opacity-80">Total Score</p>
                    <h3 className="text-2xl font-black">{xp} XP</h3>
                </div>
                <div className="text-3xl">🏆</div>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
               <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">Modules</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {isSidebarLoading ? <p>Loading...</p> : units.map((unit, index) => (
                    <button key={index} onClick={() => setSelectedUnit(unit)} className={`w-full text-left px-4 py-2 rounded-lg font-medium ${selectedUnit === unit ? "bg-indigo-600 text-white shadow-md" : "bg-gray-100 text-gray-800"}`}>
                    {unit}
                    </button>
                ))}
            </div>

            <div className="space-y-3 mt-4">
                {/* QUIZ BUTTON (NEW) */}
                <button onClick={startQuiz} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-indigo-200 shadow-lg transition-all flex items-center justify-center gap-2">
                    <span>⚡</span> Rapid Quiz
                </button>
                <button onClick={handleRefreshContext} className="w-full py-4 rounded-2xl border-2 border-rose-100 dark:border-rose-900/50 text-rose-600 font-bold hover:bg-rose-50 transition-all">
                    Clear Context
                </button>
            </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 rounded-[2rem] shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col min-h-0 relative">
        <h2 className="text-lg font-black text-slate-800 dark:text-white mb-4">Chat with AI Tutor</h2>
        <div 
    ref={chatContainerRef}  
    className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-4 scroll-smooth"
>
          {chat.length === 0 && (
             <div className="flex items-center justify-center h-full text-center">
               <div className="text-slate-400 dark:text-slate-500">
                 <p className="text-lg font-semibold">👋 Ready to learn?</p>
                 <p className="text-sm">Select a unit to start chatting or taking quizzes!</p>
               </div>
             </div>
          )}
          {chat.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`${message.role === "user" ? "max-w-md md:max-w-xl bg-indigo-600 text-white rounded-br-none shadow-lg" : "max-w-lg md:max-w-2xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700 shadow-md"} px-4 py-3 rounded-2xl`}>
                {message.role === "ai" && <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase">AI Tutor</p>}
                
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown
                    children={message.text}
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-indigo-600 dark:text-indigo-400 font-bold text-lg mt-4 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-slate-800 dark:text-white" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-4 text-gray-700 dark:text-gray-300" {...props} />,
                      li: ({node, ...props}) => <li className="marker:text-indigo-500" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-gray-700 dark:text-gray-300" {...props} />,
                      code: ({node, inline, ...props}) => inline ? <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-rose-500 font-mono text-xs" {...props} /> : <div className="overflow-x-auto my-4 rounded-lg bg-gray-900 p-4 text-white"><code {...props} /></div>
                    }}
                  />
                </div>
                {message.simulation && <SimulationCard sim={message.simulation} />}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border"><div className="flex gap-2"><div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"/><div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-100"/><div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-200"/></div></div></div>}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-4 flex items-end gap-3">
          <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyPress={handleKeyPress} placeholder="Shoot your doubts..." className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none" />
          <button onClick={askAI} disabled={!selectedUnit || loading || !question.trim()} className={`p-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex-shrink-0 ${!selectedUnit || loading || !question.trim() ? "bg-slate-300 cursor-not-allowed" : "bg-indigo-600 text-white"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>

        {/* --- QUIZ MODAL (NEW) --- */}
        {showQuiz && (
            <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm rounded-[2rem] flex items-center justify-center p-8 animate-in fade-in">
                {quizLoading ? (
                    <div className="text-white text-center">
                        <div className="text-4xl animate-bounce mb-4">🧠</div>
                        <h3 className="text-xl font-bold">Generating Quiz...</h3>
                        <p className="text-slate-400">Reading {selectedUnit} material</p>
                    </div>
                ) : quizFinished ? (
                    <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl max-w-lg w-full text-center shadow-2xl animate-in zoom-in">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Quiz Complete!</h2>
                        <p className="text-slate-500 mb-6">You earned</p>
                        <div className="text-5xl font-black text-indigo-600 mb-8">+{quizScore} XP</div>
                        <button onClick={() => setShowQuiz(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:scale-105 transition-transform">Back to Learning</button>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl max-w-2xl w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full">Question {currentQIndex + 1}/{quizQuestions.length}</span>
                            <span className="text-xs font-bold text-slate-400">Score: {quizScore}</span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8 leading-relaxed">
                            {quizQuestions[currentQIndex]?.question}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quizQuestions[currentQIndex]?.options.map((opt, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => handleAnswer(opt)}
                                    className="p-4 rounded-xl border-2 border-slate-100 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left font-medium transition-all text-slate-700 dark:text-slate-300 active:scale-95"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowQuiz(false)} className="mt-8 text-xs text-red-400 hover:text-red-600 underline">Cancel Quiz</button>
                    </div>
                )}
            </div>
        )}

      </div>
      </div>
    </div>
  );
}