import { useState } from "react";
import axios from "axios";
import { FaUserShield, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PORT = import.meta.env.VITE_PORT || "http://localhost:3000";
const API = `${PORT}/api/auth/login`;

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ✅ In login page — store user info
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(API, { email, password });
      const data = res.data;
      console.log(res.data)

      toast.success("Login successful", { autoClose: 3000 });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user", JSON.stringify({ email })); // ✅ store email


      if (data.role === "admin") {
        navigate("/admindashboard", { replace: true });
      } else {
        navigate("/adminlogin", { replace: true });
      }
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 sm:p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-purple-100 p-4 rounded-full inline-block mb-3">
            <FaUserShield className="text-3xl text-purple-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-purple-700">
            Admin Login
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Secure access to dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <FaEnvelope className="text-gray-400 mr-2" />
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none w-full text-sm"
              required
            />
          </div>

          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <FaLock className="text-gray-400 mr-2" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent outline-none w-full text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="ml-2 text-gray-500"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>


          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full shadow-md hover:shadow-lg transition"
          >
            Login
          </button>
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-purple-600 hover:underline font-semibold"
            >
              Register
            </Link>
          </p>

          <div className="flex justify-center">
            <Link to="/">
              <button
                type="button"
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2 rounded-full text-sm transition"
              >
                ⬅ Home
              </button>
            </Link>
          </div>
        </form>

        <ToastContainer position="top-right" autoClose={3000} />

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Face Attendance System
        </p>

      </div>
    </div>
  );
}
export default AdminLoginPage;