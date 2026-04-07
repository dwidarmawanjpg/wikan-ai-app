import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/theme-context";
import axios from "axios";
import api from "../api";


import { 
  Shield, 
  Users, 
  FileText, 
  Search, 
  XCircle, 
  // AlertTriangle, 
  Trash2, 
  Clock, 
  Activity, 
  UserCheck, 
  Eye,          
  CheckCircle,  
  MoreVertical, 
  Ban,          
  RotateCcw,    
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Moon,
  Sun,
  Plus          
} from "lucide-react";


type Document = {
  id: number;
  title: string;
  description: string;
  file_path: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  file_size: number;
  uploader_id: string;
};

const DashboardAdmin = () => {
  const [usersList, setUsersList] = useState<any[]>([]); // Menyimpan data user asli dari DB
  const [adminStats, setAdminStats] = useState<any>(null);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const [userProfile, setUserProfile] = useState<{ full_name: string; email: string; role: string } | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]); // Data Dokumen Asli
  const [isLoading, setIsLoading] = useState(false);

// --- STATE UI & NAVIGASI ---
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'documents'>('overview');
  const [approvalTab, setApprovalTab] = useState<'files' | 'accounts'>('files');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectedUserAction, setSelectedUserAction] = useState<number | null>(null);

  // State Filter Dokumen
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [previewItem, setPreviewItem] = useState<Document | null>(null);

  // State Filter Users
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");

  const profileRef = useRef<HTMLDivElement>(null);


  // --- FETCH DATA ---
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("wikan_token");
      if (!token) { navigate("/login"); return; }

      const response = await api.get("/admin/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FETCH USERS ---
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("wikan_token");
      const response = await api.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(response.data);
    } catch (error) {
      console.error("Gagal mendapatkan User List", error);
    }
  };

  // --- FETCH STATS ---
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("wikan_token");
      const response = await api.get("/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminStats(response.data);
    } catch (error) {
      console.error("Gagal mendapatkan Admin Stats", error);
    }
  };

  // --- MERGE USE EFFECT ---
  useEffect(() => {
    fetchDocuments();
    fetchUsers();
    fetchStats();
  }, []);


  // --- FETCH PROFILE (API) ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("wikan_token");
        const response = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserProfile(response.data);
      } catch (error) {
        console.error("Error fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);


// --- HANDLERS LOGIC (AKSI BACKEND) ---
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const updateStatus = async (id: number, decision: "approve" | "reject") => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("wikan_token");

      const response = await api.post(
      `/admin/documents/${id}/decide?decision=${decision}`, 
      {}, 
      { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        alert(decision === "approve" ? "✅ Berhasil: Dokumen disetujui & AI mulai mempelajari." : "❌ Dokumen telah ditolak.");

        await fetchDocuments();
        setPreviewItem(null); 
      }
    } catch (error: any) { 
      if (error.response?.status === 403){
        alert("Sesi Admin berakhir atau Role tidak valid. Silakan Login ulang.");
        navigate("/login");
      } else {
        console.error("Gagal Update Status:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

// Wrapper Functions untuk UI
  const handleApprove = (id: number) => {
    if (window.confirm("Setujui dokumen ini? Dokumen akan bisa diakses publik.")) {
      updateStatus(id, "approve");
    }
  };

  const handleReject = (id: number) => {
    if (window.confirm("Tolak dokumen ini?")) {
      updateStatus(id, "reject");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("⚠️ PERINGATAN: Hapus permanen? File di server dan memori AI akan dihapus selamanya.");
    if (!confirmDelete) return;

    try {
    const token = localStorage.getItem("wikan_token");
    await api.delete(`/documents/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    alert("✅ Dokumen berhasil dihapus dari database.");
    fetchDocuments(); // Refresh tabel
  } catch (error) {
    console.error("Gagal hapus:", error);
    alert("Gagal menghapus dokumen.");
  }
};

  const handleOpenPdf = (filePath: string) => {
    // Karena saat ini path sudah menempel pada public URL Supabase via database
    window.open(filePath, "_blank");
  };

  const handleLogout = () => {
    localStorage.removeItem("wikan_token");
    navigate("/login");
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Yakin ingin menghapus user ini secara permanen?")) return;
    try {
      const token = localStorage.getItem("wikan_token");
      await api.delete(`/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Pengguna berhasil dihapus.");
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Gagal menghapus pengguna.");
    }
  };

  const handleAddAdmin = async () => {
    const email = window.prompt("Masukkan Email Admin Baru:");
    if (!email) return;
    const fullName = window.prompt("Masukkan Nama Lengkap:");
    if (!fullName) return;
    const password = window.prompt("Masukkan Password:");
    if (!password) return;

    try {
      const token = localStorage.getItem("wikan_token");
      await axios.post(
        "/admin/users",
        {
          email: email,
          full_name: fullName,
          password: password,
          role: "ADMIN",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Admin baru berhasil ditambahkan!");
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.detail || "Gagal menambah admin.");
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("wikan_token");
      const res = await api.put(`/admin/users/${userId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
      fetchUsers();
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("Gagal memperbarui status pengguna.");
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!window.confirm("Yakin ingin mereset password pengguna ini menjadi 'wikan123'?")) return;
    try {
      const token = localStorage.getItem("wikan_token");
      const res = await axios.put(`/admin/users/${userId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
      fetchUsers();
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Gagal mereset password.");
    }
  };

  // --- FILTER LOGIC ---
  const pendingDocuments = documents.filter(doc => doc.status === 'PENDING');

  const contentManagerDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredUsersList = usersList.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === "ALL" || user.role === userRoleFilter;
    
    // Default fallback if status is null in old rows
    const status = user.status || "ACTIVE";
    const matchesStatus = userStatusFilter === "ALL" || status === userStatusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (!(event.target as HTMLElement).closest('.user-action-btn')) {
        setSelectedUserAction(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("wikan_token");
        const response = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserProfile(response.data);
      } catch (error) {
        console.error("Error fetch admin profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const adminMenus = [
    { id: 'overview', label: 'Ringkasan', icon: Activity, color: "text-red-500" },
    { id: 'users', label: 'Kelola Pengguna', icon: Users, color: "text-blue-500" },
    { id: 'documents', label: 'Manajer Konten', icon: FileText, color: "text-orange-500" },
  ];

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

          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">Admin <span className="text-red-500">WIKAN</span></span>
        </div>

        <div className="flex items-center gap-4" ref={profileRef}>
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`flex items-center gap-2 p-1 pr-2 rounded-full border transition hover:shadow-md
              ${isDarkMode ? "border-gray-700 bg-[#1e2130] hover:bg-gray-800" : "border-gray-200 bg-white hover:bg-gray-50"}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {userProfile?.full_name ? userProfile.full_name.substring(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <span className="text-sm font-bold block">
                  {userProfile?.full_name || "Admin Wikan"}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isProfileMenuOpen && (
              <div className={`absolute right-0 mt-3 w-60 rounded-xl shadow-2xl border overflow-hidden transform transition-all origin-top-right animate-fadeIn z-50
                ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-100"}`}>
                <div className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                  <p className="text-sm font-bold">{userProfile?.full_name}</p>
                  <p className="text-xs opacity-60">Administrator Sistem</p> {/* Atau userProfile?.email */}
                </div>
                <div className="p-2 space-y-1">
                  {/* TOMBOL KELOLA AKUN DI-HIDE KARENA STATELESS */}
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
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}></div>
        )}
        
        {/* --- 2. SIDEBAR --- */}
        <aside className={`
          fixed lg:relative inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-300 ease-in-out group
          ${isDarkMode ? "bg-[#151725] border-gray-800" : "bg-white border-gray-200"}
          ${isSidebarCollapsed ? "lg:w-20" : "lg:w-72"}
          ${isMobileSidebarOpen ? "w-72 translate-x-0" : "-translate-x-full lg:translate-x-0 w-72 lg:w-auto"}
        `}>
          
          <div className={`h-16 flex items-center px-4 border-b flex-shrink-0 transition-all duration-300
            ${isDarkMode ? "border-gray-800" : "border-gray-100"}
            ${isSidebarCollapsed ? "justify-center" : "justify-between"}
          `}>
            {!isSidebarCollapsed && (
              <span className={`font-bold text-xs uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                MENU UTAMA
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
              {isSidebarCollapsed ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
            </button>
          </div>

          <div className="p-4 space-y-8 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            <div className="space-y-2">
              {adminMenus.map((menu) => (
                <button 
                  key={menu.id}
                  onClick={() => setActiveTab(menu.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all
                    ${activeTab === menu.id 
                      ? (isDarkMode ? "bg-[#2d324a] text-white shadow-md" : "bg-white text-gray-900 shadow-md border border-gray-100") 
                      : "opacity-60 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/5"}
                    ${isSidebarCollapsed ? "justify-center px-0" : ""}
                  `}
                  title={isSidebarCollapsed ? menu.label : ""}
                >
                  <menu.icon className={`w-5 h-5 ${activeTab === menu.id ? menu.color : ""}`} />
                  {!isSidebarCollapsed && <span>{menu.label}</span>}
                </button>
              ))}
            </div>

            {!isSidebarCollapsed && (
              <div className={`p-4 rounded-xl border animate-fadeIn ${isDarkMode ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className={`text-xs font-bold uppercase ${isDarkMode ? "text-green-400" : "text-green-700"}`}>Sistem Stabil</span>
                </div>
                <p className="text-xs opacity-70">Beban Server: 12%</p>
                <p className="text-xs opacity-70">
                  Antrean: {pendingDocuments.length}
                </p>
              </div>
            )}

            {/* AKTIVITAS TERBARU RESTORED */}
            <div>
              <div className={`flex items-center gap-2 mb-4 px-1 ${isSidebarCollapsed ? "justify-center" : ""}`}>
                <Activity className="w-5 h-5 text-indigo-500" />
                {!isSidebarCollapsed && (
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Aktivitas Terbaru
                  </h3>
                )}
              </div>
              
              <div className="space-y-4 relative">
                {!isSidebarCollapsed && (
                  <div className={`absolute left-3.5 top-2 bottom-2 w-0.5 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}></div>
                )}
                {adminStats && adminStats.recent_activities.map((log: any) => (
                  <div key={log.id} className={`relative flex gap-3 items-start group ${isSidebarCollapsed ? "justify-center" : ""}`}>
                    <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 flex-shrink-0
                      ${isDarkMode ? "bg-[#151725] border-gray-800" : "bg-white border-gray-100"}`}
                      title={isSidebarCollapsed ? `${log.action} - ${log.time}` : ""}
                    >
                      {log.type === 'approve_file' && <UserCheck className="w-3 h-3 text-green-500" />}
                      {log.type === 'reject_file' && <XCircle className="w-3 h-3 text-orange-500" />}
                      {log.type === 'delete' && <Trash2 className="w-3 h-3 text-red-500" />}
                      {log.type === 'upload' && <FileText className="w-3 h-3 text-blue-500" />}
                      {log.type === 'edit' && <User className="w-3 h-3 text-purple-500" />}
                    </div>
                    {!isSidebarCollapsed && (
                      <div className="pt-0.5">
                        <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{log.action}</p>
                        <p className="text-xs opacity-60 truncate w-32">{log.target}</p>
                        <span className="text-[10px] opacity-40 mt-1 block">{log.time}</span>
                      </div>
                    )}
                  </div>
                ))}
                {adminStats && adminStats.recent_activities.length === 0 && (
                   <p className="text-xs opacity-50 px-2">Belum ada aktivitas.</p>
                )}
              </div>
            </div>

          </div>
        </aside>

        {/* --- 3. MAIN DASHBOARD --- */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* --- TAB: OVERVIEW --- */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                <h1 className="text-3xl font-bold">Ringkasan Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Berkas", val: adminStats ? adminStats.total_documents : 0, icon: FileText, color: "text-blue-500" }, 
                    { label: "Perlu Review", val: adminStats ? adminStats.pending_documents : 0, icon: Clock, color: "text-orange-500" },
                    { label: "Total User", val: adminStats ? adminStats.total_users : 0, icon: UserCheck, color: "text-purple-500" },
                    { label: "Ditolak", val: adminStats ? adminStats.rejected_documents : 0, icon: XCircle, color: "text-red-500" }, 
                  ].map((stat, idx) => (
                    <div key={idx} className={`p-5 rounded-xl border flex items-center justify-between ${isDarkMode ? "bg-[#1e2130] border-gray-800" : "bg-white border-gray-200"}`}>
                      <div>
                        <p className="text-xs opacity-60 uppercase font-bold">{stat.label}</p>
                        <h4 className="text-2xl font-bold mt-1">{stat.val}</h4>
                      </div>
                      <div className={`p-3 rounded-lg bg-opacity-10 ${stat.color.replace('text-', 'bg-')} ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Approval Section */}
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-[#1e2130] border-gray-800" : "bg-white border-gray-200"}`}>
                  <div className="p-5 border-b border-gray-700/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /> Perlu Persetujuan</h2>
                    <div className={`p-1 rounded-lg flex text-sm font-medium ${isDarkMode ? "bg-[#151725]" : "bg-gray-100"}`}>
                      {/* Approval Account Button di Hide (Sebab endpoint backend tdk support verifikasi) */}
                      <button onClick={() => setApprovalTab('files')} className={`px-4 py-1.5 rounded-md transition-all ${approvalTab === 'files' ? (isDarkMode ? "bg-[#2d324a] text-white shadow" : "bg-white text-gray-900 shadow") : "opacity-60"}`}>Berkas Pending</button>
                    </div>
                  </div>
                  <div className="p-5 grid gap-4">
                    {approvalTab === 'files' ? (
                      pendingDocuments.length === 0 ? (
                        <p className="text-center opacity-50 py-8">Tidak ada berkas yang perlu disetujui.</p>
                      ) : (
                        pendingDocuments.map(file => (
                          <div key={file.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4 ${isDarkMode ? "bg-[#151725] border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                            <div className="flex gap-4 items-center">
                              <div className={`p-3 rounded-lg ${isDarkMode ? "bg-orange-500/10 text-orange-500" : "bg-orange-100 text-orange-600"}`}>
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold truncate pr-4">{file.title}</h4>
                                {/* PERBAIKAN: Gunakan formatBytes dan uploader_id */}
                                <p className="text-sm opacity-60">
                                  ID: {file.uploader_id} • {formatBytes(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => setPreviewItem(file)} className="px-3 py-2 border rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm">
                                <Eye className="w-4 h-4" /> Tinjau
                              </button>
                              {/* PERBAIKAN: Gunakan file.id, bukan file.title */}
                              <button onClick={() => handleApprove(file.id)} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4" /> Setujui
                              </button>
                            </div>
                          </div>
                        ))
                      )
                    ): (
                       <p className="text-center opacity-50 py-8">Approval akun via Web saat ini tidak didukung.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB: USER MANAGEMENT --- */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* 1. HEADER & SEARCH BAR */}
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Kelola Pengguna</h1>
                  <button onClick={handleAddAdmin} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg transition flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tambah Admin Baru
                  </button>
                </div>

                <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 ${isDarkMode ? "bg-[#1e2130] border-gray-800" : "bg-white border-gray-200"}`}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input type="text" value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} placeholder="Cari pengguna berdasarkan nama atau email..." className={`w-full pl-10 pr-4 py-2 rounded-lg border outline-none bg-transparent ${isDarkMode ? "border-gray-700" : "border-gray-300"}`} />
                  </div>
                  <div className="flex gap-2">
                    <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className={`px-4 py-2 rounded-lg border outline-none cursor-pointer ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-300"}`}>
                      <option value="ALL">Semua Peran</option>
                      <option value="ADMIN">Admin</option>
                      <option value="CONTRIBUTOR">Kontributor</option>
                      <option value="STUDENT">Mahasiswa</option>
                    </select>
                    <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} className={`px-4 py-2 rounded-lg border outline-none cursor-pointer ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-300"}`}>
                      <option value="ALL">Semua Status</option>
                      <option value="ACTIVE">Aktif</option>
                      <option value="BANNED">Diblokir</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>

                {/* 2. TABEL TUNGGAL (HEADER + BODY DINAMIS) */}
                <div className={`rounded-xl border overflow-visible ${isDarkMode ? "bg-[#1e2130] border-gray-800" : "bg-white border-gray-200"}`}>
                  <table className="w-full text-left text-sm">
                    
                    {/* Header Tabel (Selalu Muncul) */}
                    <thead className={`border-b ${isDarkMode ? "bg-[#1A1C43]/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                      <tr>
                        <th className="px-6 py-4">Nama</th>
                        <th className="px-6 py-4">Peran</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-700/50">
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm font-medium">Memuat data pengguna...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsersList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 opacity-50">
                            Data pengguna tidak ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredUsersList.map(user => (
                          <tr key={user.id} className={`group ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                            
                            {/* Nama & Email */}
                            <td className="px-6 py-4">
                              <p className="font-bold">{user.full_name}</p> 
                              <p className="text-xs opacity-60">{user.email}</p>
                            </td>
                            
                            {/* Role */}
                            <td className="px-6 py-4">{user.role}</td>
                            
                            {/* Status */}
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'BANNED' ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10"}`}>
                                {user.status || 'ACTIVE'}
                              </span>
                            </td>
                            
                            {/* Aksi (Dropdown) */}
                            <td className="px-6 py-4 text-right relative user-action-btn">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation(); 
                                  setSelectedUserAction(selectedUserAction === user.id ? null : user.id); 
                                }} 
                                className={`p-2 rounded-lg transition ${isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-200"}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {selectedUserAction === user.id && (
                                <div className={`absolute right-10 top-2 w-48 rounded-xl shadow-2xl border z-50 overflow-hidden animate-fadeIn text-left 
                                  ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-200"}`}>
                                  <div className="p-1">
                                    <button onClick={() => handleBlockUser(user.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-orange-500/10 hover:text-orange-500 rounded-lg flex items-center gap-2">
                                      <Ban className="w-4 h-4" /> {user.status === 'BANNED' ? "Unblock" : "Blokir"}
                                    </button>
                                    <button onClick={() => handleResetPassword(user.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-500/10 hover:text-blue-500 rounded-lg flex items-center gap-2">
                                      <RotateCcw className="w-4 h-4" /> Reset Password
                                    </button>
                                    <div className="h-px bg-gray-700/50 my-1"></div>
                                    <button 
                                      onClick={() => handleDeleteUser(user.id)} 
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" /> Hapus
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- TAB: CONTENT MANAGER --- */}
            {activeTab === 'documents' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bold">Manajer Konten</h1>
                    <p className="opacity-60 mt-1">Kelola dokumen yang telah diterbitkan.</p>
                  </div>

                  <div className="flex gap-2">
                    {/* Dropdown Filter Status */}
                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)} 
                      className={`px-4 py-2 rounded-lg border outline-none cursor-pointer ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-300"}`}
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="PENDING">Pending</option>
                    </select>

                    {/* Input Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                      <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="Cari di database..." 
                        className={`pl-10 pr-4 py-2 rounded-lg border ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-300"}`} 
                      />
                    </div>
                  </div>
                </div>
                
                {/* 2. TABEL DATA (HANYA SATU TABEL) */}
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-[#1e2130] border-gray-800" : "bg-white border-gray-200"}`}>
                  <table className="w-full text-left text-sm">
                    <thead className={`border-b ${isDarkMode ? "bg-[#1A1C43]/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                      <tr>
                        <th className="px-6 py-4">Dokumen</th>
                        <th className="px-6 py-4">Pengunggah (ID)</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    
                    <tbody className="divide-y divide-gray-700/50">
                      
                      {/* KONDISI 1: LOADING */}
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm font-medium">Memuat data dokumen...</span>
                            </div>
                          </td>
                        </tr>
                      ) : 
                      
                      /* KONDISI 2: DATA KOSONG */
                      contentManagerDocs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 opacity-50">Data tidak ditemukan.</td>
                        </tr>
                      ) : 
                      
                      /* KONDISI 3: ADA DATA (MAPPING) */
                      contentManagerDocs.map(doc => (
                        <tr key={doc.id} className={`group ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                          
                          {/* Judul & Ukuran */}
                          <td className="px-6 py-4">
                            <p className="font-medium truncate max-w-xs" title={doc.title}>{doc.title}</p>
                            <p className="text-xs opacity-60">{formatBytes(doc.file_size)}</p>
                          </td>
                          
                          {/* Pengunggah */}
                          <td className="px-6 py-4 text-xs opacity-70">{doc.uploader_id}</td>
                          
                          {/* Status Badge */}
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold border 
                              ${doc.status === 'APPROVED' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                                doc.status === 'REJECTED' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                                "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}`}>
                              {doc.status}
                            </span>
                          </td>
                          
                          {/* Tombol Aksi */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleOpenPdf(doc.file_path)} className="p-1.5 hover:bg-blue-500/10 text-blue-500 rounded" title="Lihat"><Eye className="w-4 h-4"/></button>
                              {doc.status !== 'APPROVED' && <button onClick={() => handleApprove(doc.id)} className="p-1.5 hover:bg-green-500/10 text-green-500 rounded" title="Setujui"><CheckCircle className="w-4 h-4"/></button>}
                              <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded" title="Hapus"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* --- PREVIEW MODAL --- */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-2xl p-6 shadow-2xl ${isDarkMode ? "bg-[#1e2130]" : "bg-white"}`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold">Tinjau Dokumen</h3>
                <p className="opacity-60 text-sm mt-1 line-clamp-1">{previewItem.title}</p>
              </div>
              <button onClick={() => setPreviewItem(null)} className="hover:text-red-500"><XCircle className="w-6 h-6" /></button>
            </div>
            
            <div className={`w-full h-40 rounded-xl flex flex-col items-center justify-center border-2 border-dashed mb-6 ${isDarkMode ? "bg-[#151725] border-gray-700" : "bg-gray-50 border-gray-300"}`}>
              <FileText className="w-12 h-12 opacity-20 mb-2" />
              <p className="opacity-50 text-sm">Pratinjau PDF</p>
              <p className="text-xs opacity-40 mt-1 max-w-md text-center">{previewItem.description}</p>
              
              <button onClick={() => handleOpenPdf(previewItem.file_path)} className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg shadow transition">
                Buka File Asli di Tab Baru
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
              <button onClick={() => handleReject(previewItem.id)} className="px-5 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 font-bold transition">Tolak Berkas</button>
              <button onClick={() => handleApprove(previewItem.id)} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg transition">Setujui & Terbitkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;