// import Student from "../models/Student.js"
// import Attendance from "../models/Attendance.js";

// // Mark attendance
// export const markAttendance = async (req, res) => {
//   try {
//     // console.log("API HIT");              
//     // console.log("BODY:", req.body);
//     const { name, rollNumber } = req.body;

//    const combined = (req.body.name || req.body.rollNumber || "").trim();

//     console.log("Combined Input:", combined); // Dinesh sutar_25mc041

//     const lastUnderscore = combined.lastIndexOf("_");

//     if (lastUnderscore === -1) {
//       return res.status(400).json({ message: "Invalid format. Expected Name_RollNumber" });
//     }

//     const studentName = combined.substring(0, lastUnderscore).trim();  // ✅ "Dinesh sutar"
//     const studentRoll = combined.substring(lastUnderscore + 1).trim(); ;  // "25mc041"

//     console.log("Name:", studentName); // Dinesh sutar
//     console.log("Roll:", studentRoll); // 25mc041// debug

//     const student = await Student.findOne({
//       name: { $regex: `^${name}$`, $options: "i" },
//       rollNumber: rollNumber
//     });

//     if (!student) {
//       return res.status(404).json({ message: "Student not found ❌" });
//     }

//     const attendance = new Attendance({
//       status: "Present",
//       name: combined,
//       rollNumber: studentRoll,
//       time: new Date()
//     });

//     await attendance.save();

//     res.json({ message: "Attendance marked ✅", student });

//   } catch (err) {
//     console.error("Mark Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };
// // ✅ clear attendance
// export const clearAttendance = async (req, res) => {
//   try {
//     await Student.updateMany(
//       {},
//       { $set: { "attendance.status": "Absent" } }
//     );
//     res.json({ message: "Attendance cleared successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Get all attendance
// export const getAttendance = async (req, res) => {

//   const data = await Attendance.find()

//   res.json(data)
// }


import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";

// ✅ Mark Attendance
export const markAttendance = async (req, res) => {
  try {
    const { studentId, name, rollNumber } = req.body;

    const today = new Date().toDateString();
    const time = new Date().toLocaleTimeString();
    const date = new Date().toLocaleDateString();

    // ✅ Check already marked today
    const existing = await Attendance.findOne({ studentId, date: today });
    if (existing) {
      return res.status(200).json({
        success: false,
        alreadyMarked: true,
        message: `Attendance already marked today for ${name}`,
      });
    }

    // ✅ Save attendance record
    const attendance = await Attendance.create({
      studentId,
      name,
      rollNumber,
      date: today,
      time,
      status: "Present",
    });

    // ✅ Update student attendance count and last date
    await Student.findByIdAndUpdate(studentId, {
      $inc: { attendanceCount: 1 },
      lastAttendanceDate: new Date(),
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
      .sort({ createdAt: -1 }) // latest first
      .populate("studentId", "sname rollNumber course"); // get student details

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

    const records = await Attendance.find({ studentId })
      .sort({ createdAt: -1 });

    if (!records.length) {
      return res.status(404).json({ 
        success: false, 
        message: "No attendance records found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      total: records.length, 
      records 
    });

  } catch (error) {
    console.error("getAttendanceByStudent error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceByStudentrollNumber = async (req, res) => {
  try {
    const { rollNumber } = req.params;

    const records = await Attendance.find({ rollNumber: { $regex: `^${rollNumber}$`, $options: "i" }})
      .sort({ createdAt: -1 });

    if (!records.length) {
      return res.status(404).json({ 
        success: false, 
        message: "No attendance records found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      total: records.length, 
      records 
    });

  } catch (error) {
    console.error("getAttendanceByStudentrollNumber error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Attendance by Date
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params; // e.g. "4/3/2026"

    const records = await Attendance.find({ date })
      .sort({ createdAt: -1 });

    if (!records.length) {
      return res.status(404).json({ 
        success: false, 
        message: `No attendance records found for ${date}` 
      });
    }

    res.status(200).json({ 
      success: true, 
      date,
      total: records.length, 
      records 
    });

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
      return res.status(404).json({ 
        success: false, 
        message: "Attendance record not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Attendance record deleted" 
    });

  } catch (error) {
    console.error("deleteAttendance error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};