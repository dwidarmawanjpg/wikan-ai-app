import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "../context/theme-context";
import axios from "axios";
import api from "../api";


const registerContributorSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung huruf kecil, huruf besar, dan angka"
    ),
  confirmPassword: z.string(),
  institution: z.string().min(2, "Nama institusi wajib diisi"),
  profession: z.string().min(2, "Profesi wajib diisi"),
  phoneNumber: z.string().min(10, "Nomor telepon minimal 10 digit").regex(/^[0-9]+$/, "Hanya boleh angka"),
  agreement: z
    .boolean()
    .refine((val) => val === true, "Anda harus menyetujui syarat dan ketentuan"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

type RegisterContributorInputs = z.infer<typeof registerContributorSchema>;

const RegisterContributor = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    // reset, 
  } = useForm<RegisterContributorInputs>({
    resolver: zodResolver(registerContributorSchema),
  });


 const onSubmit: SubmitHandler<RegisterContributorInputs> = async (data) => {
    try {
      // --- REGISTER ---
      const registerPayload = {
        email: data.email,
        full_name: data.fullName,
        password: data.password,
        role: "CONTRIBUTOR", 
        institution: data.institution,
        profession: data.profession,
        phone_number: data.phoneNumber 
      };

      console.log("1. Melakukan Registrasi...", registerPayload);
      await api.post("/auth/register", registerPayload);

      // --- AUTO LOGIN ---
      console.log("2. Registrasi Sukses. Melakukan Auto-Login...");
      
      const loginFormData = new FormData();
      loginFormData.append("username", data.email);
      loginFormData.append("password", data.password);

      const loginResponse = await api.post("/auth/login", loginFormData);

      // --- SIMPAN TOKEN & CEK ROLE ---
      const { access_token, token_type, role } = loginResponse.data;
    
      localStorage.removeItem("wikan_token");
      localStorage.setItem("wikan_token", access_token);
      localStorage.setItem("wikan_token_type", token_type);
      
      localStorage.setItem("wikan_user_role", role); 

      // --- REDIRECT SESUAI ROLE ---
      alert(`Selamat bergabung, ${data.fullName}!`);
      
      if (role === "CONTRIBUTOR") {
          navigate("/dashboard-contributor");
      } else {
          navigate("/dashboard");
      }

    } catch (error: any) {
      console.error("Gagal Proses:", error);

      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.detail;
        
        if (typeof errorMessage === "string" && errorMessage.toLowerCase().includes("email")) {
             setError("email", { 
               type: "manual", 
               message: "Email sudah terdaftar. Silakan Login saja." 
             });
        } else {
             alert(`Gagal: ${errorMessage}`);
        }
      } else {
        alert("Terjadi kesalahan koneksi/server.");
      }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#0f111a]" : "bg-[#dfe3f8]"}`}>
      
      <div className={`flex w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden h-[700px] md:h-[650px] transition-colors duration-300 ${isDarkMode ? "bg-[#1e2130]" : "bg-white"}`}>
        
        <div className="hidden md:flex w-1/2 bg-[#1A1C43] flex-col justify-between p-12 text-white relative">
          <Link 
            to="/" 
            className="absolute top-6 left-6 flex items-center gap-3 text-white/60 hover:text-white transition-all duration-300 hover:-translate-x-1 group"
          >
            <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-wide">Kembali ke Beranda</span>
          </Link>


          <div className="flex items-center gap-2 mt-10">
            <h2 className="text-4xl font-bold leading-tight">
              Share <br />
              Knowledge, Help <br />
              Others Grow!
            </h2>
          </div>

          <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
        </div>

        {/* BAGIAN KANAN (Form) */}
        <div className={`w-full md:w-1/2 flex flex-col h-full transition-colors duration-300 ${isDarkMode ? "bg-[#1e2130]" : "bg-white"}`}>
          
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            <div className="max-w-md mx-auto w-full h-full flex flex-col">
              
              {/* JUDUL */}
              <h2 className={`text-3xl font-bold text-center mt-4 mb-8 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                Register Kontributor
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ml-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
 
                    <input 
                      {...register("fullName")} 
                      type="text" 
                      className={`w-full pl-11 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition 
                      ${isDarkMode ? "bg-[#151725] text-white placeholder-gray-500" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`} 
                      placeholder="Masukkan Nama Lengkap" 
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-1">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ml-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input 
                      {...register("email")} 
                      type="email" 
                      className={`w-full pl-11 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition 
                      ${isDarkMode ? "bg-[#151725] text-white placeholder-gray-500" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`} 
                      placeholder="Masukkan Email" 
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ml-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input 
                      {...register("password")} 
                      type="password" 
                      className={`w-full pl-11 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition 
                      ${isDarkMode ? "bg-[#151725] text-white placeholder-gray-500" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`} 
                      placeholder="Masukkan Password" 
                    />
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ml-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Konfirmasi Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input 
                      {...register("confirmPassword")} 
                      type="password" 
                      className={`w-full pl-11 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition 
                      ${isDarkMode ? "bg-[#151725] text-white placeholder-gray-500" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`} 
                      placeholder="Ulangi Password" 
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ml-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Institusi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input 
                      {...register("institution")} 
                      type="text" 
                      className={`w-full pl-11 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition 
                      ${isDarkMode ? "bg-[#151725] text-white placeholder-gray-500" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`} 
                      placeholder="Universitas / Nama Perusahaan" 
                    />
                  </div>
                  {errors.institution && <p className="text-red-500 text-xs mt-1 ml-1">{errors.institution.message}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ml-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Profesi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input 
                      {...register("profession")} 
                      type="text" 
                      className={`w-full pl-11 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition 
                      ${isDarkMode ? "bg-[#151725] text-white placeholder-gray-500" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`} 
                      placeholder="Pengajar / Peneliti / Pelajar" 
                    />
                  </div>
                  {errors.profession && <p className="text-red-500 text-xs mt-1 ml-1">{errors.profession.message}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ml-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Nomor Telpon</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input 
                      {...register("phoneNumber")} 
                      type="text" 
                      className={`w-full pl-11 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition 
                      ${isDarkMode ? "bg-[#151725] text-white placeholder-gray-500" : "bg-gray-100 text-gray-700 placeholder-gray-400"}`} 
                      placeholder="08xxxxxxxxxx" 
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phoneNumber.message}</p>}
                </div>

                <div className="flex items-center pt-2">
                  <input
                    {...register("agreement")}
                    type="checkbox"
                    id="agreement"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agreement" className={`ml-2 block text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Saya setuju dengan <a href="#" className="text-indigo-600 hover:underline">Syarat & Ketentuan</a>
                  </label>
                </div>
                 {errors.agreement && <p className="text-red-500 text-xs ml-1">{errors.agreement.message}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#6C63FF] hover:bg-[#5a52d6] text-white font-bold rounded-lg shadow-md transition duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Processing..." : "Buat Akun Kontributor"}
                </button>
              </form>

              <div className="mt-auto pt-8 pb-6 flex flex-col items-center gap-2 text-center">
                <span className="text-sm text-gray-500">
                  Sudah punya akun?
                </span>
                <Link to="/login" className={`font-bold text-base hover:underline ${isDarkMode ? "text-indigo-400" : "text-[#1A1C43]"}`}>
                  Login
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterContributor;