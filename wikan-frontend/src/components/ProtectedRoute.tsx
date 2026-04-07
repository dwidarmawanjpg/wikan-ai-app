import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem("wikan_token");

  // Jika tidak ada token (sedang Guest Mode/belum login), lempar ke beranda atau login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    // Decode JWT Payload tanpa library tambahan
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const payload = JSON.parse(decodedJson);
    const userRole = payload.role;

    // Jika role saat ini tidak ada di daftar yang diizinkan untuk route tersebut
    if (!allowedRoles.includes(userRole)) {
      // Redirect Cerdas berdasarkan Role Aslinya
      switch (userRole) {
        case "ADMIN":
          return <Navigate to="/dashboard-admin" replace />;
        case "CONTRIBUTOR":
          return <Navigate to="/dashboard-contributor" replace />;
        case "STUDENT":
          return <Navigate to="/dashboard" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }
  } catch (error) {
    // Jika token gagal di-parse (Mungkin token rusak) hapus paksa
    localStorage.removeItem("wikan_token");
    localStorage.removeItem("wikan_token_type");
    return <Navigate to="/login" replace />;
  }

  // Jika lolos semua validasi Role, render children componentnya (Route asli)
  return <Outlet />;
};

export default ProtectedRoute;
