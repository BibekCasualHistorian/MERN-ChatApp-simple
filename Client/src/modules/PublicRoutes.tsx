import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const PublicRoutes = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default PublicRoutes;
