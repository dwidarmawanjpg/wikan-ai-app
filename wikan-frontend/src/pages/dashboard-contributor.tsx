import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/theme-context";
import { useNavigate } from "react-router-dom";
import logoWikanLight from "../assets/wikan-logo-light.svg";
import logoWikanDark from "../assets/wikan-logo-dark.svg";
import api from "../api";

import { 
  FileText, 
  UploadCloud, 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle,
  Plus,
  History,       
  Trash2,        
  Edit,          
  FilePlus,
  User,
  Shield,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu, 
} from "lucide-react";




type Document = {
  id: number;
  title: string;
  description: string;   
  file_path: string;
  status: string;       
  created_at: string;    
  file_size: number;
};

const getStatusDescription = (status: string) => {
  switch (status) {
    case "APPROVED": return "File telah disetujui & dapat diakses publik."; 
    case "PENDING": return "Sedang dalam antrean review oleh Admin.";
    case "REJECTED": return "File ditolak. Cek kesesuaian konten/format.";
    case "FLAGGED": return "File ditandai karena masalah tertentu.";
    default: return "Status tidak diketahui";
  }
};

const DashboardContributor = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const { isDarkMode, toggleTheme } = useTheme(); 

  const [userProfile, setUserProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [myDocuments, setMyDocuments] = useState<Document[]>([]); 
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // State Form Upload Manual
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

// Handle Click Outside Profile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch User Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("wikan_token");
        if (!token) return; 

        const response = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setUserProfile(response.data);
      } catch (error) {
        console.error("Gagal ambil profil:", error);
      }
    };
    fetchProfile();
  }, []);

  // Fetch Documents (Load Data Tabel)
  const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem("wikan_token");
        if (!token) return;

        const docResponse = await api.get("/documents/my-uploads", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyDocuments(docResponse.data); 

      } catch (error) {
        console.error("Error fetching data:", error);
      }
  };

  const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("wikan_token");
        if (!token) return;

        const res = await api.get("/contributor/activities", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActivities(res.data);
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
  };

  useEffect(() => {
    fetchDocuments();
    fetchActivities();
  }, []);


// --- HANDLERS ---
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!selectedFile || !titleInput) {
      alert("Mohon lengkapi judul dan pilih file PDF.");
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem("wikan_token");
      
      const formData = new FormData();
      formData.append("title", titleInput);
      formData.append("description", descInput);
      formData.append("file", selectedFile); 

      await api.post("/documents/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", 
        },
      });

      alert("Upload Berhasil! Dokumen sedang menunggu persetujuan Admin.");
      
      setTitleInput("");
      setDescInput("");
      setSelectedFile(null);
      setIsUploadModalOpen(false);

      fetchDocuments();
      fetchActivities();

    } catch (error) {
      console.error("Gagal Upload:", error);
      alert("Gagal mengupload dokumen.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Handler Delete Document ---
  const handleDelete = async (id: number) => {
    if (!window.confirm("Apakah Anda YAKIN ingin menghapus file ini? Tindakan ini permanen dan tidak bisa dibatalkan.")) {
      return;
    }

    try {
      const token = localStorage.getItem("wikan_token");
      
      const response = await api.delete(`/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        alert("Dokumen berhasil dihapus dari cloud.");
        setMyDocuments(myDocuments.filter(doc => doc.id !== id));
        fetchActivities();
      }
    } catch (error: any) {
      console.error("Gagal menghapus:", error);
      alert("Gagal menghapus file. Pastikan ini adalah file milik Anda.");
    }
  };

  // Handler Logout
  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.removeItem("wikan_token");
      localStorage.removeItem("wikan_token_type");
      navigate("/");
    }
  };

  const filteredDocuments = myDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#0f111a] text-white" : "bg-[#f4f6f9] text-gray-800"}`}>
      
      {/* --- 1. NAVBAR --- */}
      <nav className={`h-16 flex-shrink-0 border-b px-4 lg:px-6 flex justify-between items-center z-30 sticky top-0 ${isDarkMode ? "bg-[#0f111a] border-gray-800" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-3">
          
          <button 
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className={`lg:hidden p-2 rounded-lg transition ${isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
          >
            <Menu className="w-6 h-6" />
          </button>

          <img src={isDarkMode ? logoWikanLight : logoWikanDark} alt="Wikan Logo" className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl object-contain" />
          <span className="font-bold text-lg lg:text-xl hidden sm:block">Contributor Hub</span>
        </div>

        <div className="flex items-center gap-4" ref={profileRef}>
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`flex items-center gap-2 p-1 pr-2 rounded-full border transition hover:shadow-md
              ${isDarkMode ? "border-gray-700 bg-[#1e2130] hover:bg-gray-800" : "border-gray-200 bg-white hover:bg-gray-50"}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-sm opacity-70 hidden sm:block">
                {userProfile?.full_name || "Memuat..."}
              </span>
              <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isProfileMenuOpen && (
              <div className={`absolute right-0 mt-3 w-60 rounded-xl shadow-2xl border overflow-hidden transform transition-all origin-top-right animate-fadeIn z-50
                ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-100"}`}>
                <div className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                  <p className="text-sm font-bold">{userProfile?.full_name || "User"}</p>
                  <p className="text-xs opacity-60">{userProfile?.email || "..."}</p>
                </div>
                <div className="p-2 space-y-1">
                  {/* TOMBOL KELOLA AKUN DI-HIDE KARENA BELUM TERSEDIA */}
                  {/* <button className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                    <User className="w-4 h-4 opacity-70" /> Kelola Akun
                  </button> */}
                  <button onClick={toggleTheme} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      {isDarkMode ? <Moon className="w-4 h-4 opacity-70" /> : <Sun className="w-4 h-4 opacity-70" />}
                      <span>Tampilan</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}>
                      {isDarkMode ? "GELAP" : "TERANG"}
                    </span>
                  </button>
                  {/* <button className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                    <Shield className="w-4 h-4 opacity-70" /> Kebijakan Privasi
                  </button> */}
                </div>
                <div className={`p-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-500/10 transition">
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* --- CONTENT WRAPPER --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
        )}

       {/* --- SIDEBAR --- */}
        <aside className={`
          fixed lg:relative inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-300 ease-in-out group
          ${isDarkMode ? "bg-[#151725] border-gray-800" : "bg-white border-gray-200"}
          /* Lebar Sidebar: 72 (Standard) saat terbuka, 20 saat tertutup */
          ${isSidebarCollapsed ? "lg:w-20" : "lg:w-72"}
          ${isMobileSidebarOpen ? "w-72 translate-x-0" : "-translate-x-full lg:translate-x-0 w-72 lg:w-auto"}
        `}>

          <div className={`h-16 flex items-center px-4 border-b flex-shrink-0 transition-all duration-300
            ${isDarkMode ? "border-gray-800" : "border-gray-100"}
            ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}
          >
            
            {!isSidebarCollapsed && (
              <span className={`font-bold text-lg tracking-tight ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>
                Menu
              </span>
            )}

            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`hidden lg:flex p-2 rounded-lg transition-colors duration-200
                ${isDarkMode 
                  ? "text-gray-400 hover:bg-white/10 hover:text-white" 
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              title={isSidebarCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* CONTENT */}
          <div className="p-4 space-y-8 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
            <div className={`flex flex-col ${isSidebarCollapsed ? "items-center" : ""}`}>
              {!isSidebarCollapsed && (
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 px-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  Aksi Cepat
                </h3>
              )}
              
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className={`w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 overflow-hidden
                /* Styling Tombol lebih proporsional */
                ${isSidebarCollapsed ? "w-12 h-12 rounded-2xl p-0" : "px-6 py-3.5 rounded-xl"}`}
                title="Unggah Dokumen Baru"
              >
             
                <Plus className={`flex-shrink-0 ${isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"}`} /> 
           
                <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"}`}>
                  Upload File
                </span>
              </button>
            </div>

            <div>
              <div className={`flex items-center gap-3 mb-6 px-1 ${isSidebarCollapsed ? "justify-center" : ""}`}>
                <History className="w-6 h-6 text-indigo-500 flex-shrink-0" /> 
                {!isSidebarCollapsed && (
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Aktivitas Terbaru
                  </h3>
                )}
              </div>

              <div className="space-y-6 relative">
                {!isSidebarCollapsed && (
                  <div className={`absolute left-5 top-3 bottom-3 w-[2px] ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}></div>
                )}

                {activities.map((activity) => (
                  <div key={activity.id} className={`relative flex gap-4 items-start group ${isSidebarCollapsed ? "justify-center" : ""}`}>
                    
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 shadow-sm transition-transform group-hover:scale-110
                      ${isDarkMode ? "bg-[#151725] border-gray-800" : "bg-white border-gray-100"}`}
                      title={isSidebarCollapsed ? `${activity.action} - ${activity.time}` : ""}
                    >
                      {activity.type === 'upload' && <FilePlus className="w-5 h-5 text-green-500" />}
                      {activity.type === 'delete' && <Trash2 className="w-5 h-5 text-red-500" />}
                      {activity.type === 'edit' && <Edit className="w-5 h-5 text-yellow-500" />}
                    </div>

                    {!isSidebarCollapsed && (
                      <div className="pt-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                          {activity.action}
                        </p>
                        <p className={`text-xs truncate max-w-[180px] mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`} title={activity.target}>
                          {activity.target}
                        </p>
                        <span className="text-[10px] font-medium text-indigo-500/80 mt-1.5 block flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {activity.time}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                
                {activities.length === 0 && (
                   <p className="text-xs opacity-50 px-2 text-center">Belum ada aktivitas.</p>
                )}
              </div>
            </div>

          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className={`flex-1 overflow-y-auto p-4 lg:p-10 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent 
        ${isDarkMode ? "[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:hover:bg-gray-600" : "[&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:hover:bg-gray-400"} 
        [&::-webkit-scrollbar-thumb]:rounded-full`}>
          
          <div className="max-w-6xl mx-auto space-y-8"> 
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Manajemen Berkas</h1>
                <p className={`mt-1 text-sm lg:text-base ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Kelola dokumen jurnal dan skripsi yang telah Anda unggah.
                </p>
              </div>
            </div>

            {/* TABEL WRAPPER */}
            <div className={`rounded-xl border overflow-hidden shadow-lg transition-all duration-300
              ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-200"}`}>
              
              {/* Filter Toolbar */}
              <div className={`p-4 flex flex-col sm:flex-row gap-4 justify-between items-center border-b 
                ${isDarkMode ? "border-gray-700 bg-[#151725]/50" : "border-gray-100 bg-gray-50/50"}`}>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cari nama dokumen..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border focus:ring-2 focus:ring-indigo-500 outline-none transition 
                    ${isDarkMode ? "bg-[#0f111a] border-gray-600 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-800"}`}
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2.5 rounded-lg text-sm border font-medium transition shadow-sm outline-none cursor-pointer
                    ${isDarkMode ? "border-gray-600 hover:bg-gray-700 bg-[#1e2130] text-gray-200" : "border-gray-300 hover:bg-gray-50 bg-white text-gray-800"}`}
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="APPROVED">Disetujui</option>
                    <option value="PENDING">Menunggu</option>
                    <option value="REJECTED">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[1000px] border-collapse">
                  
                  {/* HEADER */}
                  <thead className={`text-xs uppercase tracking-wider font-bold
                    ${isDarkMode ? "bg-[#151725] text-gray-300 border-b border-gray-700" : "bg-gray-50 text-gray-500 border-b border-gray-200"}`}>
                    <tr>
                      <th className={`px-6 py-4 w-[35%] border-r ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>Dokumen</th>
                      <th className={`px-6 py-4 w-[25%] border-r ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>Deskripsi</th>
                      <th className={`px-6 py-4 w-[15%] text-center border-r ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>Status</th>
                      <th className={`px-6 py-4 w-[15%] text-center border-r ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>Tanggal</th>
                      <th className="px-6 py-4 w-[10%] text-center">Aksi</th>
                    </tr>
                  </thead>

                  {/* BODY */}
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                   {filteredDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                            <FileText className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">Anda belum mengunggah dokumen apapun.</span>
                          </div>
                        </td>
                      </tr>
                   ) : (
                   filteredDocuments.map((file, index) => (
                      <tr 
                        key={file.id} 
                        className={`group transition hover:bg-opacity-50
                          ${index % 2 === 0 
                            ? (isDarkMode ? "bg-[#1e2130]" : "bg-white") 
                            : (isDarkMode ? "bg-[#23263a]" : "bg-gray-50")}
                          ${isDarkMode ? "hover:bg-indigo-900/10" : "hover:bg-indigo-50"}
                        `}
                      >
                        
                        <td className={`px-6 py-4 align-top border-r ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                            <div className="flex gap-4">
                              <div className={`p-2.5 rounded-xl flex-shrink-0 h-fit shadow-sm 
                                ${isDarkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600 border border-red-100"}`}>
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="min-w-0">
                                <p className={`font-semibold text-sm leading-snug whitespace-normal break-words mb-1 
                                  ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                  {file.title}
                                </p>
                                <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                                  {formatBytes(file.file_size)} • {file.file_path.split('.').pop()?.toUpperCase()}
                                </p>
                              </div>
                            </div>
                        </td>

                        <td className={`px-6 py-4 align-top border-r ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                          <p className={`text-sm leading-relaxed whitespace-normal break-words ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {file.description || "-"}
                          </p>
                        </td>

                        {/* STATUS */}
                        <td className={`px-6 py-4 align-top text-center border-r ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                          <div className="relative group/tooltip inline-block">
                            
                            {/* BADGE STATUS */}
                            <span className={`cursor-help inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm
                              ${file.status === 'APPROVED' ? (isDarkMode ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-green-50 text-green-700 border-green-200") : 
                                file.status === 'PENDING' ? (isDarkMode ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-yellow-50 text-yellow-700 border-yellow-200") : 
                                (isDarkMode ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-200")
                              }`}>
                              {file.status === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
                              {file.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                              {file.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                              {file.status}
                            </span>
                            
                            {/* TOOLTIP */}
                            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2.5 rounded-lg text-xs text-center shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50
                              ${isDarkMode ? "bg-gray-800 text-gray-200 border border-gray-700" : "bg-gray-900 text-white"}`}>

                              {getStatusDescription(file.status)}

                              <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent 
                                ${isDarkMode ? "border-t-gray-800" : "border-t-gray-900"}`}></div>
                            </div>

                          </div>
                        </td>

                        <td className={`px-6 py-4 align-top text-center text-sm font-medium border-r ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
                          {new Date(file.created_at).toLocaleDateString("id-ID")}
                        </td>
                        
                        <td className="px-6 py-4 align-top text-center">
                          <div className="flex justify-center gap-2">
                             {/* Tombol Hapus */}
                             <button 
                               onClick={() => handleDelete(file.id)} 
                               className={`p-2 rounded-lg transition border shadow-sm 
                                 ${isDarkMode ? "border-gray-700 hover:bg-red-500/20 text-red-500" : "border-gray-200 hover:bg-red-50 text-red-600"}`}
                               title="Hapus File"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                         </td>

                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* --- UPLOAD MODAL --- */}
      {isUploadModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsUploadModalOpen(false)} 
        >
          <div 
            className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 
            ${isDarkMode ? "bg-[#1e2130] text-white" : "bg-white text-gray-800"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
              <h3 className="text-xl font-bold">Upload File Baru</h3>
              <button type="button" onClick={() => setIsUploadModalOpen(false)} className="hover:text-red-400 transition">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
              <div className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition
                ${isDarkMode ? "border-gray-600 hover:border-indigo-500 hover:bg-indigo-500/5" : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"}`}>
                  
                <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-full mb-3">
                  <UploadCloud className="w-8 h-8" />
                </div>

                {selectedFile ? (
                   <div className="text-center">
                     <p className="font-bold text-indigo-500">{selectedFile.name}</p>
                     <p className="text-xs opacity-60 mt-1">Siap diunggah</p>
                   </div>
                ) : (
                   <>
                     <p className="font-medium">Klik atau tarik file ke sini untuk mengupload</p>
                     <p className="text-xs opacity-60 mt-1">Hanya format PDF (Maks. 10MB)</p>
                   </>
                )}

                <input 
                  type="file" 
                  accept=".pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>

              {/* INPUT JUDUL */}
              <div>
                <label className="block text-sm font-medium mb-1">Judul File</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Jurnal Psikologi 2024" 
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition ${isDarkMode ? "bg-[#0f111a] border-gray-700 placeholder-gray-600" : "bg-white border-gray-300"}`}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  required 
                />
              </div>

              {/* INPUT DESKRIPSI */}
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi Singkat</label>
                <textarea 
                  rows={3} 
                  placeholder="Jelaskan secara singkat isi dokumen ini..." 
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition ${isDarkMode ? "bg-[#0f111a] border-gray-700 placeholder-gray-600" : "bg-white border-gray-300"}`} 
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                ></textarea>
              </div>

              {/* TOMBOL AKSI */}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className={`px-5 py-2 rounded-lg font-medium transition ${isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>Batal</button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition disabled:opacity-50"
                >
                  {isUploading ? "Mengunggah..." : "Unggah Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardContributor;