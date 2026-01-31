import React, { useState, useEffect } from "react";
import axios from "axios";
import TopicChart from "./TopicChart";
import {
  ComposedChart,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function FacultyDashboard() {
  // --- MAIN TABS ---
  const [activeTab, setActiveTab] = useState("knowledge"); // 'knowledge' or 'exams'

  const [examView, setExamView] = useState("performance");

  // --- KNOWLEDGE BASE STATES ---
  const [file, setFile] = useState(null);
  const [unitName, setUnitName] = useState("");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- DRILL-DOWN STATES ---
  const [selectedUnitForDetail, setSelectedUnitForDetail] = useState(null);
  const [unitDetails, setUnitDetails] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // --- EXAM CELL STATES ---
  const [cat1File, setCat1File] = useState(null);
  const [cat2File, setCat2File] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isCat1Loading, setIsCat1Loading] = useState(false);
  const [isCat2Loading, setIsCat2Loading] = useState(false);

  // --- ANIMATIONS ---
  const modalStyles = `
    @keyframes popFromBar {
      0% { opacity: 0; transform: scale(0.2) translateY(100px); filter: blur(10px); }
      100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
    }
    .animate-pop-from-bar {
      animation: popFromBar 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  `;

  // --- DATA FETCHING ---
  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/faculty/analytics/chart",
      );
      setChartData(res.data);
    } catch (e) {
      console.error("Chart fetch failed");
    }
  };

  const fetchDeepAnalytics = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/faculty/marks/deep-analytics",
      );
      setAnalyticsData(res.data);
    } catch (e) {
      console.error("Analytics Error");
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchDeepAnalytics();
  }, []);

  // --- HANDLERS ---
  const handleUnitClick = async (unitName) => {
    setSelectedUnitForDetail(unitName);
    setIsDetailLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:8000/faculty/analytics/topics/${unitName}`,
      );
      setUnitDetails(res.data);
    } catch (e) {
      console.error("Error fetching details");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const uploadFile = async () => {
    if (!file || !unitName) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("unit", unitName.trim());
    try {
      await axios.post("http://localhost:8000/faculty/upload", formData);
      alert(`🎉 Successfully synced: ${unitName}`);
      setUnitName("");
      setFile(null);
      fetchAnalytics();
    } catch (e) {
      alert("Upload failed.");
    }
    setLoading(false);
  };

  const uploadCat1 = async () => {
    if (!cat1File) return;
    setIsCat1Loading(true);
    const formData = new FormData();
    formData.append("file", cat1File);

    try {
      const res = await axios.post(
        "http://localhost:8000/faculty/upload-cat1",
        formData,
      );

      // NEW: Check if backend sent a logical error
      if (res.data.error) {
        alert("❌ Upload Error: " + res.data.error);
      } else {
        alert("✅ CAT 1 Synced!");
        setCat1File(null);
        fetchDeepAnalytics();
      }
    } catch (e) {
      alert("❌ Network Error: Check console for details");
      console.error(e);
    }
    setIsCat1Loading(false);
  };

  const uploadCat2 = async () => {
    if (!cat2File) return;
    setIsCat2Loading(true);
    const formData = new FormData();
    formData.append("file", cat2File);

    try {
      const res = await axios.post(
        "http://localhost:8000/faculty/upload-cat2",
        formData,
      );

      if (res.data.error) {
        alert("❌ Upload Error: " + res.data.error);
      } else {
        alert("✅ CAT 2 Synced!");
        setCat2File(null);
        fetchDeepAnalytics();
      }
    } catch (e) {
      alert("❌ Network Error");
    }
    setIsCat2Loading(false);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#1a0b2e] transition-colors duration-300">
      <style>{modalStyles}</style>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* HEADER & TABS */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              Faculty Dashboard
            </h1>
            <p className="text-slate-500 text-sm">Overview & Analytics</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-gray-700 p-1 rounded-xl mt-4 md:mt-0">
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "knowledge" ? "bg-white dark:bg-gray-600 text-indigo-600 shadow-md" : "text-slate-500"}`}
            >
              Knowledge Base
            </button>
            <button
              onClick={() => setActiveTab("exams")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "exams" ? "bg-white dark:bg-gray-600 text-rose-600 shadow-md" : "text-slate-500"}`}
            >
              Exam Cell
            </button>
          </div>
        </div>

        {/* --- TAB 1: KNOWLEDGE BASE --- */}
        {activeTab === "knowledge" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4">
            {/* Upload Section */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 h-fit">
              <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">
                Upload Material
              </h2>
              <div className="space-y-5">
                <input
                  type="text"
                  placeholder="Unit Name"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full p-3 bg-slate-50  border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    id="pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept="application/pdf"
                  />
                  <label
                    htmlFor="pdf"
                    className="cursor-pointer font-bold text-indigo-600"
                  >
                    {file ? file.name : "Choose PDF"}
                  </label>
                </div>
                <button
                  onClick={uploadFile}
                  disabled={loading || !file || !unitName}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {loading ? "Syncing..." : "Train AI"}
                </button>
              </div>
            </div>
            {/* Topic Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Doubt Analysis
                </h2>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  Click bars to drill down
                </p>
              </div>
              <TopicChart chartData={chartData} onUnitClick={handleUnitClick} />
            </div>
          </div>
        )}

        {/* --- TAB 2: EXAM ANALYTICS --- */}
        {activeTab === "exams" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* 1. UPLOAD SECTION (Always Visible) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-slate-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-700 dark:text-white">
                    CAT 1 Upload
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Unit 1, 2, 3(A)
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="cat1"
                    className="hidden"
                    onChange={(e) => setCat1File(e.target.files[0])}
                    accept=".xlsx"
                  />
                  <label
                    htmlFor="cat1"
                    className="cursor-pointer bg-slate-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-white"
                  >
                    {cat1File ? "Selected" : "Choose File"}
                  </label>
                  <button
                    onClick={uploadCat1}
                    disabled={!cat1File || isCat1Loading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    Upload
                  </button>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-slate-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-700 dark:text-white">
                    CAT 2 Upload
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Unit 3(B), 4, 5
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="cat2"
                    className="hidden"
                    onChange={(e) => setCat2File(e.target.files[0])}
                    accept=".xlsx"
                  />
                  <label
                    htmlFor="cat2"
                    className="cursor-pointer bg-slate-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-white"
                  >
                    {cat2File ? "Selected" : "Choose File"}
                  </label>
                  <button
                    onClick={uploadCat2}
                    disabled={!cat2File || isCat2Loading}
                    className="bg-rose-600 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>

            {/* 2. SUB-TAB BUTTONS (VIEW SWITCHER) */}
            <div className="flex gap-4">
              <button
                onClick={() => setExamView("performance")}
                className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${examView === "performance" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-slate-500"}`}
              >
                📊 Exam Performance & At-Risk
              </button>
              <button
                onClick={() => setExamView("friction")}
                className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${examView === "friction" ? "bg-rose-600 text-white" : "bg-white dark:bg-gray-800 text-slate-500"}`}
              >
                🤖 Learning Friction & AI Insights
              </button>
            </div>

            {/* --- VIEW 1: PERFORMANCE DASHBOARD --- */}
            {examView === "performance" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
                {/* A. Unit-wise Performance Chart  */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
                    Unit-Wise Class Performance
                  </h3>
                  <div className="h-80">
                    {analyticsData?.graph_data ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.graph_data}>
                          <CartesianGrid stroke="#f5f5f5" vertical={false} />
                          <XAxis
                            dataKey="unit"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                          />
                          <Tooltip contentStyle={{ borderRadius: "12px" }} />
                          <Bar
                            dataKey="avg_marks"
                            fill="#6366f1"
                            radius={[10, 10, 0, 0]}
                            name="Avg Marks %"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        Waiting for Data...
                      </div>
                    )}
                  </div>
                </div>

                {/* B. Detailed At-Risk Student List */}
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 flex flex-col h-[400px]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
                      At-Risk Students
                    </h3>
                    <span className="bg-red-200 dark:bg-red-800 text-red-700 dark:text-white text-xs font-bold px-2 py-1 rounded-full">
                      {analyticsData?.poor_performers?.length || 0}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {analyticsData?.poor_performers?.map((student, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl border border-red-100 dark:border-red-900/10 shadow-sm"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-white">
                            {student.name}
                          </p>
                          <p className="text-[10px] text-red-400 font-mono">
                            {student.register_no}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-red-600">
                            {student.total_percentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                    {!analyticsData?.poor_performers?.length && (
                      <p className="text-center text-xs text-slate-400 mt-10">
                        No students at risk. 🎉
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- VIEW 2: FRICTION & AI DASHBOARD --- */}
            {examView === "friction" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
                {/* A. Correlation Chart (Marks vs Doubts)  */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Friction Analysis
                    </h3>
                    <div className="flex gap-4 text-[10px] font-bold uppercase">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-indigo-500 rounded-sm"></span>{" "}
                        Doubts
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-1 bg-rose-500"></span> Marks %
                      </div>
                    </div>
                  </div>
                  <div className="h-80">
                    {analyticsData?.graph_data ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={analyticsData.graph_data}>
                          <CartesianGrid stroke="#f5f5f5" vertical={false} />
                          <XAxis
                            dataKey="unit"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="#8884d8"
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#ff7300"
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                          />
                          <Tooltip contentStyle={{ borderRadius: "12px" }} />
                          <Bar
                            yAxisId="left"
                            dataKey="doubts"
                            barSize={40}
                            fill="#6366f1"
                            radius={[10, 10, 0, 0]}
                            name="Doubts"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="avg_marks"
                            stroke="#f43f5e"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            name="Avg Marks"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        Waiting for Data...
                      </div>
                    )}
                  </div>
                </div>

                {/* B. AI Insight Cards - SAFE RENDER UPDATE */}
                <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl h-[400px] overflow-y-auto custom-scrollbar">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <span className="text-xl">🤖</span> AI Teaching Strategy
                  </h3>
                  <div className="space-y-4">
                    {analyticsData?.ai_insights?.map((item, i) => (
                      <div
                        key={i}
                        className="bg-white/10 p-4 rounded-xl border border-white/5"
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-rose-300 text-xs uppercase">
                            {item.unit}
                          </span>
                          <span className="text-[10px] bg-rose-500 px-2 rounded">
                            High Friction
                          </span>
                        </div>

                        {/* 1. SAFE OBSERVATION RENDER */}
                        <p className="text-xs text-slate-300 mb-2 italic">
                          "
                          {typeof item.observation === "object"
                            ? item.observation.description ||
                              item.observation.text ||
                              JSON.stringify(item.observation)
                            : item.observation}
                          "
                        </p>

                        {/* 2. SAFE RECOMMENDATION RENDER (Fixes the crash) */}
                        <p className="text-sm font-medium text-green-300">
                          💡
                          {typeof item.recommendation === "object"
                            ? item.recommendation.description ||
                              item.recommendation.text ||
                              "Check detailed report"
                            : item.recommendation}
                        </p>
                      </div>
                    ))}
                    {!analyticsData?.ai_insights?.length && (
                      <p className="text-slate-500 text-sm text-center">
                        No critical learning gaps detected.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- DRILL-DOWN MODAL (SAME AS BEFORE) --- */}
      {selectedUnitForDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setSelectedUnitForDetail(null)}
          ></div>
          <div className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl overflow-hidden animate-pop-from-bar">
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600 w-full" />
            <div className="p-10 md:p-14">
              <div className="flex justify-between items-start mb-10">
                <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                  Unit Analysis:{" "}
                  <span className="text-indigo-600">
                    {selectedUnitForDetail}
                  </span>
                </h3>
                <button
                  onClick={() => setSelectedUnitForDetail(null)}
                  className="p-3 bg-slate-100 rounded-2xl"
                >
                  Close
                </button>
              </div>
              {isDetailLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                  {unitDetails.map((item, index) => (
                    <div
                      key={index}
                      className="p-6 bg-slate-50 dark:bg-gray-700 rounded-3xl"
                    >
                      <div className="flex justify-between mb-4">
                        <span className="text-xs font-black text-indigo-400">
                          Topic {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {item.count} Doubts
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-700 dark:text-white">
                        {item.topic}
                      </h4>
                      <div className="mt-4 h-1.5 bg-slate-200 rounded-full">
                        <div
                          className="h-full bg-indigo-500"
                          style={{
                            width: `${Math.min((item.count / 10) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
