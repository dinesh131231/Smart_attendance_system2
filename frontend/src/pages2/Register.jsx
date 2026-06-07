import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaUserPlus, FaUser, FaEnvelope, FaLock, FaKey, FaUserTag, FaUserShield, FaGraduationCap } from "react-icons/fa";

const PORT = import.meta.env.VITE_PORT || "http://localhost:3000";
const API = `${PORT}/api/auth/register`;

function Register() {
  const [activeRole, setActiveRole] = useState("student"); // 'student' | 'admin'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [adminKey, setAdminKey] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(API, {
        name,
        email,
        password,
        adminKey,
        role: activeRole,
      });
      setMessage("Registration successful ✅");
      // Redirect to role-specific login
      if (activeRole === "admin") {
        navigate("/adminlogin", { replace: true });
      } else if((activeRole === "student")) {
        navigate("/login", { replace: true });
      }else{
        navigate("/register")
      }

    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed ❌");
    }
  };

  const isAdmin = activeRole === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 sm:p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className={`p-4 rounded-full inline-block mb-3 transition-colors duration-300 ${isAdmin ? "bg-indigo-100" : "bg-purple-100"}`}>
            {isAdmin
              ? <FaUserShield className="text-3xl text-indigo-600" />
              : <FaGraduationCap className="text-3xl text-purple-600" />
            }
          </div>
          <h2 className={`text-2xl sm:text-3xl font-bold transition-colors duration-300 ${isAdmin ? "text-indigo-700" : "text-purple-700"}`}>
            Create Account
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Register to join Face Attendance System
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-gray-100 rounded-full p-1 mb-6">
          <button
            type="button"
            onClick={() => { setActiveRole("student"); setMessage(""); setAdminKey(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all duration-300
              ${!isAdmin ? "bg-purple-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
          >
            <FaGraduationCap /> Student
          </button>
          <button
            type="button"
            onClick={() => { setActiveRole("admin"); setMessage(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all duration-300
              ${isAdmin ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
          >
            <FaUserShield /> Admin
          </button>
        </div>

        {/* Role Label Badge */}
        <div className={`text-center mb-4`}>
          <span className={`inline-block px-4 py-1 rounded-full text-xs font-semibold
            ${isAdmin ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"}`}>
            {isAdmin ? "👨‍💼 Admin Registration" : "🎓 Student Registration"}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">

          {/* Name */}
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <FaUser className="text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent outline-none w-full text-sm"
              required
            />
          </div>

          {/* Email */}
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <FaEnvelope className="text-gray-400 mr-2 shrink-0" />
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none w-full text-sm"
              required
            />
          </div>

          {/* Password */}
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <FaLock className="text-gray-400 mr-2 shrink-0" />
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent outline-none w-full text-sm"
              required
            />
          </div>

          {/* Admin Key — only for admin */}
          {isAdmin && (
            <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-full px-4 py-2">
              <FaKey className="text-indigo-400 mr-2 shrink-0" />
              <input
                type="password"
                placeholder="Admin Secret Key (required)"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="bg-transparent outline-none w-full text-sm text-indigo-700 placeholder-indigo-300"
                required
              />
            </div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            className={`w-full text-white py-2 rounded-full shadow-md hover:shadow-lg transition font-medium
              ${isAdmin ? "bg-indigo-600 hover:bg-indigo-700" : "bg-purple-600 hover:bg-purple-700"}`}
          >
            Register as {isAdmin ? "Admin" : "Student"}
          </button>

          {/* Login Link — role-specific */}
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to={isAdmin ? "/adminlogin" : "/login"}
              className={`font-semibold hover:underline ${isAdmin ? "text-indigo-600" : "text-purple-600"}`}
            >
              {isAdmin ? "Admin Login" : "Student Login"}
            </Link>
          </p>

          {/* Home Button */}
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

        {/* Message */}
        {message && (
          <p className={`mt-4 text-center text-sm font-medium ${message.includes("✅") ? "text-green-500" : "text-red-500"}`}>
            {message}
          </p>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Face Attendance System
        </p>

      </div>
    </div>
  );
}

export default Register;