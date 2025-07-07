import { Navigate, Outlet } from "react-router-dom";
import AccesoDenegado from "./AccesoDenegado";
import { useUser } from 'src/components/UserContext.jsx';

const ProtectedRoute = () => {
  const token = localStorage.getItem("accessToken");
  const { user } = useUser();

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (user && user.Permiso && user.Permiso.toLowerCase() === "denegado") {
    return <AccesoDenegado />;
  }

  return <Outlet />;
};

export default ProtectedRoute;