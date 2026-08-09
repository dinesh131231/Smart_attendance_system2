import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import { EventEmitter } from "events";
import { broadcastAttendanceEvent } from "../utils/socket.js";

export const attendanceEmitter = new EventEmitter();

// ✅ Mark Attendance
export const markAttendance = async (req, res) => {
  try {
    const { studentId, name, rollNumber } = req.body;

    const today = new Date().toDateString();
    const time = new Date().toLocaleTimeString();
    const date = new Date().toLocaleDateString();

    const existing = await Attendance.findOne({ studentId, date: today });
    if (existing) {
      return res.status(200).json({
        success: false,
        alreadyMarked: true,
        message: `Attendance already marked today for ${name}`,
      });
    }

    const attendance = await Attendance.create({
      studentId,
      name,
      rollNumber,
      date: today,
      time,
      status: "Present",
    });

    await Student.findByIdAndUpdate(studentId, {
      $inc: { attendanceCount: 1 },
      lastAttendanceDate: new Date(),
    });

    attendanceEmitter.emit("attendanceMarked", { name, studentId, rollNumber, time });
    broadcastAttendanceEvent({
      name,
      studentId,
      rollNumber,
      time,
      status: "Present",
      date: today,
    });

    res.status(201).json({
      success: true,
      alreadyMarked: false,
      message: `Attendance marked for ${name}`,
      attendance,
    });

  } catch (error) {
    console.error("markAttendance error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get All Attendance Records
export const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find()
      .sort({ createdAt: -1 })
      .populate("studentId", "sname rollNumber course");

    res.status(200).json({ success: true, records });

  } catch (error) {
    console.error("getAllAttendance error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Attendance by Student ID
export const getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const records = await Attendance.find({ studentId }).sort({ createdAt: -1 });

    if (!records.length) {
      return res.status(404).json({ success: false, message: "No attendance records found" });
    }

    res.status(200).json({ success: true, total: records.length, records });

  } catch (error) {
    console.error("getAttendanceByStudent error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceByStudentrollNumber = async (req, res) => {
  try {
    const { rollNumber } = req.params;

    const records = await Attendance.find({
      rollNumber: { $regex: `^${rollNumber}$`, $options: "i" },
    }).sort({ createdAt: -1 });

    if (!records.length) {
      return res.status(404).json({ success: false, message: "No attendance records found" });
    }

    res.status(200).json({ success: true, total: records.length, records });

  } catch (error) {
    console.error("getAttendanceByStudentrollNumber error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Attendance by Date
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const records = await Attendance.find({ date }).sort({ createdAt: -1 });

    if (!records.length) {
      return res.status(404).json({ success: false, message: `No attendance records found for ${date}` });
    }

    res.status(200).json({ success: true, date, total: records.length, records });

  } catch (error) {
    console.error("getAttendanceByDate error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Attendance Record
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await Attendance.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.status(200).json({ success: true, message: "Attendance record deleted" });

  } catch (error) {
    console.error("deleteAttendance error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
