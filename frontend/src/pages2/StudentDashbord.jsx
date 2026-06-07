import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { FaSignOutAlt, FaCamera, FaCheckCircle, FaChartBar, FaUserPlus, FaIdCard } from "react-icons/fa";
import * as faceapi from "@vladmandic/face-api";
import { useNavigate } from "react-router-dom";

const PORT = import.meta.env.VITE_PORT || "http://localhost:5000";

function StudentPage() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const regWebcamRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [regCameraOn, setRegCameraOn] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [descriptor, setDescriptor] = useState(null);
  const [facedescriptor, setfaceDescriptor] = useState(null);
  const [captureStatus, setCaptureStatus] = useState("");

  const [activeTab, setActiveTab] = useState("scan");
  const [loggedInEmail] = useState(
    JSON.parse(localStorage.getItem("user"))?.email || ""
  );

  const handleLogout = () => {
    localStorage.clear();   // ✅ clear all data
    navigate("/login");     // ✅ redirect
  };


  const [form, setForm] = useState({
    name: "",
    rollNumber: "",
    email: "loggedInEmail",
    Student_id: "",
    course: "",
  });

  // ─── Real API states ────────────────────────────────────────────────────────
  const [attendanceRecords, setAttendanceRecords] = useState([]);   // history table
  const [attendanceStats, setAttendanceStats] = useState({          // present/absent counts
    present: 0,
    absent: 0,
  });
  const [profile, setProfile] = useState(null);                     // student profile
  const [profileLoading, setProfileLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  // ─── Fetch all attendance records ───────────────────────────────────────────
  const fetchAllAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const res = await fetch(`${PORT}/api/attendance/all`);
      const data = await res.json();
      if (data.success) {
        setAttendanceRecords(data.records);

        // calculate present count from records
        const presentCount = data.records.filter(r => r.status === "Present").length;
        setAttendanceStats({
          present: presentCount,
          absent: data.records.length - presentCount,
        });
      }
    } catch (error) {
      console.error("Fetch attendance error:", error.message);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // ─── Fetch attendance by date ────────────────────────────────────────────────
  const fetchAttendanceByDate = async () => {
    if (!selectedDate) { alert("Please select a date ❌"); return; }
    try {
      setAttendanceLoading(true);
      const formatted = new Date(selectedDate).toDateString();
      const res = await fetch(`${PORT}/api/attendance/date/${formatted}`);
      const data = await res.json();
      if (data.success) {
        setAttendanceRecords(data.records);
      } else {
        setAttendanceRecords([]);
        alert(data.message);
      }
    } catch (error) {
      console.error("Fetch by date error:", error.message);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // ─── Fetch student profile by email ─────────────────────────────────────
  const fetchProfile = async (email) => {
    try {
       if (!email) {
      console.warn("fetchProfile: no email provided, skipping.");
      return;
    }
      setProfileLoading(true);
      
      const res = await fetch(`${PORT}/api/students/email/${email}`);
      const data = await res.json();
      if (data.success) {
       const profiledata=({
          ...data.student,
          totalClasses: data.totalClasses,
          presentCount: data.presentCount,
          absentCount: data.absentCount,
          percentage: data.percentage,
          attendanceRecords: data.attendanceRecords,

        });
        setProfile(profiledata)
        localStorage.setItem("studentProfile", JSON.stringify(profiledata));
      }
    } catch (error) {
      console.error("Fetch profile error:", error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // ✅ Get email from localStorage on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    // const email = JSON.parse(localStorage.getItem("user"))?.email;

    if (user?.email ) {
      fetchProfile(user.email);
      setForm(prev => ({ ...prev, email: user.email })); // ✅ auto fill
    } else {
    console.log("No email found ❌");
  }
    
  }, []);

  // useEffect(() => {
  //   const stored = localStorage.getItem("studentProfile");
  //   if (stored) {
  //     setProfile(JSON.parse(stored));
  //     setProfileLoading(false);
  //   } else {
  //     setProfileLoading(false);
  //   }
  // }, []);
  //for debuging
  // In dashboard useEffect
  useEffect(() => {
    const stored = localStorage.getItem("studentProfile");
    // console.log("1. localStorage studentProfile:", stored);      // null or data?

    const user = localStorage.getItem("user");
    // console.log("2. localStorage user:", user);                  // email there?

    const token = localStorage.getItem("token");
    // console.log("3. localStorage token:", token);                // token there?

    if (stored) {
      const parsed = JSON.parse(stored);
      // console.log("4. profile.name:", parsed.name);              // name correct?
      // console.log("5. profile.totalClasses:", parsed.totalClasses); // stats there?
      setProfile(parsed);
    }
    // setProfileLoading(false);
  }, []);


  // ─── Load on mount ───────────────────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    fetchAllAttendance();
    if (user?.email) fetchProfile(user.email);
  }, []);

  // ─── Attendance scan capture ─────────────────────────────────────────────────
  const capture = async () => {
    if (!webcamRef.current?.video) { alert("Webcam not ready ❌"); return; }
    const videoEl = webcamRef.current.video;
    if (videoEl.readyState !== 4) { alert("Video stream not ready, try again ❌"); return; }

    const detection = await faceapi
      .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) { alert("Face not detected, please look at the camera ❌"); return; }

    const descriptor = Array.from(detection.descriptor);
    setfaceDescriptor(descriptor);

    try {
      const res = await fetch(`${PORT}/api/face/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor }),
      });

      if (!res.ok) { alert(`Server error: ${res.status} ❌`); return; }

      const data = await res.json();
      console.log("Match response:", data);

      if (data.match) {
        if (data.alreadyMarked) {
          alert(`⚠️ ${data.message}`);
        } else {
          alert(`✅ Attendance marked for ${data.student.name} (${data.student.rollNumber})`);
          fetchAllAttendance(); // ✅ refresh history + stats after marking
          fetchProfile(data.student.email); // ✅ refresh profile
        }
      } else {
        alert(`❌ ${data.message || "Face not recognized"}`);
      }

    } catch (error) {
      console.error("Fetch error:", error);
      alert("❌ Could not connect to server. Make sure backend is running.");
    }
  };

  // ─── Register: capture face descriptor ──────────────────────────────────────
  const captureRegFace = async () => {
    try {
      if (!regWebcamRef.current) { setCaptureStatus("Camera not ready ❌"); return; }
      const screenshot = regWebcamRef.current.getScreenshot();
      if (!screenshot) { setCaptureStatus("Failed to capture image ❌"); return; }
      const img = await faceapi.fetchImage(screenshot);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) { setCaptureStatus("❌ No face detected. Try again."); return; }

      setDescriptor(Array.from(detection.descriptor));
      setCaptureStatus("✅ Face captured successfully!");
    } catch (error) {
      console.error("Error capturing face:", error);
    }
  };

  // ─── Register: submit form ───────────────────────────────────────────────────
  const handleRegisterSubmit = async () => {
    const { name, rollNumber, email, Student_id, course } = form;
    if (!name || !rollNumber || !email || !Student_id || !course) {
      alert("Please fill all fields."); return;
    }
    if (!descriptor) { alert("Please capture your face first."); return; }

    try {
      const res = await fetch(`${PORT}/api/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          faceDescriptors: descriptor ?
            (Array.isArray(descriptor) ? descriptor : Array.from(descriptor)) :
            [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("🎉 Student registered successfully!");
        setForm({ name: "", rollNumber: "", email: "", Student_id: "", course: "" });
        setDescriptor(null);
        setCaptureStatus("");
        setRegCameraOn(false);
      } else {
        alert("❌ Registration failed. Try again.");
      }
    } catch (error) {
      console.error("Register error:", error);
    }
  };

  // ─── Load face-api models ────────────────────────────────────────────────────
  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    };
    loadModels();
  }, []);

  // ─── Real-time face detection box ───────────────────────────────────────────
  useEffect(() => {
    if (!cameraOn) return;
    const interval = setInterval(async () => {
      if (!webcamRef.current) return;
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
      const resized = faceapi.resizeResults(detection, displaySize);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (resized) {
        setIsFaceDetected(true);
        faceapi.draw.drawDetections(canvas, resized, { boxColor: "#7c3aed" });
      } else {
        setIsFaceDetected(false);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [cameraOn]);

  const tabs = [
    { id: "scan", label: "Live Scan", icon: <FaCamera /> },
    { id: "register", label: "Register", icon: <FaUserPlus /> },
    { id: "profile", label: "My Profile", icon: <FaIdCard /> },
  ];

  // ─── Attendance rate calculation ─────────────────────────────────────────────
  const totalAttendance = attendanceStats.present + attendanceStats.absent;
  const attendanceRate = totalAttendance > 0
    ? Math.round((attendanceStats.present / totalAttendance) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 px-4 py-6">

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-700">
          Student Dashboard
        </h1>
        <p className="text-gray-600 text-sm">Face Attendance System</p>

        {/* Top Right Logout Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white text-purple-600 border border-purple-200 px-4 py-2 rounded-full shadow-md hover:bg-purple-600 hover:text-white transition-all duration-300 text-sm font-medium"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>


      {/* Tab Navigation */}
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium shadow transition text-sm
              ${activeTab === t.id
                ? "bg-purple-600 text-white shadow-purple-300 shadow-md"
                : "bg-white text-gray-600 hover:bg-purple-50"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">

        {/* TAB 1 — Live Scan + Attendance + History */}
        {activeTab === "scan" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Webcam */}
            <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaCamera /> Live Scan
              </h2>
              <div className="relative w-full">
                {cameraOn ? (
                  <>
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="rounded-xl w-full h-52 sm:h-64 object-cover"
                      videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                    />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-52 sm:h-64" />
                  </>
                ) : (
                  <div className="w-full h-52 sm:h-64 flex items-center justify-center bg-gray-100 rounded-xl text-gray-400">
                    Camera is Off
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm">
                {isFaceDetected
                  ? <span className="text-green-500 font-medium">Face Detected ✅</span>
                  : <span className="text-gray-500">Align your face properly 👤</span>}
              </p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setCameraOn(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-md text-sm">
                  Open Camera
                </button>
                <button onClick={() => setCameraOn(false)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-md text-sm">
                  Close Camera
                </button>
              </div>
              <button onClick={capture}
                className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition text-sm">
                Scan Face
              </button>
            </div>

            {/* ✅ Attendance Stats — now from real API */}
            <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FaCheckCircle /> Attendance
                </h2>
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-3xl font-bold text-purple-600">{attendanceStats.present}</p>
                    <p className="text-sm text-gray-500 mt-1">Present</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-400">{attendanceStats.absent}</p>
                    <p className="text-sm text-gray-500 mt-1">Absent</p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Attendance Rate</span>
                    <span>{attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-purple-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={capture}
                className="mt-6 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full shadow-md hover:shadow-lg transition text-sm">
                Mark Attendance
              </button>
            </div>

            {/* ✅ Attendance History — now from real API */}
            <div className="bg-white rounded-2xl shadow-lg p-4 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <FaChartBar /> Attendance History
                </h2>
                {/* Date filter */}
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
                  />
                  <button
                    onClick={fetchAttendanceByDate}
                    className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-sm hover:bg-purple-700">
                    🔍 Filter
                  </button>
                  <button
                    onClick={fetchAllAttendance}
                    className="bg-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-sm hover:bg-gray-300">
                    🔄 All
                  </button>
                </div>
              </div>

              {/* Loading */}
              {attendanceLoading && (
                <p className="text-center text-gray-400 text-sm py-4">Loading...</p>
              )}

              {/* No records */}
              {!attendanceLoading && attendanceRecords.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">No attendance records found.</p>
              )}

              {/* Records */}
              {!attendanceLoading && attendanceRecords.length > 0 && (
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {attendanceRecords.map((item, index) => (
                    <div key={item._id || index} className="flex justify-between text-sm py-2.5 px-1">
                      <span className="text-gray-600">{item.date} &nbsp;·&nbsp; {item.time}</span>
                      <span className={`font-medium px-3 py-0.5 rounded-full text-xs
                        ${item.status === "Present"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2 — Register (unchanged) */}
        {activeTab === "register" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-5 flex items-center gap-2">
                <FaUserPlus /> Register Student
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", key: "name", placeholder: "e.g. Aryan Sharma" },
                  { label: "Roll Number", key: "rollNumber", placeholder: "e.g. CS2024001" },
                  // { label: "Email", key: "email", placeholder: "e.g. aryan@edu.in" },
                  { label: "Student ID", key: "Student_id", placeholder: "e.g. STU2024001" },
                  { label: "Course", key: "course", placeholder: "e.g. B.Tech CSE" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} className={key === "email" ? "sm:col-span-2" : ""}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input
                    type="text"
                    value={form.email}
                    readOnly
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-100 cursor-not-allowed text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    * Locked to your login email
                  </p>
                </div>
              </div>
              <button onClick={handleRegisterSubmit}
                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-full shadow-md hover:shadow-lg transition font-medium text-sm">
                Submit Registration
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaCamera /> Capture Face
              </h2>
              <div className="relative w-full">
                {regCameraOn ? (
                  <Webcam
                    ref={regWebcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded-xl w-full h-52 sm:h-64 object-cover"
                    videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                  />
                ) : (
                  <div className="w-full h-52 sm:h-64 flex flex-col items-center justify-center bg-gray-50 rounded-xl text-gray-400 border-2 border-dashed border-gray-200">
                    <FaCamera className="text-3xl mb-2 opacity-30" />
                    <span className="text-sm">Camera is Off</span>
                  </div>
                )}
              </div>
              {captureStatus && (
                <p className={`mt-2 text-sm font-medium ${captureStatus.startsWith("✅") ? "text-green-500" : "text-red-500"}`}>
                  {captureStatus}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                <button onClick={() => setRegCameraOn(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-md text-sm">
                  Open Camera
                </button>
                <button onClick={() => setRegCameraOn(false)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-md text-sm">
                  Close Camera
                </button>
                <button onClick={captureRegFace}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-md text-sm">
                  Capture
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-400 text-center">
                Open the camera, position your face clearly,<br />then click <strong>Capture</strong> before submitting.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3 — Profile — now from real API */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-5 flex items-center gap-2">
                <FaIdCard /> Student Profile
              </h2>

              {profileLoading ? (
                <p className="text-gray-400 text-sm text-center py-8">Loading profile...</p>
              ) : !profile ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Profile not loaded. Scan your face to load profile.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 text-2xl font-bold shadow-inner">
                      {profile.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">{profile.name}</p>
                      <p className="text-sm text-purple-500">{profile.course}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: "Email", value: profile.email },
                      { label: "Student ID", value: profile.Student_id },
                      { label: "Course", value: profile.course },
                      { label: "Roll Number", value: profile.rollNumber },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-3 text-sm">
                        <span className="text-gray-400 font-medium">{label}</span>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ✅ Attendance Summary — from real API */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between">
              <h2 className="text-lg font-semibold text-gray-700 mb-5 flex items-center gap-2">
                <FaCheckCircle /> Attendance Summary
              </h2>

              {profileLoading ? (
                <p className="text-gray-400 text-sm text-center py-8">Loading...</p>
              ) : !profile ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Scan your face first to view summary.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-purple-50 rounded-xl py-4">
                      <p className="text-2xl font-bold text-purple-600">{profile.totalClasses}</p>
                      <p className="text-xs text-gray-500 mt-1">Total Classes</p>
                    </div>
                    <div className="bg-green-50 rounded-xl py-4">
                      <p className="text-2xl font-bold text-green-500">{profile.presentCount}</p>
                      <p className="text-xs text-gray-500 mt-1">Present</p>
                    </div>
                    <div className="bg-red-50 rounded-xl py-4">
                      <p className="text-2xl font-bold text-red-400">
                        {profile.absentCount}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Absent</p>
                    </div>
                  </div>
                  {/* ✅ Real attendance percentage */}
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                      style={{ width: `${profile.percentage}%` }}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Overall Attendance</span>
                      <span className="font-semibold text-purple-600">{attendanceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                    {attendanceRate < 75 && (
                      <p className="text-xs text-red-400 mt-2">⚠️ Attendance below 75%. Please attend more classes.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default StudentPage;