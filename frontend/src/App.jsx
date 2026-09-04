import { React, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages2/Login'
import Register from './pages2/Register'
import LandingPage from './pages2/Landing'
import StudentPage from './pages2/StudentDashbord'
import AdminLoginPage from './pages2/AdminLogin'
import AdminDashboard from './pages2/Admindashboard'

function App() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");



  return (
    <>
      <Routes>
        {/* <Route path="/student" element={token && role === "student"
          ? <CaptureFace />
            : <Navigate to="/login" />} /> */}
        {/* <Route path="/AddStudent" element={token && role === "admin" ? <AddStudent />:<Navigate to="/login" />} /> */}
        {/* <Route path="/AttendanceReport" element={token && role === "admin" ? <AttendanceReport /> : <Navigate to="/login" />} /> */}
        {/* <Route path="/" element={<Dashboard /> } /> */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/studentpage" element={token && role === "student" ?<StudentPage />:<Navigate to="/login" />} />
        <Route path="/adminlogin" element={<AdminLoginPage />} />
        <Route path="/admindashboard" element={token && role === "admin" ? <AdminDashboard />:<Navigate to="/adminlogin" />} />
      </Routes>

    </>
  )
}

export default App
