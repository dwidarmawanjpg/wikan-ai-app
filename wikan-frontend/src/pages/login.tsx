import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "../context/theme-context";
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import api from "../api";

// --- Schema Login ---
const loginSchema = z.object({
  email: z.string().email("Format email salah"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginInputs = z.infer<typeof loginSchema>;

type LoginResponse = {
  access_token: string;
  token_type: string;
  role: string;
};

const Login = () => {
  const navigate = useNavigate();
  
  const { isDarkMode } = useTheme(); 

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
  });

 const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
    try {
      const formData = new FormData();
      formData.append("username", data.email);
      formData.append("password", data.password);

      const response = await api.post<LoginResponse>("/auth/login", formData);

      const { access_token, token_type, role } = response.data;

      localStorage.setItem("wikan_token", access_token); 
      localStorage.setItem("wikan_token_type", token_type);
      
      alert(`Login Berhasil! Selamat datang, ${role}!`);
   
      if (role === "CONTRIBUTOR") {
        navigate("/dashboard-contributor");
      } else if (role === "ADMIN") {
        navigate("/dashboard-admin");
      } else {

        navigate("/dashboard");
      }

    } catch (error) {
      console.error(error);
      alert("Login gagal, silahkan periksa email dan password Anda.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    try {
      const res = await api.post<LoginResponse>("/auth/google", {
        token: credentialResponse.credential,
      });

      const { access_token, token_type, role } = res.data;

      localStorage.setItem("wikan_token", access_token);
      localStorage.setItem("wikan_token_type", token_type);

      alert(`Login Google Berhasil! Selamat datang, ${role}!`);

      if (role === "ADMIN") navigate("/dashboard-admin");
      else if (role === "CONTRIBUTOR") navigate("/dashboard-contributor");
      else navigate("/dashboard");

    } catch (error) {
      alert("Login Google Gagal.");
      console.error(error);
    }
  };

  const handleGuestLogin = () => {
    navigate("/dashboard", { state: { isGuest: true } });
  };

  return (
 
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans relative transition-colors duration-300 ${isDarkMode ? "bg-[#0f111a]" : "bg-[#dfe3f8]"}`}>
      
      {/* MODAL SELECTION */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 animate-fadeIn ${isDarkMode ? "bg-[#1e2130]" : "bg-white"}`}>
            
            {/* Header Modal */}
            <div className="bg-[#1A1C43] p-6 text-center relative">
              <h3 className="text-xl font-bold text-white">Bergabunglah dengan WIKAN</h3>
              <p className="text-blue-200 text-sm mt-1">Pilih peran Anda untuk melanjutkan</p>
              <button onClick={() => setIsRegisterModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Pilihan Akun */}
            <div className="p-6 space-y-4">
              {/* Opsi 1: Student */}
              <Link to="/register-user" className={`flex items-center p-4 border-2 border-transparent rounded-xl transition-all group cursor-pointer ${isDarkMode ? "bg-[#151725] hover:border-[#1A1C43] hover:bg-[#1A1C43]/20" : "bg-gray-50 hover:border-[#1A1C43] hover:bg-blue-50"}`}>
                <div className="w-12 h-12 bg-[#1A1C43] text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                </div>
                <div className="ml-4">
                  <h4 className={`font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Pengguna Umum</h4>
                  <p className="text-xs text-gray-500">Akses materi pembelajaran dan mengobrol dengan Chatbot AI</p>
                </div>
              </Link>

              {/* Opsi 2: Contributor */}
              <Link to="/register-contributor" className={`flex items-center p-4 border-2 border-transparent rounded-xl transition-all group cursor-pointer ${isDarkMode ? "bg-[#151725] hover:border-[#6C63FF] hover:bg-[#6C63FF]/20" : "bg-gray-50 hover:border-[#6C63FF] hover:bg-purple-50"}`}>
                <div className="w-12 h-12 bg-[#6C63FF] text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <div className="ml-4">
                  <h4 className={`font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Kontributor</h4>
                  <p className="text-xs text-gray-500">Unggah dokumen dan bantu pengguna lain</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className={`flex w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden h-[650px] z-10 transition-colors duration-300 ${isDarkMode ? "bg-[#1e2130]" : "bg-white"}`}>
        <div className="hidden md:flex w-1/2 bg-[#1A1C43] flex-col justify-between p-12 text-white relative">
          <Link to="/" className="absolute top-6 left-6 flex items-center gap-3 text-white/60 hover:text-white transition-all duration-300 hover:-translate-x-1 group">
            <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </div>
            <span className="font-semibold text-lg tracking-wide">Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-2 mt-10">
              <div className="mb-20">
                <h2 className="text-4xl font-bold leading-tight">Let's Get Back <br />to Learning <br />and Exploring!</h2>
              </div>
            <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
          </div>
        </div>

        <div className={`w-full md:w-1/2 flex flex-col h-full transition-colors duration-300 ${isDarkMode ? "bg-[#1e2130]" : "bg-white"}`}>
          <div className="flex-1 overflow-y-auto p-8 md:p-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
            <div className="max-w-md mx-auto w-full h-full flex flex-col">
              
              <h2 className={`text-3xl font-bold text-center mt-4 mb-8 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Login</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ml-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
          
                    <input {...register("email")} type="email" 
                      className={`w-full pl-11 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition 
                      ${isDarkMode ? "bg-[#151725] text-white placeholder-gray-500" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`} 
                      placeholder="Masukkan Email" 
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ml-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <input {...register("password")} type="password" 
                      className={`w-full pl-11 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition 
                      ${isDarkMode ? "bg-[#151725] text-white placeholder-gray-500" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`} 
                      placeholder="Masukkan Password" 
                    />
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
                </div>

                <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-[#6C63FF] hover:bg-[#5a52d6] text-white font-bold rounded-lg shadow-md transition duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSubmitting ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="relative flex py-6 items-center">
                <div className={`flex-grow border-t ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">atau</span>
                <div className={`flex-grow border-t ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}></div>
              </div>

              <div className="flex justify-center w-full mt-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    console.log('Login Failed');
                    alert('Login Google Gagal');
                  }}
                  theme={isDarkMode ? "filled_black" : "outline"}
                  width="100%"
                  text="continue_with"
                />
              </div>

              <div className="mt-auto pt-8 pb-6 flex flex-col items-center gap-2 text-center">
                <button onClick={handleGuestLogin} className="text-gray-400 hover:text-gray-600 text-sm font-medium transition flex items-center gap-1 group">
                  Lanjutkan sebagai Guest <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>

                <span className="text-sm text-gray-500">Belum punya akun?</span>
                <div className="flex items-center gap-2">  
                  <button onClick={() => setIsRegisterModalOpen(true)} className={`font-bold text-base hover:underline focus:outline-none ${isDarkMode ? "text-indigo-400" : "text-[#1A1C43]"}`}>
                    Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;