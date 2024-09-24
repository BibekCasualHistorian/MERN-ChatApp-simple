import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ResetPassword from "./pages/auth/ResetPassword";
import PrivateRoutes from "./modules/PrivateRoutes";
import PublicRoutes from "./modules/PublicRoutes"; // Import the new PublicRoutes component
// import Settings from "./pages/settings/Settings";
import NotFound from "./modules/NotFound";
import "./App.css";
import Chat from "./components/home/Chat";
import GroupChat from "./components/home/GroupChat";
import SelectLink from "./components/home/SelectLink";

function App() {
  return (
    <BrowserRouter>
      {/* <SocketProvider> */}
      <Routes>
        {/* Protected Routes  */}

        <Route element={<PrivateRoutes />}>
          <Route path="" element={<Home />}>
            <Route index element={<SelectLink />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/group/:id" element={<GroupChat />} />
          </Route>
        </Route>

        {/* Public Auth Routes  */}
        <Route element={<PublicRoutes />}>
          <Route path="/auth">
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
          </Route>
        </Route>

        {/* Catch-All Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* </SocketProvider> */}
    </BrowserRouter>
  );
}

export default App;
