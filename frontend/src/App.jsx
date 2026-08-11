import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout, { ProtectedRoute, PublicOnly } from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Circle from "./pages/Circle";
import Explore from "./pages/Explore";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import PostDetail from "./pages/PostDetail";
import People from "./pages/People";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <PublicOnly>
                <VerifyOtp />
              </PublicOnly>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Circle />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/posts/new" element={<CreatePost />} />
            <Route path="/posts/:id/edit" element={<EditPost />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/people" element={<People />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
