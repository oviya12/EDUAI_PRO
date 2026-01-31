import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function FacultyLogin({setUser}) {
  // View States: 'login', 'signup', 'forgot'
  const [view, setView] = useState('login'); 
  
  // Form Data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Security Data
  const [securityQuestion, setSecurityQuestion] = useState("What is your pet's name?");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [fetchedQuestion, setFetchedQuestion] = useState(""); // For forgot password flow
  
  const navigate = useNavigate();

  const securityOptions = [
    "What is your pet's name?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What is your favorite food?",
    "What was the name of your first school?"
  ];

  // --- HANDLER: LOGIN & SIGNUP ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", "faculty"); // Hardcoded for Faculty

    try {
      if (view === 'login') {
        const res = await axios.post("http://localhost:8000/auth/login", formData);
        const userName = res.data.user.full_name;
        setUser(userName); 
        localStorage.setItem("edu_user", JSON.stringify(userName)); 
        localStorage.setItem("edu_role", "faculty");
        navigate('/faculty');
      } else if (view === 'signup') {
        formData.append("full_name", fullName);
        formData.append("security_question", securityQuestion);
        formData.append("security_answer", securityAnswer);

        await axios.post("http://localhost:8000/auth/signup", formData);
        
        setUser(fullName);
        localStorage.setItem("edu_user", JSON.stringify(fullName)); 
        localStorage.setItem("edu_role", "faculty");
        alert("Faculty Account Created Successfully!");
        navigate('/faculty');
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Authentication Failed");
    }
  };

  // --- HANDLER: FORGOT PASSWORD FLOW ---
  const fetchQuestion = async () => {
    if(!email) return alert("Please enter your email first.");
    try {
      const res = await axios.get(`http://localhost:8000/auth/get-security-question?email=${email}`);
      setFetchedQuestion(res.data.question);
    } catch (err) {
      alert("Email not found.");
    }
  };

  const handleResetPassword = async () => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("security_answer", securityAnswer);
    formData.append("new_password", password); // Reusing password state for new password

    try {
      await axios.post("http://localhost:8000/auth/reset-password", formData);
      alert("Password Reset Successfully! You can now login.");
      setView('login');
      setPassword(""); 
      setSecurityAnswer("");
    } catch (err) {
      alert(err.response?.data?.detail || "Reset Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-12 rounded-[3rem] shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-8 duration-500">
        
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 rounded-3xl text-3xl mb-4">👨‍🏫</div>
          <h2 className="text-3xl font-black text-gray-800 dark:text-white">
            {view === 'login' && "Faculty Login"}
            {view === 'signup' && "Faculty Signup"}
            {view === 'forgot' && "Reset Password"}
          </h2>
          <p className="text-gray-500 dark:text-gray-300 font-medium">
            {view === 'forgot' ? "Recover your account" : "Manage syllabus & track analytics"}
          </p>
        </div>

        {/* --- VIEW 1 & 2: LOGIN / SIGNUP --- */}
        {view !== 'forgot' && (
          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'signup' && (
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 " required />
            )}
            
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600" required />
            
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600" required />

            {/* SECURITY QUESTION (SIGNUP ONLY) */}
            {view === 'signup' && (
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-400 uppercase">Security Question (For Recovery)</p>
                <select value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-500">
                  {securityOptions.map((q, i) => <option key={i} value={q}>{q}</option>)}
                </select>
                <input type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} placeholder="Your Answer" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 " required />
              </div>
            )}

            <button type="submit" className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
              {view === 'login' ? "Login" : "Create Account"}
            </button>
          </form>
        )}

        {/* --- VIEW 3: FORGOT PASSWORD --- */}
        {view === 'forgot' && (
           <div className="space-y-4">
              {!fetchedQuestion ? (
                 <>
                   <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                   <button onClick={fetchQuestion} className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Find Account</button>
                 </>
              ) : (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                   <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                      <p className="text-xs text-indigo-500 font-bold uppercase">Security Question</p>
                      <p className="font-bold text-gray-800 ">{fetchedQuestion}</p>
                   </div>
                   <input type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} placeholder="Your Answer" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 " />
                   <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 " />
                   <button onClick={handleResetPassword} className="w-full px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-none">Reset Password</button>
                 </div>
              )}
           </div>
        )}

        {/* --- TOGGLES --- */}
        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          {view === 'login' && (
            <>
               <button onClick={() => setView('signup')} className="text-gray-500 hover:text-indigo-600 font-bold">New Faculty? Register here</button>
               <button onClick={() => setView('forgot')} className="text-rose-500 hover:text-rose-600 font-bold">Forgot Password?</button>
            </>
          )}
          {(view === 'signup' || view === 'forgot') && (
             <button onClick={() => { setView('login'); setFetchedQuestion(""); }} className="text-gray-500 hover:text-indigo-600 font-bold">Back to Login</button>
          )}
        </div>

      </div>
    </div>
  );
}