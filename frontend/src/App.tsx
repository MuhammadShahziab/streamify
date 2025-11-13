import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotificationPage from "./pages/NotificationPage";
import LoadingOverLay from "./components/LoadingOverLay";
import OtpPage from "./pages/OtpPage";
import { useAuthUser } from "./hooks/useAuthUser";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import FriendsPage from "./pages/FriendsPage";
import ChatPage from "./pages/ChatPage";
import 'stream-chat-react/dist/css/v2/index.css';
import CallPage from "./pages/CallPage";
import { SocketClient } from "./lib/socket";
import ProfilePage from "./pages/ProfilePage";

const App = () => {
  const { authUser, isLoading } = useAuthUser();
  const theme = useThemeStore((t) => t.theme);
  const pendingVerificationEmail = useAuthStore(
    (state) => state.pendingVerificationEmail
  );
  const verificationMeta = useAuthStore((state) => state.verificationMeta);
  const localUser = useAuthStore((state) => state.user);

  const isAuthenticated = Boolean(authUser);
  const isOnBoarded = authUser?.isOnBoarded;
  const isVerified = authUser?.isVerified;

  const hasPendingVerification =
    (!isVerified || !isAuthenticated) &&
    Boolean(
      pendingVerificationEmail ||
        verificationMeta ||
        (localUser && localUser.isVerified === false)
    );

// Call Socket.io connection
SocketClient(authUser?._id || "", isVerified || false);

  if (isLoading) {
    return <LoadingOverLay></LoadingOverLay>;
  }
  return (
    <div className="" data-theme={theme}>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated && isOnBoarded ? (
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        ></Route>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage />
            ) : (
              <Navigate to={isOnBoarded ? "/" : "/onboarding"} />
            )
          }
        ></Route>
        <Route
          path="/signup"
          element={
            !isAuthenticated ? (
              <SignupPage />
            ) : (
              <Navigate to={isOnBoarded ? "/" : "/onboarding"} />
            )
          }
        ></Route>
         <Route
          path="/verify-otp"
          element={
            hasPendingVerification ? (
              <OtpPage />
            ) : isAuthenticated ? (
              <Navigate to={isOnBoarded ? "/" : "/onboarding"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        ></Route>
        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              !isOnBoarded ? (
                <OnboardingPage />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        ></Route>
         <Route
          path="/profile"
          element={
           isAuthenticated && isOnBoarded ? (
              <Layout showSidebar={true}>
                <ProfilePage />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        ></Route>
        <Route
          path="/notifications"
          element={
            isAuthenticated && isOnBoarded ? (
              <Layout showSidebar={true}>
                <NotificationPage />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        ></Route>
        <Route
          path="/friends"
          element={
            isAuthenticated && isOnBoarded ? (
              <Layout showSidebar={true}>
                <FriendsPage />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        ></Route>
        <Route
          path="/chat/:id"
          element={
            isAuthenticated && isOnBoarded ? (
              <Layout showSidebar={false}>
                <ChatPage />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        ></Route>
        <Route
          path="/call/:id"
          element={
            isAuthenticated && isOnBoarded ? (
              <Layout showSidebar={false}>
                <CallPage />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        ></Route>
       
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;
