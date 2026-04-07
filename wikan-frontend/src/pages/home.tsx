import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoWikanLight from "../assets/wikan-logo-light.svg";
import logoWikanDark from "../assets/wikan-logo-dark.svg";
import { useTheme } from "../context/theme-context";
import {
  Bot,
  UploadCloud,
  MessageSquare,
  Search,
  Brain,
  Quote, 
  Library, 
  Zap,
  CheckCircle2,
  Users,
  Heart,      
  BookOpen,    
  Target,      
  ShieldCheck,     
  Sparkles,   
  ArrowRight   
} from "lucide-react";



// --- COMPONENT INTERAKTIF FITUR ---
const FeatureSwitcher = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      id: 0,
      title: "Contextual Memory",
      desc: "WIKAN mengingat curhatan atau pertanyaanmu sebelumnya. Diskusi jadi lebih nyambung tanpa perlu menjelaskan ulang situasimu.",
      icon: Brain,
      color: "blue",
      preview: {
        user: "Kenapa ya aku sering merasa lelah padahal sudah tidur cukup?",
        ai: "Itu bisa jadi tanda kelelahan emosional atau 'academic burnout'. Bukan cuma fisik, tapi mentalmu juga butuh istirahat dari tekanan tugas.",
        userNext: "Terus, gimana cara mengatasinya tanpa tertinggal pelajaran?",
        aiNext: "Coba terapkan 'Active Rest'. Alih-alih tidur seharian, lakukan hobi ringan 15-30 menit di sela belajar. Ini membantu mereset fokus tanpa membuatmu merasa bersalah."
      }
    },
    {
      id: 1,
      title: "Smart Citation",
      desc: "Jangan asal percaya info internet. WIKAN menjawab pertanyaanmu berdasarkan jurnal valid, lengkap dengan bukti halamannya.",
      icon: Quote,
      color: "purple",
      preview: {
        user: "Apakah stres akademik benar-benar berpengaruh ke nilai ujian?",
        ai: "Ya, sangat berpengaruh. Riset menunjukkan tingkat stres tinggi berkorelasi negatif dengan IPK karena menurunkan fungsi kognitif dan memori jangka pendek.",
        citation: "Lihat: Jurnal Psikologi Pendidikan 2023 (Hal. 42)"
      }
    },
    {
      id: 2,
      title: "Cross-Doc Analysis",
      desc: "Bingung memilih metode belajar? Bandingkan berbagai teori dari beberapa dokumen sekaligus untuk menemukan yang pas buatmu.",
      icon: Library,
      color: "indigo",
      preview: {
        user: "Apa bedanya teknik Pomodoro sama Flowtime buat belajar?",
        ai: "Pomodoro (Dokumen A) lebih ketat dengan interval 25 menit, cocok saat kamu susah mulai (prokrastinasi). Sedangkan Flowtime (Dokumen B) lebih fleksibel mengikuti fokusmu, cocok untuk tugas berat.",
        citation: "Analisis Sintesis dari 2 Artikel Produktivitas"
      }
    },
    {
      id: 3,
      title: "Flash Summary",
      desc: "Pahami panduan kesehatan mental atau materi kuliah yang panjang dalam sekejap. Hemat waktu, kurangi overthinking.",
      icon: Zap,
      color: "yellow",
      preview: {
        user: "Tolong ringkas poin penting dari panduan manajemen stres ini.",
        ai: "Ini intinya:\n1. Validasi perasaanmu, jangan ditolak.\n2. Atur ekspektasi akademik yang realistis.\n3. Cari 'support system' (teman/konselor) saat beban terasa berat.",
        citation: "Panduan_Manajemen_Stres_Mahasiswa.pdf"
      }
    }
  ];

  

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-stretch">
      
      {/* --- MENU KIRI (LIST FITUR) --- */}
      <div className="w-full lg:w-5/12 space-y-3">
        {features.map((feature, idx) => (
          <button
            key={feature.id}
            onClick={() => setActiveTab(idx)}
            className={`w-full text-left p-5 rounded-2xl transition-all duration-300 border relative overflow-hidden group
              ${activeTab === idx 
                ? (isDarkMode ? "bg-[#1e2130] border-indigo-500 shadow-lg shadow-indigo-500/10" : "bg-white border-indigo-500 shadow-xl shadow-indigo-100 scale-[1.02]") 
                : (isDarkMode ? "bg-transparent border-gray-800 hover:bg-[#1A1C43]" : "bg-transparent border-transparent hover:bg-white hover:shadow-md")
              }`}
          >
 
            {activeTab === idx && (
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-2xl"></div>
            )}

            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl transition-colors duration-300 flex-shrink-0
                ${activeTab === idx 
                  ? "bg-indigo-600 text-white" 
                  : (isDarkMode ? "bg-gray-800 text-gray-400 group-hover:bg-gray-700" : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600")
                }`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold mb-1 transition-colors ${activeTab === idx ? "text-indigo-500" : (isDarkMode ? "text-white" : "text-[#1A1C43]")}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {feature.desc}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* --- PREVIEW KANAN (SIMULASI CHAT) --- */}
      <div className="w-full lg:w-7/12 min-h-[450px]">
        <div className={`relative h-full rounded-3xl overflow-hidden border flex flex-col shadow-2xl transition-colors duration-300
          ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-200"}`}>
          
          {/* 1. Header Browser Mockup */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? "bg-[#151725] border-gray-700" : "bg-gray-50 border-gray-100"}`}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className={`text-xs font-medium tracking-wide opacity-50 ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
              WIKAN User Interface
            </div>
            <div className="w-4"></div> {/* Spacer */}
          </div>

          {/* 2. Chat Area */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Menggunakan Key agar animasi reset saat tab berubah */}
            <div key={activeTab} className="space-y-6 animate-fadeIn">
              
              {/* Bubble User */}
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-none text-sm max-w-[85%] shadow-md">
                  {features[activeTab].preview.user}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <Bot className="w-5 h-5 text-indigo-500" />
                </div>
                <div className={`flex-1 p-4 rounded-2xl rounded-tl-none text-sm shadow-sm border
                  ${isDarkMode ? "bg-[#151725] border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
            
                  <div className="whitespace-pre-line leading-relaxed">
                    {features[activeTab].preview.ai}
                  </div>
       
                  {features[activeTab].preview.citation && (
                    <div className={`mt-3 pt-3 border-t flex items-center gap-2 text-xs font-semibold
                      ${isDarkMode ? "border-gray-700 text-green-400" : "border-gray-200 text-green-600"}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {features[activeTab].preview.citation}
                    </div>
                  )}
                </div>
              </div>

              {features[activeTab].preview.userNext && (
                <>
                  <div className="flex justify-end animate-fadeIn" style={{ animationDelay: "0.2s" }}>
                    <div className="bg-indigo-500/90 text-white px-5 py-3 rounded-2xl rounded-tr-none text-sm max-w-[85%] shadow-md">
                      {features[activeTab].preview.userNext}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 animate-fadeIn" style={{ animationDelay: "0.4s" }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                      <Bot className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className={`flex-1 p-4 rounded-2xl rounded-tl-none text-sm shadow-sm border
                      ${isDarkMode ? "bg-[#151725] border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                      {features[activeTab].preview.aiNext}
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* 3. Input Bar Mockup */}
          <div className={`p-4 border-t ${isDarkMode ? "bg-[#151725] border-gray-700" : "bg-white border-gray-100"}`}>
            <div className={`h-12 rounded-full flex items-center px-4 gap-3 border ${isDarkMode ? "bg-[#0f111a] border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <div className={`flex-1 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                Ketik pertanyaan lanjutan untuk Wikan...
              </div>
              <div className="p-1.5 bg-indigo-600 rounded-full text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};


const Home = () => {
  const navigate = useNavigate();

  const { isDarkMode, toggleTheme } = useTheme();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Fungsi untuk masuk sebagai Guest
  const handleTryGuest = () => {
    navigate("/dashboard", { state: { isGuest: true } });
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#0f111a] text-gray-100" : "bg-white text-gray-800"}`}>

      {/* --- 1. NAVBAR --- */}
      <nav className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b transition-colors duration-300 ${isDarkMode ? "bg-[#0f111a]/80 border-gray-800" : "bg-white/80 border-gray-100"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${isDarkMode ? "bg-[#1A1C43]" : "bg-[#FFFFFF]"}`}>
                <img src={isDarkMode ? logoWikanLight : logoWikanDark} alt="Wikan Logo" className="w-10 h-10 rounded-xl object-contain" />
              </div>
              <span className={`text-2xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>WIKAN</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8">
              {/* Beranda: Menuju ke Hero Section */}
              <a href="#beranda" className={`font-medium transition ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-[#6C63FF]"}`}>
                Beranda
              </a>
  
              <a href="#features" className={`font-medium transition ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-[#6C63FF]"}`}>
                Fitur
              </a>

              <a href="#cara-kerja" className={`font-medium transition ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-[#6C63FF]"}`}>
                Cara Kerja
              </a>

              <a href="#about" className={`font-medium transition ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-[#6C63FF]"}`}>
                Tentang
              </a>
            </div>

            <div className="flex items-center gap-3">

              {/* TOMBOL TOGGLE DARK MODE */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition ${isDarkMode ? "bg-gray-800 text-yellow-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (

                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (

                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>

              <Link to="/login" className={`hidden md:block px-5 py-2.5 font-bold rounded-full transition border ${isDarkMode ? "border-gray-700 text-white hover:bg-gray-800" : "border-transparent text-[#1A1C43] hover:bg-gray-100"}`}>
                Login
              </Link>

              <div className="relative">
                <button
                  onClick={() => setIsRegisterOpen(!isRegisterOpen)}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-[#5a52d6] hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  Register
                  {/* Icon Panah Kecil (Berputar jika aktif) */}
                  <svg className={`w-4 h-4 transition-transform duration-200 ${isRegisterOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isRegisterOpen && (
                  <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsRegisterOpen(false)}></div>
                )}

                {/*Menu Dropdown */}
                {isRegisterOpen && (
                  <div className={`absolute right-0 top-full mt-3 w-64 rounded-2xl shadow-2xl border overflow-hidden z-20 animate-fadeIn origin-top-right
                    ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-100"}`}
                  >
                    <div className="p-2 space-y-1">

                      {/* Pilihan 1: Student */}
                      <Link
                        to="/register-user"
                        onClick={() => setIsRegisterOpen(false)} 
                        className={`flex items-center gap-3 p-3 rounded-xl transition group
                        ${isDarkMode ? "hover:bg-[#1A1C43]" : "hover:bg-blue-50"}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0
                          ${isDarkMode ? "bg-[#151725] group-hover:bg-indigo-600 text-white" : "bg-blue-100 group-hover:bg-[#1A1C43] text-[#1A1C43] group-hover:text-white"}`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Pengguna Umum</p>
                          <p className="text-xs text-gray-500">Fokus Belajar</p>
                        </div>
                      </Link>

                      {/* Pilihan 2: Contributor */}
                      <Link
                        to="/register-contributor"
                        onClick={() => setIsRegisterOpen(false)} 
                        className={`flex items-center gap-3 p-3 rounded-xl transition group
                        ${isDarkMode ? "hover:bg-[#1A1C43]" : "hover:bg-purple-50"}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0
                          ${isDarkMode ? "bg-[#151725] group-hover:bg-[#6C63FF] text-white" : "bg-purple-100 group-hover:bg-[#6C63FF] text-[#6C63FF] group-hover:text-white"}`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Kontributor</p>
                          <p className="text-xs text-gray-500">Berbagi Pengetahuan</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden" id="beranda">
        <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full blur-3xl -z-10 transition-opacity ${isDarkMode ? "bg-purple-900/20" : "bg-purple-100 opacity-50"}`}></div>
        <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] rounded-full blur-3xl -z-10 transition-opacity ${isDarkMode ? "bg-blue-900/20" : "bg-blue-100 opacity-50"}`}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <h1 className={`text-5xl md:text-7xl font-extrabold leading-tight mb-6 ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>
            Belajar Lebih Cerdas <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C63FF] to-blue-500">
              Bersama WIKAN
            </span>
          </h1>

          <p className={`text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Platform edukasi berbasis Chatbot AI yang memadukan materi terkini dari kontributor ahli dengan kecerdasan buatan untuk mendukung pembelajaran yang lebih efektif.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleTryGuest}
              className={`px-8 py-4 font-bold text-lg rounded-full shadow-xl transition transform hover:scale-105 flex items-center justify-center gap-2 ${isDarkMode ? "bg-white text-[#1A1C43] hover:bg-gray-200" : "bg-indigo-600 text-white hover:bg-indigo-800"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Mulai Obrolan Sekarang
            </button>
            <Link
              to="/register-contributor"
              className={`px-8 py-4 border-2 font-bold text-lg rounded-full transition flex items-center justify-center gap-2 ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "bg-white text-[#6C63FF] border-[#6C63FF] hover:bg-[#dfe3f8]"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Jadi Kontributor
            </Link>
          </div>

        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6 ">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">

          <div className="w-full md:w-1/2 flex justify-center relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
            <div className={`relative z-10 w-full max-w-md aspect-square rounded-3xl flex items-center justify-center border-4 shadow-2xl overflow-hidden
                ${isDarkMode ? "bg-[#1e2130] border-gray-800" : "bg-white border-white"}`}>
              <div className="text-center">
                <Bot className="w-40 h-40 text-indigo-500 mx-auto mb-4 animate-bounce" />
              </div>
            </div>
          </div>

          {/* BAGIAN KANAN: DESKRIPSI PRODUK */}
          <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
              AI Assistant
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Meet <span className="text-indigo-500">WIKAN</span>
            </h1>

            <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Web-base Intelligence Knowledge Assistant Navigator
            </h2>

            <p className={`text-lg leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              WIKAN adalah asisten cerdas berbasis web yang dirancang untuk menavigasi lautan informasi Anda.
              Cukup unggah file, dan WIKAN akan memahami, menganalisis, dan menjawab setiap pertanyaan Anda
              berdasarkan konteks data yang akurat. Bukan sekadar Chatbot, ini adalah Navigator Pengetahuan Anda.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">

              <button className={`px-8 py-3 rounded-xl font-bold border transition flex items-center justify-center gap-2
                  ${isDarkMode ? "border-gray-700 hover:bg-white/5 text-white" : "border-gray-300 hover:bg-gray-100 text-gray-700"}`}>
                Pelajari Lebih Lanjut
              </button>
            </div>
          </div>

        </div>
      </section>

      
      <section id="features" className={`py-24 transition-colors duration-300 ${isDarkMode ? "bg-[#0f111a]" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>
              Fitur Unggulan WIKAN
            </h2>
            <p className={`font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} max-w-2xl mx-auto`}>
              Bukan lebih dari sekadar chatbot. Lihat bagaimana WIKAN membantu proses riset dan belajarmu.
            </p>
          </div>

          <FeatureSwitcher isDarkMode={isDarkMode} />

        </div>
      </section>


      <section className={`py-20 px-6 transition-colors duration-300 ${isDarkMode ? "bg-[#0f111a]" : "bg-gray-50"}`} id="cara-kerja">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>
              Cara Kerja WIKAN
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 text-center">
            {[
              { 
                step: "01", 
                title: "Upload Dokumen", 
                desc: "Unggah jurnal, skripsi, atau laporan Anda ke sistem untuk mulai diproses.", 
                icon: UploadCloud, 
                iconColor: "blue" 
              },
              { 
                step: "02", 
                title: "AI Processing", 
                desc: "WIKAN membaca, menganalisis, dan mengindeks pengetahuan di dalamnya secara otomatis.", 
                icon: Search, 
                iconColor: "purple" 
              },
              { 
                step: "03", 
                title: "Tanya Jawab", 
                desc: "Chat dengan dokumen Anda layaknya berbicara dengan ahli secara instan.", 
                icon: MessageSquare, 
                iconColor: "green" 
              },
            ].map((item, idx) => (
              <div key={idx} className={`p-8 rounded-3xl shadow-sm hover:shadow-xl transition duration-300 border group flex flex-col items-center text-center ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-100"}`}>
                
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition 
                  ${isDarkMode 
                    ? `bg-${item.iconColor}-900/30 text-${item.iconColor}-400` 
                    : `bg-${item.iconColor}-100 text-${item.iconColor}-600`
                  }`}>
                  <item.icon className="w-7 h-7" />
                </div>

                {/* Title & Description */}
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  {item.title}
                </h3>
                <p className={`leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* --- FEATURES --- */}
      <section id="features" className={`py-24 transition-colors duration-300 ${isDarkMode ? "bg-[#0f111a]" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>Mengapa Memilih WIKAN?</h2>
            <p className={`font-medium mb-4${isDarkMode ? "text-gray-400" : "text-gray-500"} max-w-2xl mx-auto`}>Kami mengintegrasikan teknologi modern dengan kebutuhan pendidikan lokal untuk menciptakan ekosistem belajar yang unggul</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { title: "AI Cerdas & Responsif", desc: "Dapatkan jawaban instan untuk pertanyaan sulit Anda. AI kami dilatih untuk memahami konteks pelajaran sekolah dan kuliah.", iconColor: "blue", path: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
              { title: "Komunitas Kontributor", desc: "Materi bukan hanya dari robot. Guru, Dosen, dan Ahli berkontribusi mengunggah dokumen valid untuk memperkaya pengetahuan sistem.", iconColor: "purple", path: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
              { title: "Terverifikasi & Aman", desc: "Setiap dokumen yang masuk melewati proses validasi. Belajar tenang tanpa takut informasi palsu atau menyesatkan (hoax).", iconColor: "green", path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }
            ].map((feature, idx) => (
              <div key={idx} className={`p-8 rounded-3xl shadow-sm hover:shadow-xl transition duration-300 border group ${isDarkMode ? "bg-[#1e2130] border-gray-700" : "bg-white border-gray-100"}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition ${isDarkMode ? `bg-${feature.iconColor}-900/30 text-${feature.iconColor}-400` : `bg-${feature.iconColor}-100 text-${feature.iconColor}-600`}`}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.path} /></svg>
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{feature.title}</h3>
                <p className={`leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* --- ABOUT SECTION  --- */}
      <section id="about" className={`py-24 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#151725]" : "bg-white"}`}>
        
        {/* Background Decor */}
        <div className={`absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none 
          ${isDarkMode ? "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#151725] to-[#151725]" 
                       : "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white"}`}>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* 1. GAMBARAN SINGKAT (INTRO) */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6 border border-indigo-500/20">
              <Sparkles className="w-3 h-3" />
              Tentang Kami
            </div>
            <h2 className={`text-3xl md:text-5xl font-bold leading-tight mb-6 ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>
              WIKAN: Navigator Cerdas untuk <br />
              <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                Pendidikan Kesehatan Mental
              </span>
            </h2>
            <p className={`text-lg leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              <strong>Web-base Intelligence Knowledge Assistent Navigator (WIKAN)</strong> bukan sekadar mesin penjawab. 
              Kami adalah teman belajar digital yang dirancang untuk menemani pelajar menghadapi tantangan akademik, 
              menghindari kelelahan mental, dan menemukan jawaban yang kredibel.
            </p>
          </div>

          {/*LATAR BELAKANG */}
          <div className="grid md:grid-cols-2 gap-12 mb-24 items-center">
            {/* Sisi Masalah */}
            <div className={`p-8 rounded-3xl border relative overflow-hidden group ${isDarkMode ? "bg-[#1e2130] border-gray-800" : "bg-red-50 border-red-100"}`}>
              <div className={`absolute top-0 right-0 p-4 opacity-10`}>
                <Heart className="w-32 h-32 text-red-500" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 flex items-center gap-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <span className="p-2 rounded-lg bg-red-500 text-white"><Heart className="w-5 h-5" /></span>
                Mengapa Kami Ada?
              </h3>
              <p className={`leading-relaxed mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                Kami memahami bahwa menjadi pelajar itu berat. Tugas yang menumpuk dan materi yang sulit seringkali memicu <strong><em>academic burnout</em></strong>, kelelahan mental, hingga <em>overthinking</em> berkepanjangan.
              </p>
              <p className={`text-sm font-medium ${isDarkMode ? "text-red-300" : "text-red-600"}`}>
                "Kami hadir karena kesehatan mental Anda sama pentingnya dengan nilai akademik Anda."
              </p>
            </div>

            <div className={`p-8 rounded-3xl border relative overflow-hidden group ${isDarkMode ? "bg-[#1e2130] border-gray-800" : "bg-indigo-50 border-indigo-100"}`}>
              <div className={`absolute top-0 right-0 p-4 opacity-10`}>
                <BookOpen className="w-32 h-32 text-indigo-500" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 flex items-center gap-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <span className="p-2 rounded-lg bg-indigo-500 text-white"><ShieldCheck className="w-5 h-5" /></span>
                Solusi WIKAN
              </h3>
              <p className={`leading-relaxed mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                WIKAN memangkas kebingungan Anda. Kami memberikan jawaban instan yang bersumber langsung dari <strong>jurnal, laporan, dan dokumen terpercaya</strong>.
              </p>
              <p className={`text-sm font-medium ${isDarkMode ? "text-indigo-300" : "text-indigo-600"}`}>
                "Belajar lebih efisien, kurangi stres, dan dapatkan informasi yang akurat tanpa rasa cemas."
              </p>
            </div>
          </div>

          {/* VISI, MISI, NILAI & TARGET (GRID LAYOUT) */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            
            {/* Card Visi Misi */}
            <div className={`md:col-span-1 p-6 rounded-2xl border ${isDarkMode ? "bg-[#1A1C43]/50 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h4 className={`text-xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Visi & Misi</h4>
              <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Meningkatkan kesadaran pelajar tentang pentingnya kesehatan mental dalam pendidikan, serta menyediakan akses informasi yang relevan untuk mendukung produktivitas belajar yang sehat.
              </p>
            </div>

            {/* Card What We Offer (Nilai Utama) */}
            <div className={`md:col-span-1 p-6 rounded-2xl border ${isDarkMode ? "bg-[#1A1C43]/50 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className={`text-xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Prinsip Utama</h4>
              <ul className={`space-y-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span> <strong>Kredibel:</strong> Jawaban berbasis data valid.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span> <strong>Empati:</strong> Peduli pada isu burnout.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span> <strong>Efisiensi:</strong> Hemat waktu riset Anda.
                </li>
              </ul>
            </div>

            {/* Card Target Pengguna */}
            <div className={`md:col-span-1 p-6 rounded-2xl border ${isDarkMode ? "bg-[#1A1C43]/50 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h4 className={`text-xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Siapa Target Kami?</h4>
              <p className={`text-sm leading-relaxed mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Platform ini didedikasikan untuk:
              </p>
              <div className="flex flex-wrap gap-2">
                {["Pelajar", "Mahasiswa", "Akademisi", "Peneliti"].map((tag) => (
                  <span key={tag} className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* CALL TO ACTION (KONTAK) */}
          <div className={`rounded-3xl p-10 text-center relative overflow-hidden ${isDarkMode ? "bg-gradient-to-r from-indigo-900 to-purple-900" : "bg-gradient-to-r from-indigo-600 to-[#6C63FF]"}`}>
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Jangan Biarkan Burnout Menghambat Potensimu
              </h3>
              <p className="text-indigo-100 max-w-2xl mx-auto mb-8 text-lg">
                Temukan jawaban yang kamu butuhkan, atasi rasa penasaranmu, dan jadikan proses belajarmu lebih menyenangkan bersama WIKAN.
              </p>
              <button 
                onClick={handleTryGuest}
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-indigo-700 font-bold rounded-full shadow-lg hover:bg-gray-50 transition transform hover:-translate-y-1"
              >
                Mulai Obrolan Sekarang <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          
            <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full translate-x-10 translate-y-10"></div>
          </div>

        </div>
      </section>


      {/* --- 6. FOOTER --- */}
      <footer className={`pt-16 pb-8 border-t transition-colors duration-300 ${isDarkMode ? "bg-[#131520] border-gray-800" : "bg-gray-50 border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${isDarkMode ? "bg-[#1A1C43]" : "bg-[#FFFFFF]"}`}>
                  <img src={isDarkMode ? logoWikanLight : logoWikanDark} alt="Wikan Logo" className="w-10 h-10 rounded-xl object-contain" />
                </div>
                <span className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-[#1A1C43]"}`}>WIKAN</span>
              </div>
              <p className={`max-w-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Membangun masa depan pendidikan dengan teknologi kecerdasan buatan yang inklusif dan terbuka.
              </p>
            </div>

            {[
              { title: "Platform", links: ["Fitur Utama", "Untuk Pelajar", "Untuk Kontributor"] },
              { title: "Perusahaan", links: ["Tentang Kami", "Karir", "Hubungi Kami", "Kebijakan Privasi"] }
            ].map((col, idx) => (
              <div key={idx}>
                <h4 className={`font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{col.title}</h4>
                <ul className={`space-y-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="hover:text-[#6C63FF] transition">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={`border-t pt-8 text-center text-sm ${isDarkMode ? "border-gray-800 text-gray-500" : "border-gray-200 text-gray-400"}`}>
            &copy; {new Date().getFullYear()} Wikan Project. All rights reserved. Made with ❤️ Group 1.
          </div>
        </div>
      </footer>

    </div>
  );
};


export default Home;
