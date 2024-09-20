import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const PrivateRoutes = () => {
  const storeData = useSelector((state: RootState) => state.user);
  // console.log("storeData", storeData);

  const { isAuthenticated } = storeData;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  return <Outlet />;
};

export default PrivateRoutes;
