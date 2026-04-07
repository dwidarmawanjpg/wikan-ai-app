import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/theme-context";
import logoWikanLight from "../assets/wikan-logo-light.svg";
import logoWikanDark from "../assets/wikan-logo-dark.svg";
import api, { API_BASE_URL } from "../api";



// --- TIPE DATA ---
type Message = {
  id: number;
  sender: "user" | "ai";
  text: string;
  time: string;
};
type ChatSession = {
  id: string;
  title: string;
  isPinned: boolean;
  date: string;
};
type SettingsTab = "account" | "appearance" | "privacy";

const Dashboard = () => {
  const navigate = useNavigate();
  const isGuest = !localStorage.getItem("wikan_token");

  // ... state lainnya ...
  const [userProfile, setUserProfile] = useState<{ full_name: string; role: string } | null>(null);

  // --- STATE DATA ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  // State UI
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    isGuest ? "appearance" : "account"
  );
  
  const { isDarkMode, toggleTheme } = useTheme();

  // --- LOGIC ---
  const handleNewChat = () => {
    if (isGuest) {
      if (messages.length === 0) {
        setMessages([
          {
            id: 1,
            sender: "ai",
            text: "Halo Tamu! Mode Guest aktif. Chat Anda tidak akan tersimpan setelah halaman ditutup.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      }
      return;
    }

    // Reset session ID agar backend membuat session baru
    setCurrentSessionId(null);

    setMessages([
      {
        id: 1,
        sender: "ai",
        text: "Halo! Sesi baru dimulai.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newUserMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    const currentQuery = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      let response;
      if (isGuest) {
        response = await fetch(`${API_BASE_URL}/chat/guest`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            question: currentQuery 
          }),
        });
      } else {
        const token = localStorage.getItem("wikan_token");
        response = await fetch(`${API_BASE_URL}/chat`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            question: currentQuery, 
            session_id: currentSessionId 
          }),
        });
      }

      if (!response.ok) throw new Error("Gagal menghubungi server");

      const data = await response.json();

      // Simpan session_id baru jika backend memberikannya (hanya user non-guest)
      if (!isGuest && data.session_id && !currentSessionId) {
        setCurrentSessionId(data.session_id);
        
        const newSession: ChatSession = {
          id: data.session_id.toString(),
          title: currentQuery.substring(0, 50),
          isPinned: false,
          date: "Hari Ini",
        };
        setChatSessions((prev) => [newSession, ...prev]);
      }

      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: "ai",
        text: data.answer,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: isGuest 
            ? "Ups! Sepertinya server sedang sibuk. Mode Guest memiliki batasan tertentu."
            : "Maaf, Wikan sedang mengalami gangguan koneksi ke server AI.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessionMessages = async (sessionId: string) => {
    try {
      const token = localStorage.getItem("wikan_token");
      const res = await api.get(`/chat/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      setCurrentSessionId(parseInt(sessionId));
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const handleAuthAction = () => {
    if (isGuest) {
      navigate("/login");
    } else {
      if (window.confirm("Keluar dari WIKAN?")) navigate("/");
    }
  };

  const togglePinChat = (id: string) =>
    !isGuest &&
    setChatSessions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  const deleteChat = (id: string) =>
    !isGuest &&
    window.confirm("Hapus chat?") &&
    setChatSessions((prev) => prev.filter((c) => c.id !== id));
  const startEditing = (chat: ChatSession) =>
    !isGuest &&
    !isCollapsed &&
    (setEditingChatId(chat.id), setEditTitleInput(chat.title));
  const saveTitle = (id: string) => {
    if (editTitleInput.trim())
      setChatSessions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editTitleInput } : c))
      );
    setEditingChatId(null);
  };

  const pinnedChats = chatSessions.filter((c) => c.isPinned);
  const otherChats = chatSessions.filter((c) => !c.isPinned);

  // Fetch Profile & History
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("wikan_token");
        if (!token) return;

        const profileRes = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserProfile(profileRes.data);

        const sessionsRes = await api.get("/chat/sessions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChatSessions(sessionsRes.data);
      } catch (err) {
        console.error("Gagal menarik data initial: ", err);
      }
    };
    if (!isGuest) {
      fetchData();
    }
  }, [isGuest]);

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#0f111a]" : "bg-gray-100"}`}>
      
      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 transform transition-all duration-300 md:relative flex flex-col shadow-xl
        ${isDarkMode ? "bg-[#151725] border-r border-gray-800" : "bg-[#f2f2f7] border-r border-gray-200"} 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} 
        ${isCollapsed ? "w-20" : "w-72"}`}
      >
        {/* Header */}
        <div className={`p-4 flex items-center ${isCollapsed ? "justify-center flex-col gap-4" : "justify-between"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? "" : "bg-white shadow-sm"}`}>
              <img src={isDarkMode ? logoWikanLight : logoWikanDark} alt="Wikan Logo" className="w-10 h-10 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <h1 className={`text-xl font-bold tracking-wide whitespace-nowrap ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>
                  WIKAN
                </h1>
                {!isCollapsed && (
                  <span className={`text-xs opacity-90 ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>
                    {isGuest ? "Mode Tamu" : (userProfile?.full_name || "Memuat...")}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:block p-1.5 rounded-lg transition ${isDarkMode ? "text-blue-200 hover:bg-white/10" : "text-[#1A1C43] hover:bg-gray-200"}`}
          >
            {isCollapsed ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            )}
          </button>
        </div>

        {/* Tombol New Chat */}
        <div className="px-4 mb-2">
          <button
            onClick={handleNewChat}
            className={`flex items-center justify-center rounded-xl border transition-all group 
            ${isGuest 
              ? "opacity-50 border-dashed hover:opacity-100 " + (isDarkMode ? "bg-transparent border-white/20" : "bg-transparent border-gray-300")
              : "shadow-sm " + (isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/20" : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300")} 
            ${isCollapsed ? "w-10 h-10 mx-auto" : "w-full px-4 py-3 gap-3"}`}
            title="New Chat"
          >
            {isGuest ? (
              <svg className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg
                className={`w-5 h-5 transition ${isDarkMode ? "text-blue-300 group-hover:text-white" : "text-[#1A1C43]"}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}

            {!isCollapsed && (
              <span className={`font-medium text-sm ${isGuest ? (isDarkMode ? "text-gray-400" : "text-gray-500") : (isDarkMode ? "text-white" : "text-[#1A1C43]")}`}>Obrolan Baru</span>
            )}
          </button>
        </div>

        {/* --- LIST CHAT --- */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-600">
          {isGuest ? (
            !isCollapsed && (
              <div className={`p-4 rounded-xl border text-center mt-10 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white/5 border-gray-200"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${isDarkMode ? "bg-white/10" : "bg-gray-100"}`}>
                  <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
         
                <h3 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>Guest Mode</h3>
                <p className={`text-xs mt-1 mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Chats are temporary and won't be saved.</p>
                <button onClick={() => navigate("/login")} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition">Login to Save</button>
              </div>
            )
          ) : (
            <>
              {pinnedChats.length > 0 && (
                <div>
                  {!isCollapsed && (
                    <p className={`px-3 text-xs uppercase tracking-wider mb-2 font-bold flex items-center gap-2 ${isDarkMode ? "text-blue-200" : "text-[#1A1C43]"}`}>
                      Disematkan
                    </p>
                  )}
                  <div className="space-y-1">
                    {pinnedChats.map((chat) => (
                      <ChatSessionItem
                        key={chat.id}
                        chat={chat}
                        isCollapsed={isCollapsed}
                        editingChatId={editingChatId}
                        editTitleInput={editTitleInput}
                        setEditTitleInput={setEditTitleInput}
                        saveTitle={saveTitle}
                        startEditing={startEditing}
                        togglePinChat={togglePinChat}
                        deleteChat={deleteChat}
                        isDarkMode={isDarkMode}
                        onSelectChat={fetchSessionMessages}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div>
                {!isCollapsed && (
            
                  <p className={`px-3 text-xs uppercase tracking-wider mb-2 font-semibold ${isDarkMode ? "text-blue-200" : "text-[#1A1C43]"}`}>
                    Obrolan
                  </p>
                )}
                <div className="space-y-1">
                  {otherChats.map((chat) => (
                    <ChatSessionItem
                      key={chat.id}
                      chat={chat}
                      isCollapsed={isCollapsed}
                      editingChatId={editingChatId}
                      editTitleInput={editTitleInput}
                      setEditTitleInput={setEditTitleInput}
                      saveTitle={saveTitle}
                      startEditing={startEditing}
                      togglePinChat={togglePinChat}
                      deleteChat={deleteChat}
                      isDarkMode={isDarkMode}
                      onSelectChat={fetchSessionMessages}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Sidebar */}
        <div className={`p-4 border-t flex flex-col gap-1 ${isDarkMode ? "border-white/10 bg-[#151725]" : "border-gray-200 bg-white"} ${isCollapsed ? "items-center" : ""}`}>
          <button
            onClick={() => setIsSettingsOpen(true)}
    
            className={`flex items-center rounded-lg transition ${isDarkMode ? "hover:bg-white/10 text-gray-300 hover:text-white" : "hover:bg-gray-100 text-gray-600 hover:text-[#1A1C43]"} ${isCollapsed ? "justify-center w-10 h-10" : "gap-3 w-full p-2.5"}`}
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {!isCollapsed && <span className={`text-sm ${isDarkMode ? "text-blue-200" : "text-[#1A1C43]"}`}>Pengaturan</span>}
          </button>

          <button
            onClick={handleAuthAction}
            className={`flex items-center rounded-lg transition 
            ${isGuest 
                ? (isDarkMode ? "hover:bg-green-500/20 text-green-300 hover:text-green-200" : "hover:bg-green-100 text-green-700")
                : (isDarkMode ? "hover:bg-red-500/20 text-red-300 hover:text-red-200" : "hover:bg-red-100 text-red-600")
            } ${isCollapsed ? "justify-center w-10 h-10" : "gap-3 w-full p-2.5"}`}
            title={isGuest ? "Login" : "Log out"}
          >
            {isGuest ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            )}
            {!isCollapsed && (
              <span className="text-sm font-bold">{isGuest ? "Login" : "Log out"}</span>
            )}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-1 flex flex-col relative transition-colors duration-300 ${isDarkMode ? "bg-[#131520]" : "bg-white"}`}>
        {/* Mobile Header */}
        <div className={`md:hidden h-16 flex items-center justify-between px-4 shadow-sm z-20 ${isDarkMode ? "bg-[#1A1C43] text-white" : "bg-white text-[#1A1C43]"}`}>
          <span className="font-bold flex items-center gap-2">
            WIKAN {isGuest && <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full">GUEST</span>}
          </span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <svg className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-6 ${isDarkMode ? "bg-[#0f111a]" : "bg-gray-50"}`}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              {msg.sender === "ai" && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-3 shadow-sm flex-shrink-0 ${isDarkMode ? "bg-indigo-600" : "bg-[#1A1C43]"}`}>
                  <span className="text-xs font-bold">AI</span>
                </div>
              )}
              <div
                className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[#6C63FF] text-white rounded-br-none"
                    : isDarkMode
                    ? "bg-[#1e2130] text-gray-200 border border-gray-700 rounded-bl-none"
                    : "bg-white text-gray-700 border border-gray-100 rounded-bl-none"
                }`}
              >
                {msg.text}
                <p className="text-[10px] mt-2 text-right opacity-70">{msg.time}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-3 shadow-sm bg-indigo-600`}>
                <span className="text-[10px] font-bold">AI</span>
              </div>
              <div className={`p-4 rounded-2xl shadow-sm text-sm border ${isDarkMode ? "bg-[#1e2130] border-gray-700 text-gray-400" : "bg-white border-gray-100 text-gray-500"}`}>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 md:p-6 border-t ${isDarkMode ? "bg-[#131520] border-gray-800" : "bg-white border-gray-100"}`}>
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isGuest ? "Tanya sesuatu (Mode Tamu)..." : "Ketik pesan Anda..."}
          
              className={`w-full pl-5 pr-14 py-4 rounded-full border focus:ring-2 outline-none transition shadow-sm ${
                isDarkMode
                  ? "bg-[#1e2130] border-gray-700 text-white focus:border-indigo-500 placeholder-gray-500"
                  : "bg-gray-100 border-transparent text-[#1A1C43] focus:bg-white focus:border-[#6C63FF] placeholder-gray-500"
              }`}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[#1A1C43] text-white rounded-full hover:bg-[#26295e] disabled:opacity-50 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </main>

      {/* --- MODAL SETTINGS --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px] 
            ${isDarkMode ? "bg-[#1e2130] text-white" : "bg-white text-[#1A1C43]"}`}>
            
            {/* Sidebar Settings */}
            <div className={`w-full md:w-1/3 p-4 border-r ${isDarkMode ? "bg-[#151725] border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <h3 className="font-bold text-lg mb-4 px-2">Pengaturan</h3>
              <nav className="space-y-1">
                {[
                  {
                    id: "account", 
                    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
                    label: "Akun",
                    disabled: isGuest
                  },
                  {
                    id: "appearance",
                    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
                    label: "Tampilan"
                  },
                  { id: "privacy", label: "Tentang & Privasi", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setActiveTab(item.id as SettingsTab)}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? isDarkMode ? "bg-[#2d324a] text-white" : "bg-white shadow-sm text-indigo-600"
                        : "text-gray-500 hover:bg-gray-200/50"
                    } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {item.icon}
                    {item.label}
                    {item.disabled && <span className="text-[10px] ml-auto border border-gray-400 px-1 rounded">Locked</span>}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Settings */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto relative">
              <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {activeTab === "account" && !isGuest && (
                <div className="space-y-6">
                  <h4 className="text-xl font-bold">Akun</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">😎</div>
                    <div>
                      <button className="text-sm text-indigo-500 font-semibold hover:underline">Ubah Foto Profil</button>
                    </div>
                  </div>
                  <input type="text" defaultValue="Wikan User" className={`w-full p-2 rounded border ${isDarkMode ? "bg-black/20 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-[#1A1C43]"}`} />
                </div>
              )}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <h4 className="text-xl font-bold">Tampilan</h4>
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? "bg-[#151725] border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                    <span>Mode Gelap</span>
                    <button onClick={() => { setIsSettingsOpen(true); setActiveTab('account'); }} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                    <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Kelola Akun
                  </button>
                  <button onClick={toggleTheme} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-0"}`}></div>
                    </button>
                  </div>
                </div>
              )}
              {activeTab === "privacy" && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* --- TENTANG WIKAN --- */}
                  <div>
                    <h4 className="text-xl font-bold mb-4">Tentang WIKAN</h4>
                    
                    <div className={`p-5 rounded-xl border flex gap-4 mb-4 ${isDarkMode ? "bg-[#151725] border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                      <img src={isDarkMode ? logoWikanLight : logoWikanDark} alt="Wikan Logo" className="w-10 h-10 object-contain" />
                      <div>
                        <h5 className="font-bold">WIKAN</h5>
                        <p className="text-xs opacity-60 mb-2">Web-base Intelligence Knowledge Asisten Navigator</p>
                        <p className="text-sm opacity-80 leading-relaxed">
                          Asisten cerdas berbasis web untuk menavigasi informasi dokumen riset dan pendidikan dengan akurasi tinggi menggunakan teknologi RAG.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg border text-center ${isDarkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"}`}>
                        <p className="text-xs opacity-50 uppercase font-bold">Versi</p>
                        <p className="font-mono text-sm">1.0.0 (Beta)</p>
                      </div>
                      <div className={`p-3 rounded-lg border text-center ${isDarkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"}`}>
                        <p className="text-xs opacity-50 uppercase font-bold">Developer</p>
                        <p className="text-sm">WIKAN GROUP 1</p>
                      </div>
                    </div>
                  </div>

                  {/* --- KEBIJAKAN PRIVASI --- */}
                  <div>
                    <h4 className="text-xl font-bold mb-4">Kebijakan Privasi</h4>
                    
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <div>
                          <h5 className="text-sm font-bold">Isolasi Data Dokumen</h5>
                          <p className="text-xs opacity-70 mt-1 leading-relaxed">
                            Dokumen PDF yang Anda unggah <strong>hanya digunakan</strong> untuk sesi chat pribadi Anda. Kami TIDAK menggunakannya untuk melatih model AI publik.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <div>
                          <h5 className="text-sm font-bold">Enkripsi & Keamanan</h5>
                          <p className="text-xs opacity-70 mt-1 leading-relaxed">
                            Seluruh transmisi data dilindungi enkripsi SSL/TLS standar industri.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <div>
                          <h5 className="text-sm font-bold">Hak Penghapusan</h5>
                          <p className="text-xs opacity-70 mt-1 leading-relaxed">
                            Anda memiliki kendali penuh untuk menghapus dokumen atau akun Anda secara permanen kapan saja.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded text-[10px] text-center opacity-60 border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"}`}>
                    &copy; 2025 Wikan AI. All rights reserved.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SUB-COMPONENT: ChatSessionItem dengan Props isDarkMode
const ChatSessionItem = ({
  chat,
  isCollapsed,
  editingChatId,
  editTitleInput,
  setEditTitleInput,
  saveTitle,
  startEditing,
  togglePinChat,
  deleteChat,
  isDarkMode,
  onSelectChat
}: any) => {
  return (
    <div
      onClick={() => onSelectChat && onSelectChat(chat.id)}
      className={`group relative w-full text-left rounded-lg transition flex items-center cursor-pointer
      ${isCollapsed ? "justify-center p-2.5" : "p-2.5 gap-3"}
      ${isDarkMode 
        ? "text-gray-300 hover:bg-white/10 hover:text-white" 
        : "text-gray-600 hover:bg-gray-200 hover:text-[#1A1C43]"} 
      `}
    >
      <svg
        className={`w-4 h-4 opacity-70 flex-shrink-0 ${isCollapsed ? "w-6 h-6" : ""}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
        onClick={(e) => { e.stopPropagation(); !isCollapsed && startEditing(chat); }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      {!isCollapsed && (
        <>
          <div className="flex-1 truncate text-sm">
            {editingChatId === chat.id ? (
              <input
                autoFocus
                type="text"
                value={editTitleInput}
                onChange={(e) => setEditTitleInput(e.target.value)}
                onBlur={() => saveTitle(chat.id)}
                onKeyDown={(e) => e.key === "Enter" && saveTitle(chat.id)}
                className={`w-full rounded px-1 outline-none border border-blue-500/50 ${isDarkMode ? "bg-black/20 text-white" : "bg-white text-gray-800"}`}
              />
            ) : (
              <span className="block truncate">{chat.title}</span>
            )}
          </div>
          {editingChatId !== chat.id && (
            <div className="hidden group-hover:flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); startEditing(chat); }}
                className={`p-1 rounded ${isDarkMode ? "hover:text-white hover:bg-white/20" : "hover:text-[#1A1C43] hover:bg-gray-300"}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); togglePinChat(chat.id); }}
                className={`p-1 hover:bg-white/20 rounded ${chat.isPinned ? "text-blue-400" : isDarkMode ? "hover:text-white" : "hover:text-[#1A1C43]"}`}
              >
                <svg className="w-3 h-3" fill={chat.isPinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                className={`p-1 rounded ${isDarkMode ? "hover:text-red-300 hover:bg-white/20" : "hover:text-red-600 hover:bg-red-100"}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;