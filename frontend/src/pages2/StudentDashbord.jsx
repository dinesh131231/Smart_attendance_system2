import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  FaSignOutAlt,
  FaCamera,
  FaCheckCircle,
  FaChartBar,
  FaUserPlus,
  FaIdCard,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
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
  const [captureStatus, setCaptureStatus] = useState("");

  const [activeTab, setActiveTab] = useState("scan");

  // ✅ FIX: read the logged-in email once, safely (was previously
  // hardcoded as the literal string "loggedInEmail" in the form state)
  const [loggedInEmail] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"))?.email || "";
    } catch {
      return "";
    }
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const [form, setForm] = useState({
    name: "",
    rollNumber: "",
    email: loggedInEmail,
    Student_id: "",
    course: "",
  });

  // ─── Real API states ────────────────────────────────────────────────────
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
  });
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  // ─── Edit profile state ─────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    rollNumber: "",
    Student_id: "",
    course: "",
  });
  const [saving, setSaving] = useState(false);

  // ─── Fetch all attendance records ───────────────────────────────────────
  const fetchAllAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const res = await fetch(`${PORT}/api/attendance/all`);
      const data = await res.json();
      if (data.success) {
        setAttendanceRecords(data.records);
        const presentCount = data.records.filter((r) => r.status === "Present").length;
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

  // ─── Fetch attendance by date ────────────────────────────────────────────
  const fetchAttendanceByDate = async () => {
    if (!selectedDate) {
      alert("Please select a date ❌");
      return;
    }
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
    if (!email) {
      console.warn("fetchProfile: no email provided, skipping.");
      setProfileLoading(false);
      return;
    }
    try {
      setProfileLoading(true);
      const res = await fetch(`${PORT}/api/students/email/${email}`);
      const data = await res.json();
      if (data.success) {
        const profileData = {
          ...data.student,
          totalClasses: data.totalClasses,
          presentCount: data.presentCount,
          absentCount: data.absentCount,
          percentage: data.percentage,
          attendanceRecords: data.attendanceRecords,
        };
        setProfile(profileData);
        localStorage.setItem("studentProfile", JSON.stringify(profileData));
      }
    } catch (error) {
      console.error("Fetch profile error:", error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // ✅ Get email from localStorage on component mount
  useEffect(() => {
    if (loggedInEmail) {
      fetchProfile(loggedInEmail);
      setForm((prev) => ({ ...prev, email: loggedInEmail }));
    } else {
      console.log("No email found ❌");
      setProfileLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Restore cached profile immediately (before the network call resolves)
  useEffect(() => {
    const stored = localStorage.getItem("studentProfile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        localStorage.removeItem("studentProfile");
      }
    }
  }, []);

  // ─── Load on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Attendance scan capture ─────────────────────────────────────────────
  const capture = async () => {
    if (!webcamRef.current?.video) {
      alert("Webcam not ready ❌");
      return;
    }
    const videoEl = webcamRef.current.video;
    if (videoEl.readyState !== 4) {
      alert("Video stream not ready, try again ❌");
      return;
    }

    const detection = await faceapi
      .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert("Face not detected, please look at the camera ❌");
      return;
    }

    const faceDescriptor = Array.from(detection.descriptor);

    try {
      const res = await fetch(`${PORT}/api/face/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor: faceDescriptor }),
      });

      if (!res.ok) {
        alert(`Server error: ${res.status} ❌`);
        return;
      }

      const data = await res.json();

      if (data.match) {
        if (data.alreadyMarked) {
          alert(`⚠️ ${data.message}`);
        } else {
          alert(`✅ Attendance marked for ${data.student.name} (${data.student.rollNumber})`);
          fetchAllAttendance();
          fetchProfile(data.student.email);
        }
      } else {
        alert(`❌ ${data.message || "Face not recognized"}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("❌ Could not connect to server. Make sure backend is running.");
    }
  };

  // ─── Register: capture face descriptor ──────────────────────────────────
  const captureRegFace = async () => {
    try {
      if (!regWebcamRef.current) {
        setCaptureStatus("Camera not ready ❌");
        return;
      }
      const screenshot = regWebcamRef.current.getScreenshot();
      if (!screenshot) {
        setCaptureStatus("Failed to capture image ❌");
        return;
      }
      const img = await faceapi.fetchImage(screenshot);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setCaptureStatus("❌ No face detected. Try again.");
        return;
      }

      setDescriptor(Array.from(detection.descriptor));
      setCaptureStatus("✅ Face captured successfully!");
    } catch (error) {
      console.error("Error capturing face:", error);
      setCaptureStatus("❌ Error capturing face. Try again.");
    }
  };

  // ─── Register: submit form (create) ─────────────────────────────────────
  const handleRegisterSubmit = async () => {
    const { name, rollNumber, email, Student_id, course } = form;
    if (!name || !rollNumber || !email || !Student_id || !course) {
      alert("Please fill all fields.");
      return;
    }
    if (!descriptor) {
      alert("Please capture your face first.");
      return;
    }

    try {
      const res = await fetch(`${PORT}/api/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          faceDescriptors: Array.isArray(descriptor) ? descriptor : Array.from(descriptor || []),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("🎉 Student registered successfully!");
        setForm({ name: "", rollNumber: "", email: loggedInEmail, Student_id: "", course: "" });
        setDescriptor(null);
        setCaptureStatus("");
        setRegCameraOn(false);
        fetchProfile(loggedInEmail);
      } else {
        alert(`❌ ${data.message || "Registration failed. Try again."}`);
      }
    } catch (error) {
      console.error("Register error:", error);
      alert("❌ Could not connect to server.");
    }
  };

  // ─── Profile: enter edit mode ────────────────────────────────────────────
  const startEditProfile = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name || "",
      rollNumber: profile.rollNumber || "",
      Student_id: profile.Student_id || "",
      course: profile.course || "",
    });
    setEditMode(true);
  };

  const cancelEditProfile = () => {
    setEditMode(false);
  };

  // ─── Profile: save via PUT ───────────────────────────────────────────────
  const handleUpdateProfile = async () => {
    const { name, rollNumber, Student_id, course } = editForm;
    if (!name || !rollNumber || !Student_id || !course) {
      alert("Please fill all fields.");
      return;
    }
    if (!profile?._id) {
      alert("❌ Missing student record. Try refreshing the page.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${PORT}/api/students/${profile._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rollNumber, Student_id, course }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(`❌ ${errData.message || `Update failed (${res.status})`}`);
        return;
      }

      const data = await res.json();
      if (data.success) {
        const updatedProfile = { ...profile, ...data.student };
        setProfile(updatedProfile);
        localStorage.setItem("studentProfile", JSON.stringify(updatedProfile));
        setEditMode(false);
        alert("✅ Profile updated successfully!");
      } else {
        alert(`❌ ${data.message || "Update failed."}`);
      }
    } catch (error) {
      console.error("Update profile error:", error);
      alert("❌ Could not connect to server.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Load face-api models ────────────────────────────────────────────────
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      } catch (error) {
        console.error("Failed to load face-api models:", error);
      }
    };
    loadModels();
  }, []);

  // ─── Real-time face detection box ───────────────────────────────────────
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

  const totalAttendance = attendanceStats.present + attendanceStats.absent;
  const attendanceRate =
    totalAttendance > 0 ? Math.round((attendanceStats.present / totalAttendance) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 px-3 sm:px-4 py-6">
      {/* Header — flex layout instead of absolute positioning so it never overlaps on small screens */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 mb-6 max-w-6xl mx-auto">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-700">
            Student Dashboard
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">Face Attendance System</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-white text-purple-600 border border-purple-200 px-4 py-2 rounded-full shadow-md hover:bg-purple-600 hover:text-white transition-all duration-300 text-sm font-medium shrink-0"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full font-medium shadow transition text-xs sm:text-sm
              ${
                activeTab === t.id
                  ? "bg-purple-600 text-white shadow-purple-300 shadow-md"
                  : "bg-white text-gray-600 hover:bg-purple-50"
              }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        {/* TAB 1 — Live Scan + Attendance + History */}
        {activeTab === "scan" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Webcam */}
            <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaCamera /> Live Scan
              </h2>
              <div className="relative w-full">
                {cameraOn ? (
                  <>
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="rounded-xl w-full h-48 sm:h-64 object-cover"
                      videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                    />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-48 sm:h-64" />
                  </>
                ) : (
                  <div className="w-full h-48 sm:h-64 flex items-center justify-center bg-gray-100 rounded-xl text-gray-400 text-sm">
                    Camera is Off
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs sm:text-sm">
                {isFaceDetected ? (
                  <span className="text-green-500 font-medium">Face Detected ✅</span>
                ) : (
                  <span className="text-gray-500">Align your face properly 👤</span>
                )}
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                <button
                  onClick={() => setCameraOn(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-md text-xs sm:text-sm"
                >
                  Open Camera
                </button>
                <button
                  onClick={() => setCameraOn(false)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-md text-xs sm:text-sm"
                >
                  Close Camera
                </button>
              </div>
              <button
                onClick={capture}
                className="mt-3 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition text-xs sm:text-sm"
              >
                Scan Face
              </button>
            </div>

            {/* Attendance Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FaCheckCircle /> Attendance
                </h2>
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                      {attendanceStats.present}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Present</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-red-400">
                      {attendanceStats.absent}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Absent</p>
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
                className="mt-6 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full shadow-md hover:shadow-lg transition text-xs sm:text-sm"
              >
                Mark Attendance
              </button>
            </div>

            {/* Attendance History */}
            <div className="bg-white rounded-2xl shadow-lg p-4 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <FaChartBar /> Attendance History
                </h2>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 flex-1 sm:flex-none"
                  />
                  <button
                    onClick={fetchAttendanceByDate}
                    className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm hover:bg-purple-700"
                  >
                    🔍 Filter
                  </button>
                  <button
                    onClick={fetchAllAttendance}
                    className="bg-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-xs sm:text-sm hover:bg-gray-300"
                  >
                    🔄 All
                  </button>
                </div>
              </div>

              {attendanceLoading && (
                <p className="text-center text-gray-400 text-sm py-4">Loading...</p>
              )}

              {!attendanceLoading && attendanceRecords.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">No attendance records found.</p>
              )}

              {!attendanceLoading && attendanceRecords.length > 0 && (
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {attendanceRecords.map((item, index) => (
                    <div
                      key={item._id || index}
                      className="flex flex-wrap justify-between items-center gap-1 text-xs sm:text-sm py-2.5 px-1"
                    >
                      <span className="text-gray-600">
                        {item.date} &nbsp;·&nbsp; {item.time}
                      </span>
                      <span
                        className={`font-medium px-3 py-0.5 rounded-full text-xs
                        ${
                          item.status === "Present"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2 — Register */}
        {activeTab === "register" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-5 flex items-center gap-2">
                <FaUserPlus /> Register Student
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", key: "name", placeholder: "e.g. Aryan Sharma" },
                  { label: "Roll Number", key: "rollNumber", placeholder: "e.g. CS2024001" },
                  { label: "Student ID", key: "Student_id", placeholder: "e.g. STU2024001" },
                  { label: "Course", key: "course", placeholder: "e.g. B.Tech CSE" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
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
                  <p className="text-xs text-gray-400 mt-1">* Locked to your login email</p>
                </div>
              </div>
              <button
                onClick={handleRegisterSubmit}
                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-full shadow-md hover:shadow-lg transition font-medium text-sm"
              >
                Submit Registration
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaCamera /> Capture Face
              </h2>
              <div className="relative w-full">
                {regCameraOn ? (
                  <Webcam
                    ref={regWebcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded-xl w-full h-48 sm:h-64 object-cover"
                    videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                  />
                ) : (
                  <div className="w-full h-48 sm:h-64 flex flex-col items-center justify-center bg-gray-50 rounded-xl text-gray-400 border-2 border-dashed border-gray-200">
                    <FaCamera className="text-2xl sm:text-3xl mb-2 opacity-30" />
                    <span className="text-xs sm:text-sm">Camera is Off</span>
                  </div>
                )}
              </div>
              {captureStatus && (
                <p
                  className={`mt-2 text-xs sm:text-sm font-medium ${
                    captureStatus.startsWith("✅") ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {captureStatus}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                <button
                  onClick={() => setRegCameraOn(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-md text-xs sm:text-sm"
                >
                  Open Camera
                </button>
                <button
                  onClick={() => setRegCameraOn(false)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-md text-xs sm:text-sm"
                >
                  Close Camera
                </button>
                <button
                  onClick={captureRegFace}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-md text-xs sm:text-sm"
                >
                  Capture
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-400 text-center">
                Open the camera, position your face clearly,
                <br />
                then click <strong>Capture</strong> before submitting.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3 — Profile (view + edit) */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base sm:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <FaIdCard /> Student Profile
                </h2>
                {profile && !editMode && (
                  <button
                    onClick={startEditProfile}
                    className="flex items-center gap-1.5 text-purple-600 hover:text-purple-800 text-xs sm:text-sm font-medium"
                  >
                    <FaEdit /> Edit
                  </button>
                )}
              </div>

              {profileLoading ? (
                <p className="text-gray-400 text-sm text-center py-8">Loading profile...</p>
              ) : !profile ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Profile not loaded. Scan your face to load profile.
                </p>
              ) : editMode ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {[
                      { label: "Full Name", key: "name" },
                      { label: "Roll Number", key: "rollNumber" },
                      { label: "Student ID", key: "Student_id" },
                      { label: "Course", key: "course" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                        <input
                          type="text"
                          value={editForm[key]}
                          onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                      <input
                        type="text"
                        value={profile.email}
                        readOnly
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-100 cursor-not-allowed text-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-full shadow-md font-medium text-sm"
                    >
                      <FaSave /> {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEditProfile}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-full font-medium text-sm"
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 text-xl sm:text-2xl font-bold shadow-inner shrink-0">
                      {profile.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base sm:text-lg font-bold text-gray-800 truncate">
                        {profile.name}
                      </p>
                      <p className="text-sm text-purple-500 truncate">{profile.course}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: "Email", value: profile.email },
                      { label: "Student ID", value: profile.Student_id },
                      { label: "Course", value: profile.course },
                      { label: "Roll Number", value: profile.rollNumber },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-3 py-3 text-xs sm:text-sm">
                        <span className="text-gray-400 font-medium shrink-0">{label}</span>
                        <span className="text-gray-700 truncate text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Attendance Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-5 flex items-center gap-2">
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
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div className="bg-purple-50 rounded-xl py-3 sm:py-4">
                      <p className="text-xl sm:text-2xl font-bold text-purple-600">
                        {profile.totalClasses}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Total Classes</p>
                    </div>
                    <div className="bg-green-50 rounded-xl py-3 sm:py-4">
                      <p className="text-xl sm:text-2xl font-bold text-green-500">
                        {profile.presentCount}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Present</p>
                    </div>
                    <div className="bg-red-50 rounded-xl py-3 sm:py-4">
                      <p className="text-xl sm:text-2xl font-bold text-red-400">
                        {profile.absentCount}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Absent</p>
                    </div>
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
                      <p className="text-xs text-red-400 mt-2">
                        ⚠️ Attendance below 75%. Please attend more classes.
                      </p>
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