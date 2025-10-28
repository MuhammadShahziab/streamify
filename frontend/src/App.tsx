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

const App = () => {
  const { authUser, isLoading } = useAuthUser();
  const isAuthenticated = Boolean(authUser);
  const isOnBoarded = authUser?.isOnBoarded;
  if (isLoading) {
    return <LoadingOverLay></LoadingOverLay>;
  }
  return (
    <div className="h-screen" data-theme="night">
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
          path="/notifications"
          element={
            isAuthenticated && isOnBoarded ? (
              <NotificationPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        ></Route>
        {/* <Route
          path="/verify-otp"
          element={
            isAuthenticated && !authUser?.isVerified ? (
              <OtpPage />
            ) : (
              <Navigate
                to={
                  isAuthenticated && isOnBoarded && authUser.isVerified
                    ? "/"
                    : "login"
                }
              />
            )
          }
        ></Route> */}
        <Route path="/verify-otp" element={<OtpPage />}></Route>
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;
