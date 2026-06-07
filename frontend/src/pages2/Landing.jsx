import React from "react";
import { FaUserGraduate, FaUserShield } from "react-icons/fa";
import {  useNavigate,Navigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStudentLogin = () => {
    navigate("/login");
  };

const handleAdminLogin = () => {
    navigate("/adminlogin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl">

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-purple-700">
            Face Attendance System
          </h1>
          <p className="text-gray-600 mt-3 text-sm sm:text-base">
            Secure • Fast • AI Powered
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Student Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 p-6 flex flex-col items-center text-center group">
            <div className="bg-purple-100 p-5 rounded-full mb-4 group-hover:scale-110 transition">
              <FaUserGraduate className="text-4xl text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Student</h2>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              Mark your attendance and track your records easily
            </p>
            <button 
            onClick={handleStudentLogin}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full shadow-md hover:shadow-lg transition">
              Login as Student
            </button>
          </div>

          {/* Admin Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 p-6 flex flex-col items-center text-center group">
            <div className="bg-purple-100 p-5 rounded-full mb-4 group-hover:scale-110 transition">
              <FaUserShield className="text-4xl text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Admin</h2>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              Manage students and monitor attendance analytics
            </p>
            <button 
            onClick={handleAdminLogin}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full shadow-md hover:shadow-lg transition">
              Login as Admin
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-10 text-gray-500 text-xs sm:text-sm">
          © 2026 Face Attendance System
        </div>

      </div>
    </div>
  );
}
