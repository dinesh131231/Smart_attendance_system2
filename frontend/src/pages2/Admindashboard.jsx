import { useState, useEffect, useRef, useCallback } from "react";
import {
    FaPlus, FaClock, FaSignOutAlt, FaNetworkWired,
    FaTrash, FaSync, FaBell, FaIdCard, FaWifi,
} from "react-icons/fa";
import * as faceapi from "@vladmandic/face-api";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
// import axios from "axios"

const PORT = import.meta.env.VITE_PORT || "http://localhost:3000";

/* ══════════════════════════════════════════════════════
   KEYFRAME ANIMATIONS — cannot be expressed in Tailwind,
   kept in a single global <style> block
══════════════════════════════════════════════════════ */
const GlobalStyles = () => (
    <style>{`
        @keyframes attSlideIn {
            from { opacity:0; transform:translateY(-40px) scale(0.88); }
            to   { opacity:1; transform:translateY(0)     scale(1);    }
        }
        @keyframes attShrink { from{width:100%} to{width:0%} }
        @keyframes attPulse {
            0%,100%{ box-shadow:0 0 0 0   rgba(124,58,237,0.4); }
            50%    { box-shadow:0 0 0 12px rgba(124,58,237,0);   }
        }
        @keyframes rollFlash {
            0%,100%{ color:#7c3aed; }
            50%    { color:#a78bfa; }
        }
        @keyframes slideInRight {
            from { opacity:0; transform:translateX(80px); }
            to   { opacity:1; transform:translateX(0);    }
        }
        @keyframes regShrink { from{width:100%} to{width:0%} }
        @keyframes livePulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes rowGlow {
            0%  { background:#ede9fe; box-shadow:0 0 0 2px #c4b5fd inset; }
            60% { background:#f5f3ff; box-shadow:0 0 0 2px #c4b5fd inset; }
            100%{ background:#f5f3ff; box-shadow:none; }
        }
        .att-slide-in   { animation: attSlideIn   0.45s cubic-bezier(.22,.68,0,1.2); }
        .att-shrink     { animation: attShrink     6s   linear forwards; }
        .att-pulse      { animation: attPulse      1.6s infinite; }
        .roll-flash     { animation: rollFlash     1.5s ease infinite; }
        .slide-in-right { animation: slideInRight  0.4s cubic-bezier(.22,.68,0,1.2); }
        .reg-shrink     { animation: regShrink     5s   linear forwards; }
        .live-pulse     { animation: livePulse     1.4s infinite; }
        .row-glow       { animation: rowGlow       0.7s ease forwards; }
    `}</style>
);

/* ══════════════════════════════════════════════════════
   ATTENDANCE POPUP
══════════════════════════════════════════════════════ */
function AttendancePopup({ record, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 6000);
        return () => clearTimeout(t);
    }, [onClose]);

    const statusColor =
        record.status === "Present" ? "text-green-600"
            : record.status === "Late" ? "text-yellow-600"
                : "text-red-600";
    const statusBg =
        record.status === "Present" ? "bg-green-100"
            : record.status === "Late" ? "bg-yellow-100"
                : "bg-red-100";

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 z-[99998] bg-black/15 backdrop-blur-sm"
            />

            {/* Card */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] bg-white rounded-3xl px-9 py-8 shadow-[0_24px_80px_rgba(124,58,237,0.28)] border-2 border-violet-100 flex flex-col items-center gap-3.5 att-slide-in min-w-80 max-w-sm text-center">

                {/* Pulsing icon */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center att-pulse">
                    <FaIdCard className="text-white text-2xl" />
                </div>

                {/* Title */}
                <p className="m-0 font-extrabold text-base text-violet-900">
                    Attendance Marked!
                </p>

                {/* Roll number */}
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl px-8 py-3 border-2 border-violet-300 w-full box-border">
                    <p className="m-0 text-[11px] text-gray-400 font-bold tracking-widest uppercase">Roll Number</p>
                    <p className="mt-1 mb-0 text-[34px] font-black font-mono tracking-widest roll-flash">
                        {record.rollNumber || "—"}
                    </p>
                </div>

                {/* Name + status */}
                <div className="flex items-center gap-2.5 flex-wrap justify-center">
                    <span className="font-bold text-base text-gray-900">
                        {record.name || record.studentName}
                    </span>
                    <span className={`${statusBg} ${statusColor} text-xs font-bold px-3.5 py-1 rounded-full`}>
                        {record.status}
                    </span>
                </div>

                {/* Time */}
                {(record.time || record.date) && (
                    <p className="m-0 text-[13px] text-gray-400 flex items-center gap-1.5">
                        <FaClock className="text-[11px]" />
                        {record.time || new Date(record.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>
                )}

                {/* Progress bar */}
                <div className="w-full h-1 bg-violet-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full att-shrink" />
                </div>

                <p className="m-0 text-[11px] text-violet-300">Auto-closes in 6s • Click outside to dismiss</p>

                {/* X button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-4 bg-transparent border-none cursor-pointer text-gray-300 text-lg leading-none"
                >✕</button>
            </div>
        </>
    );
}

/* ══════════════════════════════════════════════════════
   REGISTRATION POPUP
══════════════════════════════════════════════════════ */
function LivePopup({ student, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 5000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className="fixed top-6 right-6 z-[9999] bg-white rounded-2xl py-[18px] px-6 shadow-[0_8px_40px_rgba(124,58,237,0.18)] border-l-[5px] border-violet-600 flex items-center gap-3.5 slide-in-right min-w-[280px] max-w-[340px]">
            <div className="bg-violet-100 rounded-full w-[42px] h-[42px] flex items-center justify-center shrink-0">
                <FaBell className="text-violet-600 text-lg" />
            </div>
            <div className="flex-1">
                <p className="font-bold text-violet-900 m-0 text-sm">New Student Registered!</p>
                <p className="text-gray-500 mt-0.5 mb-0 text-[13px]">
                    <strong>{student.name}</strong> — Roll: {student.rollNumber || "—"}
                </p>
                <div className="h-0.5 bg-violet-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full reg-shrink" />
                </div>
            </div>
            <button
                onClick={onClose}
                className="bg-transparent border-none cursor-pointer text-gray-400 text-base p-1"
            >✕</button>
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   SSE STATUS BADGE
══════════════════════════════════════════════════════ */
function SseBadge({ connected }) {
    return (
        <div className={`flex items-center gap-1.5 ${connected ? "bg-green-50 hidden border-green-200 text-green-600" : "bg-red-50 border-red-200 text-red-600"} border rounded-full px-2.5 py-0.5 text-xs font-semibold`}>
            <FaWifi className="text-[10px]" />
            {connected ? "Live" : "Offline"}
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${connected ? "bg-green-600 live-pulse" : "bg-red-600"}`} />
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */
export default function AdminDashboard() {

    /* core */
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const webcamRef = useRef(null);
    const [cameraOn, setCameraOn] = useState(false);
    const [descriptor, setDescriptor] = useState(null);
    const [form, setForm] = useState({ name: "", roll: "" });
    const [activeTab, setActiveTab] = useState("dashboard");

    /* real data */
    const [allStudents, setAllStudents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [statsLoading, setStatsLoading] = useState(false);
    const [todaysAttendance, setTodaysAttendance] = useState([]);
    const [todayStats, setTodayStats] = useState({ present: 0, absent: 0, late: 0 });

    /* individual tab */
    const [searchName, setSearchName] = useState("");
    const [individualData, setIndividualData] = useState([]);
    const [indLoading, setIndLoading] = useState(false);

    /* by-date tab */
    const [selectedDate, setSelectedDate] = useState("");
    const [dateData, setDateData] = useState([]);
    const [dateLoading, setDateLoading] = useState(false);

    /* registered tab */
    const [registeredStudents, setRegisteredStudents] = useState([]);
    const [regLoading, setRegLoading] = useState(false);

    /* IP tab */
    const [ipInput, setIpInput] = useState("");
    const [ipList, setIpList] = useState([]);
    const [ipLoading, setIpLoading] = useState(false);

    /* popups */
    const [livePopup, setLivePopup] = useState(null);
    const [attendancePopup, setAttendancePopup] = useState(null);
    const prevRegisteredCount = useRef(0);

    /* SSE */
    const [sseConnected, setSseConnected] = useState(false);
    const sseRef = useRef(null);

    /* row highlights */
    const [highlightedRolls, setHighlightedRolls] = useState(new Set());
    const navigate = useNavigate();

    /* ────────────────────────────────────────
       SSE
    ──────────────────────────────────────── */
    // useEffect(() => {
    //     let es;
    //     const connect = () => {
    //         es = new EventSource(`${PORT}/api/attendance/stream`);
    //         sseRef.current = es;

    //         es.onopen = () => setSseConnected(true);

    //         es.addEventListener("attendance", (e) => {
    //             try {
    //                 const record = JSON.parse(e.data);
    //                 setAttendancePopup(record);
    //                 const roll = record.rollNumber;
    //                 if (roll) {
    //                     setHighlightedRolls(prev => new Set([...prev, roll]));
    //                     setTimeout(() => {
    //                         setHighlightedRolls(prev => {
    //                             const next = new Set(prev);
    //                             next.delete(roll);
    //                             return next;
    //                         });
    //                     }, 4000);
    //                 }
    //                 setAttendance(prev => {
    //                     const dup = prev.some(a =>
    //                         (a._id && a._id === record._id) ||
    //                         (a.rollNumber === record.rollNumber && a.date === record.date)
    //                     );
    //                     return dup ? prev : [record, ...prev];
    //                 });
    //             } catch (_) {}
    //         });

    //         es.onerror = () => {
    //             setSseConnected(false);
    //             es.close();
    //             setTimeout(connect, 5000);
    //         };
    //     };

    //     connect();
    //     return () => { sseRef.current?.close(); };
    // }, []);

    /* ────────────────────────────────────────
       face-api models
    ──────────────────────────────────────── */
    useEffect(() => {
        (async () => {
            const M = "/models";
            await faceapi.nets.tinyFaceDetector.loadFromUri(M);
            await faceapi.nets.faceLandmark68Net.loadFromUri(M);
            await faceapi.nets.faceRecognitionNet.loadFromUri(M);
        })();
    }, []);

    /* ────────────────────────────────────────
       Data fetchers
    ──────────────────────────────────────── */


    // const fetchDashboardData = useCallback(async () => {
    //     setStatsLoading(true);
    //     try {
    //         const [sRes, aRes] = await Promise.all([
    //             fetch(`${PORT}/api/students`),
    //             fetch(`${PORT}/api/attendance/all`),
    //         ]);
    //         setAllStudents(await sRes.json());
    //         const atts = await aRes.json();
    //         setAttendance(Array.isArray(atts) ? atts : []);
    //         console.log("today attendance data", attendance)
    //     } catch (e) { console.error(e); }
    //     setStatsLoading(false);
    // }, []);


    const fetchDashboardData = useCallback(async () => {
        setStatsLoading(true);
        try {
            const [sRes, aRes] = await Promise.all([
                fetch(`${PORT}/api/students`),
                fetch(`${PORT}/api/attendance/all`),
            ]);
            setAllStudents(await sRes.json());
            const atts = await aRes.json();

            // ✅ Extract records array from response
            const attendanceData = Array.isArray(atts.records) ? atts.records : [];
            setAttendance(attendanceData);

            // ✅ Match against "Mon Apr 06 2026" format
            const today = new Date().toDateString(); // e.g. "Mon Apr 06 2026"
            const filtered = attendanceData.filter(record => record.date === today);

            console.log("today attendance data", filtered);
            setTodaysAttendance(filtered)
            const todayStats = filtered.reduce((acc, record) => {
                const [time, period] = record.time.split(' '); // "1:13:46 am" → ["1:13:46", "am"]
                const [hours, minutes] = time.split(':').map(Number);

                // Convert to 24hr
                let hour24 = hours;
                if (period?.toLowerCase() === 'pm' && hours !== 12) hour24 = hours + 12;
                if (period?.toLowerCase() === 'am' && hours === 12) hour24 = 0;

                const isLate = hour24 > 10 || (hour24 === 10 && minutes > 0); // after 10:00 AM

                if (record.status === 'Present') {
                    if (isLate) acc.late += 1;
                    else acc.present += 1;
                } else if (record.status === 'Absent') {
                    acc.absent += 1;
                }

                return acc;
            }, { present: 0, absent: 0, late: 0 });

            setTodayStats(todayStats);


        } catch (e) { console.error(e); }
        setStatsLoading(false);
    }, []);




    // const fetchRegisteredStudents = useCallback(async () => {
    //     try {
    //         setRegLoading(true);
    //         const res = await fetch(`${PORT}/api/students`);
    //         // if (prevRegisteredCount.current > 0 && data.length > prevRegisteredCount.current)
    //         //     setLivePopup(data[data.length - 1]);
    //         // prevRegisteredCount.current = data.length;
    //         const data = await res.json();
    //         setRegisteredStudents(data);
    //         console.log("registered student data", data)
    //     } catch (e) { console.error(e);
    //         }
    //     setRegLoading(false);
    // }, []);

    const fetchRegisteredStudents = async () => {
        try {
            setRegLoading(true);
            const res = await fetch(`${PORT}/api/students`);
            const data = await res.json();
            console.log("data:", data);
            // setRegisteredStudents(data);
            const students = Array.isArray(data) ? data : data.students ?? [];
            setRegisteredStudents(students);

        } catch (error) {
            console.error("fetchRegisteredStudents error:", error.message);
        } finally {
            setRegLoading(false);
        }
    };


    const fetchIndividual = useCallback(async (rollNumber) => {
        // if (!name.trim()) { setIndividualData([]); return; }
        if (!rollNumber) { setIndividualData([]); return; }
        setIndLoading(true);
        try {
            const data = await (await fetch(`${PORT}/api/attendance/studentrollNumber/${rollNumber}`)).json();
            setIndividualData(Array.isArray(data.records) ? data.records : []);
        } catch (e) { console.error(e); }
        setIndLoading(false);
    }, []);

    const fetchByDate = useCallback(async (date) => {
        if (!date) { setDateData([]); return; }
        setDateLoading(true);
        try {
            const formatted = new Date(date).toDateString();
            const data = await (await fetch(`${PORT}/api/attendance/date/${formatted}`)).json();
            // setDateData(Array.isArray(data) ? data : []);
            setDateData(Array.isArray(data.records) ? data.records : []);
            console.log("By date data:", data);
        } catch (e) { console.error(e); }
        setDateLoading(false);
    }, []);

    // const fetchIpList = useCallback(async () => {
    //     const token =localStorage.getItem('token')

    //     try {
    //         const data = await (await fetch(`${PORT}/api/ip/settings/allowed-ip`)).json();
    //         setIpList(Array.isArray(data) ? data : []);
    //     } catch (_) { }
    // }, []);


    const fetchIpList = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${PORT}/api/ip/settings/allowed-ip`, {
                headers: { "Authorization": `Bearer ${token}` } // ✅ auth header
            });

            const data = await res.json();
            console.log('full response:', data);
            console.log('status:', res.status);

            // ✅ parse comma-separated string → array
            // if (data.success && data.settings?.allowedIp) {
            //     setIpList(data.settings.allowedIp.split(',').map(ip => ip.trim()).filter(Boolean));
            //     // ✅ check 200/401/404
            if (data.success && data.allowedIp) {
                const list = data.allowedIp
                    .split(',')
                    .map(ip => ip.trim())
                    .filter(Boolean);
                setIpList(list);
            } else {
                setIpList([]);
            }
        } catch (e) {
            console.error('fetchIpList error:', e);
        }
    }, []);

    useEffect(() => {

        fetchIpList();
    }, [fetchIpList]);

    
    useEffect(() => {
        console.log('ipList state updated:', ipList); // ✅ confirms state is set
    }, [ipList]);


    /* tab effects */
    useEffect(() => {
        if (activeTab === "dashboard") fetchDashboardData();
        if (activeTab === "registered") fetchRegisteredStudents();
        if (activeTab === "ip") fetchIpList();
    }, [activeTab]);

    // useEffect(() => {
    //     const iv = setInterval(() => { if (activeTab === "dashboard") fetchDashboardData(); }, 30000);
    //     return () => clearInterval(iv);
    // }, [activeTab, fetchDashboardData]);

    useEffect(() => {
        fetchDashboardData();
    }, [])

    useEffect(() => {
        fetchRegisteredStudents();
    }, []);

    // useEffect(() => {
    //     const iv = setInterval(() => { if (activeTab === "registered") fetchRegisteredStudents(); }, 10000);
    //     return () => clearInterval(iv);
    // }, [activeTab, fetchRegisteredStudents]);

    // useEffect(() => {
    //     const t = setTimeout(() => fetchIndividual(searchName), 400);
    //     return () => clearTimeout(t);
    // }, [searchName]);

    useEffect(() => { fetchByDate(selectedDate); }, [selectedDate]);

    /* ────────────────────────────────────────
       Derived stats
    ──────────────────────────────────────── */
    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = attendance.filter(a => (a.date || "").split("T")[0] === today);
    const presentCount = todayAttendance.filter(a => a.status === "Present").length;
    const lateCount = todayAttendance.filter(a => a.status === "Late").length;
    const absentCount = todayAttendance.filter(a => a.status === "Absent").length;

    /* ────────────────────────────────────────
       Register student
    ──────────────────────────────────────── */
    const capture = async () => {
        try {
            if (!webcamRef.current) { setMessage("Camera not ready ❌"); return; }
            const shot = webcamRef.current.getScreenshot();
            if (!shot) { setMessage("Failed to capture ❌"); return; }
            const img = await faceapi.fetchImage(shot);
            const det = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks().withFaceDescriptor();
            if (!det) { setMessage("No face detected ❌"); return; }
            setDescriptor(Array.from(det.descriptor));
            setMessage("Face captured ✅");
        } catch { setMessage("Error capturing face ❌"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name) { setMessage("Enter student name"); return; }
        if (!descriptor) { setMessage("Please capture face first ❌"); return; }
        setLoading(true);
        try {
            const res = await fetch(`${PORT}/api/students`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: form.name, rollNumber: form.roll, faceDescriptors: descriptor }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setMessage("Student added ✅");
            setLivePopup({ name: form.name, rollNumber: form.roll });
            setForm({ name: "", roll: "" });
            setDescriptor(null); setCameraOn(false);
            prevRegisteredCount.current += 1;
        } catch { setMessage("Error adding student ❌"); }
        setLoading(false);
    };

    /* ────────────────────────────────────────
       IP management
    ──────────────────────────────────────── */
    const addIp = async () => {
        const token = localStorage.getItem('token');


        const v = ipInput.trim();
        if (!v || ipList.includes(v)) { setIpInput(""); return; }

        const updatedList = [...ipList, v]; // ✅ full list, not just new one
        setIpLoading(true);
        try {
            // add this line
            const res = await fetch(`${PORT}/api/ip/settings/allowed-ip`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`  // ✅ auth header
                },
                body: JSON.stringify({ ips: updatedList })  // ✅ send full array
            });
            const data = await res.json();
            console.log('raw ip response:', data);
            if (data.success) {
                setIpList(updatedList);

                setIpInput("");
            } else {
                alert(data.message);
            }
        } catch (e) {
            console.error('addIp error:', e);
        }
        setIpLoading(false);
    };

    const removeIp = async (ip) => {
        const token = localStorage.getItem('token');
        // const role = localStorage.getItem('role');
        const updatedList = ipList.filter(i => i !== ip); // ✅ remove from list
        try {

            const res = await fetch(`${PORT}/api/ip/settings/allowed-ip`, {
                method: "POST",  // ✅ same endpoint as addIp
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`  // ✅ auth header
                },
                body: JSON.stringify({ ips: updatedList })  // ✅ send updated list
            });
            const data = await res.json();
            if (data.success) {
                setIpList(updatedList);

            } else {
                alert(data.message);
            }
        } catch (e) {
            console.error('removeIp error:', e);
        }
    };

    // const addIp = async () => {
    //     const v = ipInput.trim();
    //     if (!v || ipList.includes(v)) { setIpInput(""); return; }
    //     setIpLoading(true);
    //     try { await fetch(`${PORT}/api/ip/settings/allowed-ip`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ip: v }) }); } catch (_) { }
    //     setIpList(p => [...p, v]); setIpInput(""); setIpLoading(false);
    // };
    // const removeIp = async (ip) => {
    //     try { await fetch(`${PORT}/api/ip-list/${encodeURIComponent(ip)}`, { method: "DELETE" }); } catch (_) { }
    //     setIpList(p => p.filter(i => i !== ip));
    // };

    /* ────────────────────────────────────────
       Signout
    ──────────────────────────────────────── */
    const handleSignOut = async () => {

        localStorage.clear();   // ✅ clear all data
        navigate("/adminlogin");
        // try { await fetch(`${PORT}/api/signout`, { method: "POST" }); } catch (_) { }
        // window.location.href = "/login";
    };

    /* ────────────────────────────────────────
       Style helpers
    ──────────────────────────────────────── */
    const tabClass = (tab) =>
        activeTab === tab
            ? "px-4 py-1.5 rounded-full border-none bg-violet-600 text-white font-medium text-sm cursor-pointer transition-all"
            : "px-4 py-1.5 rounded-full border border-violet-200 bg-transparent text-violet-600 font-medium text-sm cursor-pointer transition-all";

    const sColor = (s) =>
        s === "Present" ? "text-green-600" : s === "Late" ? "text-yellow-600" : "text-red-600";
    const sBg = (s) =>
        s === "Present" ? "bg-green-100" : s === "Late" ? "bg-yellow-100" : "bg-red-100";

    /* ══════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-violet-100">
            <GlobalStyles />

            {/* Attendance popup (SSE) */}
            {attendancePopup && (
                <AttendancePopup record={attendancePopup} onClose={() => setAttendancePopup(null)} />
            )}

            {/* Registration popup */}
            {livePopup && (
                <LivePopup student={livePopup} onClose={() => setLivePopup(null)} />
            )}

            {/* ══ NAVBAR ══ */}
            <nav className="bg-white shadow-[0_1px_8px_rgba(124,58,237,0.08)] sticky top-0 z-[100] px-5 py-2.5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                    <span className="text-violet-600 font-extrabold text-lg">AttendEase Admin</span>
                    {/* <SseBadge className="" connected={sseConnected} /> */}
                </div>
                <div className="flex gap-1.5 flex-wrap items-center">
                    {["dashboard", "individual", "bydate", "registered", "ip"].map(tab => (
                        <button key={tab} className={tabClass(tab)} onClick={() => setActiveTab(tab)}>
                            {tab === "dashboard" ? "Dashboard"
                                : tab === "individual" ? "Individual"
                                    : tab === "bydate" ? "By Date"
                                        : tab === "registered" ? "Registered"
                                            : "IP Config"}
                        </button>
                    ))}
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-semibold text-sm cursor-pointer flex items-center gap-1.5"
                    >
                        <FaSignOutAlt /> Sign Out
                    </button>
                </div>
            </nav>

            <div className="px-4 py-6">

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-[clamp(22px,4vw,36px)] font-extrabold text-violet-600 m-0">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage Attendance System</p>
                </div>

                {/* Stats */}
                <div className="max-w-[900px] mx-auto mb-6 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
                    {[
                        { label: "Total Students", value: allStudents.length || registeredStudents.length, color: "text-violet-600" },
                        { label: "Present Today", value: todayStats.present, color: "text-green-600" },
                        { label: "Late Today", value: todayStats.late, color: "text-yellow-600" },
                        { label: "Absent Today", value: todayStats.absent, color: "text-red-600" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(124,58,237,0.07)] p-[18px_16px] text-center">
                            <p className="text-xs text-gray-400 mb-1.5 m-0">{label}</p>
                            <p className={`text-[28px] font-extrabold ${color} m-0`}>{statsLoading ? "…" : value}</p>
                        </div>
                    ))}
                </div>

                {/* ══ DASHBOARD TAB ══ */}
                {activeTab === "dashboard" && (
                    <div className="max-w-[900px] mx-auto grid gap-6">

                        {/* Register card */}
                        <div className="bg-white hidden rounded-[20px] shadow-[0_4px_20px_rgba(124,58,237,0.1)] p-6">
                            <h2 className="text-base font-bold text-gray-700 mt-0 flex items-center gap-2">
                                <FaPlus className="text-violet-600" /> Register New Student
                            </h2>
                            {message && (
                                <p className={`text-center mb-3 font-semibold text-sm ${message.includes("✅") ? "text-green-600" : "text-red-600"}`}>{message}</p>
                            )}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    {cameraOn
                                        ? <Webcam ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ width: 640, height: 480, facingMode: "user" }} className="rounded-xl w-full max-h-60 object-cover" />
                                        : <div className="h-[180px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">Camera Off</div>
                                    }
                                </div>
                                <div className="flex gap-2 justify-center mb-4">
                                    <button type="button" onClick={() => setCameraOn(true)} className="bg-green-100 text-green-600 border-none px-[18px] py-1.5 rounded-full cursor-pointer font-semibold">Open</button>
                                    <button type="button" onClick={capture} className="bg-violet-600 text-white border-none px-[18px] py-1.5 rounded-full cursor-pointer font-semibold">Capture Face</button>
                                    <button type="button" onClick={() => setCameraOn(false)} className="bg-red-100 text-red-600 border-none px-[18px] py-1.5 rounded-full cursor-pointer font-semibold">Close</button>
                                </div>
                                {descriptor && <p className="text-center text-xs text-green-600 mb-2.5">✅ Face descriptor captured</p>}
                                <input
                                    type="text" placeholder="Student Name" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-[18px] py-2.5 bg-gray-100 border-none rounded-full outline-none mb-2.5 text-sm box-border"
                                />
                                <input
                                    type="text" placeholder="Roll No" value={form.roll}
                                    onChange={e => setForm({ ...form, roll: e.target.value })}
                                    className="w-full px-[18px] py-2.5 bg-gray-100 border-none rounded-full outline-none mb-3.5 text-sm box-border"
                                />
                                <button
                                    type="submit"
                                    className={`w-full ${loading ? "bg-violet-400 cursor-not-allowed" : "bg-violet-600 cursor-pointer"} text-white border-none py-[11px] rounded-full font-bold text-[15px]`}
                                >
                                    {loading ? "Adding…" : "Add Student"}
                                </button>
                            </form>
                        </div>

                        {/* Attendance table */}
                        <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(124,58,237,0.1)] p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-gray-700 m-0">Today's Attendance</h2>
                                    {highlightedRolls.size > 0 && (
                                        <p className="text-xs text-violet-600 mt-1 mb-0 font-semibold">
                                            🟣 New entry — row highlighted
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={fetchDashboardData}
                                    className="bg-violet-100 text-violet-600 border-none px-3.5 py-1.5 rounded-full cursor-pointer text-[13px] font-semibold flex items-center gap-1.5"
                                >
                                    <FaSync className="text-[11px]" /> Refresh
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-gray-100">
                                            {["#", "Name", "Roll No", "Status", "Time"].map(h => (
                                                <th key={h} className="text-left px-3 py-2 text-gray-400 font-semibold">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {todaysAttendance.length > 0 ? todaysAttendance.map((a, i) => {
                                            const roll = a.rollNumber;
                                            const isNew = highlightedRolls.has(roll);
                                            return (
                                                <tr
                                                    key={i}
                                                    className={`border-b border-gray-50 transition-colors duration-500 ${isNew ? "row-glow bg-violet-50" : ""}`}
                                                >
                                                    <td className="px-3 py-2.5 text-gray-300">{i + 1}</td>
                                                    <td className="px-3 py-2.5 font-bold text-gray-900">
                                                        {isNew && <span className="mr-1">🆕</span>}
                                                        {a.name || a.studentName}
                                                    </td>
                                                    <td className={`px-3 py-2.5 font-mono ${isNew ? "font-extrabold text-violet-600 text-[15px]" : "font-medium text-gray-500 text-sm"}`}>
                                                        {roll || "—"}
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <span className={`${sBg(a.status)} ${sColor(a.status)} px-3 py-0.5 rounded-full text-xs font-bold`}>{a.status}</span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-400 text-[13px]">
                                                        {a.time || (a.date ? new Date(a.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—")}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan={5} className="text-center py-10 text-gray-300">
                                                {statsLoading ? "Loading…" : "No attendance records for today"}
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ INDIVIDUAL TAB ══ */}
                {activeTab === "individual" && (
                    <div className="max-w-[720px] mx-auto bg-white rounded-[20px] shadow-[0_4px_20px_rgba(124,58,237,0.1)] p-6">
                        <h2 className="text-base font-bold text-gray-700 mt-0">Individual Student Attendance</h2>

                        {/* Search b
        <form onSubmit={e => { e.preventDefault(); searchName && fetchIndividual(searchName); }}>
  <div className="flex gap-2 mb-4">
    <input
      type="text"
      placeholder="Enter roll number…"
      value={searchName}
      onChange={e => setSearchName(e.target.value)}
      className="flex-1 px-[18px] py-2.5 bg-gray-100 border-none rounded-full outline-none text-sm box-border"
    />
    <button
      type="submit"
      disabled={indLoading || !searchName}
      className="bg-violet-600 text-white border-none px-6 py-2.5 rounded-full font-semibold text-sm cursor-pointer disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors"
    >
      {indLoading ? "Searching…" : "Search"}
    </button>
  </div>
</form> */}

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Enter roll number…"
                                value={searchName}
                                onChange={e => setSearchName(e.target.value)}
                                // onKeyDown={e => e.key === "Enter" && fetchIndividual(searchName)}
                                className="flex-1 px-[18px] py-2.5 bg-gray-100 border-none rounded-full outline-none text-sm box-border"
                            />
                            <button
                                onClick={() => searchName && fetchIndividual(searchName)}
                                disabled={indLoading || !searchName}
                                className="bg-violet-600 text-white border-none px-6 py-2.5 rounded-full font-semibold text-sm cursor-pointer disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {indLoading ? "Searching…" : "Search"}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        {["#", "Name", "Roll No", "Date", "Status"].map(h => (
                                            <th key={h} className="text-left px-3 py-2 text-gray-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {indLoading
                                        ? <tr><td colSpan={5} className="text-center py-10 text-gray-300">Loading…</td></tr>
                                        : individualData.length > 0 ? individualData.map((a, i) => (
                                            <tr key={i} className="border-b border-gray-50">
                                                <td className="px-3 py-2.5 text-gray-300">{i + 1}</td>
                                                <td className="px-3 py-2.5 font-semibold">{a.name || a.studentName}</td>
                                                <td className="px-3 py-2.5 font-mono text-gray-500">{a.rollNumber || "—"}</td>
                                                <td className="px-3 py-2.5 text-gray-500">{a.date ? a.date.split("T")[0] : "—"}</td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`${sBg(a.status)} ${sColor(a.status)} px-3 py-0.5 rounded-full text-xs font-bold`}>{a.status}</span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={5} className="text-center py-10 text-gray-300">
                                                {searchName ? "No records found" : "Enter a roll number to search"}
                                            </td></tr>
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                {/* {activeTab === "individual" && (
    <div className="max-w-[720px] mx-auto bg-white rounded-[20px] shadow-[0_4px_20px_rgba(124,58,237,0.1)] p-6">
        <h2 className="text-base font-bold text-gray-700 mt-0">Individual Student Attendance</h2>
        <input
            type="text" placeholder="Enter roll number…" value={searchName}
            onChange={e => {
                setSearchName(e.target.value);
                fetchIndividual(e.target.value);
            }}
            className="w-full px-[18px] py-2.5 bg-gray-100 border-none rounded-full outline-none mb-4 text-sm box-border"
        />
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b-2 border-gray-100">
                        {["#","Name","Roll No","Date","Status"].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-gray-400">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {indLoading
                        ? <tr><td colSpan={5} className="text-center py-10 text-gray-300">Loading…</td></tr>
                        : individualData.length > 0 ? individualData.map((a, i) => (
                            <tr key={i} className="border-b border-gray-50">
                                <td className="px-3 py-2.5 text-gray-300">{i + 1}</td>
                                <td className="px-3 py-2.5 font-semibold">{a.name || a.studentName}</td>
                                <td className="px-3 py-2.5 font-mono text-gray-500">{a.rollNumber || "—"}</td>
                                <td className="px-3 py-2.5 text-gray-500">{a.date ? a.date.split("T")[0] : "—"}</td>
                                <td className="px-3 py-2.5">
                                    <span className={`${sBg(a.status)} ${sColor(a.status)} px-3 py-0.5 rounded-full text-xs font-bold`}>{a.status}</span>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="text-center py-10 text-gray-300">
                                {searchName ? "No records found" : "Enter a roll number to search"}
                            </td></tr>
                        )
                    }
                </tbody>
            </table>
        </div>
    </div>
)} */}
                {/* {activeTab === "individual" && (
                    <div className="max-w-[720px] mx-auto bg-white rounded-[20px] shadow-[0_4px_20px_rgba(124,58,237,0.1)] p-6">
                        <h2 className="text-base font-bold text-gray-700 mt-0">Individual Student Attendance</h2>
                        <input
                            type="text" placeholder="Search student by name…" value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            className="w-full px-[18px] py-2.5 bg-gray-100 border-none rounded-full outline-none mb-4 text-sm box-border"
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        {["#","Name","Roll No","Date","Status"].map(h => (
                                            <th key={h} className="text-left px-3 py-2 text-gray-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {indLoading
                                        ? <tr><td colSpan={5} className="text-center py-10 text-gray-300">Loading…</td></tr>
                                        : individualData.length > 0 ? individualData.map((a, i) => (
                                            <tr key={i} className="border-b border-gray-50">
                                                <td className="px-3 py-2.5 text-gray-300">{i + 1}</td>
                                                <td className="px-3 py-2.5 font-semibold">{a.name || a.studentName}</td>
                                                <td className="px-3 py-2.5 font-mono text-gray-500">{a.rollNumber || "—"}</td>
                                                <td className="px-3 py-2.5 text-gray-500">{a.date ? a.date.split("T")[0] : "—"}</td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`${sBg(a.status)} ${sColor(a.status)} px-3 py-0.5 rounded-full text-xs font-bold`}>{a.status}</span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={5} className="text-center py-10 text-gray-300">{searchName ? "No records found" : "Type a name to search"}</td></tr>
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                )} */}

                {/* ══ BY DATE TAB ══ */}
                {activeTab === "bydate" && (
                    <div className="max-w-[720px] mx-auto bg-white rounded-[20px] shadow-[0_4px_20px_rgba(124,58,237,0.1)] p-6">
                        <h2 className="text-base font-bold text-gray-700 mt-0">Attendance by Date</h2>
                        <input
                            type="date" value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="w-full px-[18px] py-2.5 bg-gray-100 border-none rounded-full outline-none mb-4 text-sm box-border"
                        />
                        {selectedDate ? (
                            <>
                                <p className="text-[13px] text-gray-500 mb-3">
                                    Showing: <strong className="text-violet-600">{selectedDate}</strong> — {dateData.length} record{dateData.length !== 1 ? "s" : ""}
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-gray-100">
                                                {["#", "Name", "Roll No", "Status"].map(h => (
                                                    <th key={h} className="text-left px-3 py-2 text-gray-400">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dateLoading
                                                ? <tr><td colSpan={4} className="text-center py-10 text-gray-300">Loading…</td></tr>
                                                : dateData.length > 0 ? dateData.map((a, i) => (
                                                    <tr key={i} className="border-b border-gray-50">
                                                        <td className="px-3 py-2.5 text-gray-300">{i + 1}</td>
                                                        <td className="px-3 py-2.5 font-semibold">{a.name || a.studentName}</td>
                                                        <td className="px-3 py-2.5 font-mono text-gray-500">{a.rollNumber || "—"}</td>
                                                        <td className="px-3 py-2.5">
                                                            <span className={`${sBg(a.status)} ${sColor(a.status)} px-3 py-0.5 rounded-full text-xs font-bold`}>{a.status}</span>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={4} className="text-center py-10 text-gray-300">No records for this date</td></tr>
                                                )
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-gray-300 py-10">Select a date to view attendance</p>
                        )}
                    </div>
                )}

                {/* ══ REGISTERED TAB ══ */}
                {activeTab === "registered" && (
                    <div className="max-w-[720px] mx-auto bg-white rounded-[20px] shadow-[0_4px_20px_rgba(124,58,237,0.1)] p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-gray-700 m-0">Registered Students</h2>
                            <button
                                onClick={fetchRegisteredStudents}
                                className="bg-violet-100 text-violet-600 border-none px-3.5 py-1.5 rounded-full cursor-pointer text-[13px] font-semibold flex items-center gap-1.5"
                            >
                                <FaSync className="text-[11px]" /> Refresh
                            </button>
                        </div>
                        {regLoading ? (
                            <p className="text-center text-gray-300 py-10">Loading…</p>
                        ) : registeredStudents.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-gray-100">
                                            {["#", "Name", "Roll No", "Face Registered"].map(h => (
                                                <th key={h} className="text-left px-3 py-2 text-gray-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registeredStudents.map((s, i) => (
                                            <tr key={i} className="border-b border-gray-50">
                                                <td className="px-3 py-2.5 text-gray-300">{i + 1}</td>
                                                <td className="px-3 py-2.5 font-semibold">{s.name}</td>
                                                <td className="px-3 py-2.5 font-mono text-gray-500">{s.rollNumber || "—"}</td>
                                                <td className="px-3 py-2.5">
                                                    <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-0.5 rounded-full">Yes</span>
                                                    {/* {s.faceDescriptor?.length > 0
                                                        : <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-0.5 rounded-full">No</span>} */}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-300 py-10">No registered students found</p>
                        )}
                    </div>
                )}

                {/* ══ IP CONFIG TAB ══ */}
                {activeTab === "ip" && (
                    <div className="max-w-[600px] mx-auto">
                        <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(124,58,237,0.1)] p-6">
                            <h2 className="text-base font-bold text-gray-700 mt-0 flex items-center gap-2">
                                <FaNetworkWired className="text-violet-600" /> IP Address Configuration
                            </h2>
                            <p className="text-[13px] text-gray-500 mb-4">Add allowed IPs or hostnames for attendance devices.</p>
                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    placeholder="e.g. 192.168.1.50 or device.local:3000"
                                    value={ipInput}
                                    onChange={e => setIpInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && addIp()}
                                    onFocus={e => e.target.style.borderColor = "#a78bfa"}
                                    onBlur={e => e.target.style.borderColor = "transparent"}
                                    className="flex-1 px-[18px] py-2.5 bg-gray-100 border-2 border-transparent rounded-full outline-none text-sm font-mono transition-colors"
                                />
                                <button
                                    onClick={addIp}
                                    disabled={ipLoading}
                                    className="bg-violet-600 text-white border-none px-[22px] py-2.5 rounded-full cursor-pointer font-bold text-sm"
                                >
                                    {ipLoading ? "…" : "+ Add"}
                                </button>
                            </div>
                            {ipList.length === 0 ? (
                                <div className="text-center py-8 text-gray-300 border-2 border-dashed border-violet-200 rounded-xl">
                                    <FaNetworkWired className="text-[28px] mb-2 mx-auto" />
                                    <p className="m-0 text-sm">No IP addresses added yet</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {ipList.map((ip, i) => (
                                        <div key={i} className="flex items-center justify-between bg-violet-50 rounded-[10px] px-4 py-2.5 border border-violet-100">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_#d1fae5]" />
                                                <span className="font-mono text-sm text-violet-900 font-semibold">{ip}</span>
                                            </div>
                                            <button
                                                onClick={() => removeIp(ip)}
                                                className="bg-red-100 text-red-600 border-none rounded-full w-7 h-7 cursor-pointer flex items-center justify-center text-xs"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ))}
                                    <p className="text-xs text-gray-400 text-right mt-1 mb-0">{ipList.length} address{ipList.length !== 1 ? "es" : ""} configured</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}