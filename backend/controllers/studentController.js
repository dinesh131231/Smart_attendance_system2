// import Student from "../models/Student.js";



// export const addStudent = async (req, res) => {
//   try {
//     const { name, rollNumber, email, Student_id, course, faceDescriptors } = req.body;


//     // Validate fields
//     if (!name || !rollNumber || !email || !Student_id || !course || !faceDescriptors) {
//       return res.status(400).json({ success: false, message: "All fields are required" });
//     }

//     // Ensure faceDescriptor is a normal array
//     const descriptorArray = Array.isArray(faceDescriptors)
//       ? faceDescriptors
//       : Array.from(faceDescriptors);

//     // Check if student exists
//     let student = await Student.findOne({ rollNumber });

//     if (student) {
//       // Add new descriptor
//       student.faceDescriptors.push(descriptorArray);
//     } else {
//       // Create new student
//       student = new Student({
//         name,
//         rollNumber,
//         email,
//         Student_id,
//         course,
//         faceDescriptors: [descriptorArray],
//       });
//     }

//     await student.save();

//     res.json({success: true, message: "Student saved" });
//   } catch (err) {
//     console.error(err); // log the real error
//     res.status(500).json({ message: "Internal Server Error", error: err.message });
//   }
// };

import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";
// import mongoose from "mongoose";

// ─── Add Student (unchanged) ─────────────────────────────────────────────────
export const addStudent = async (req, res) => {
  try {
    const { name, rollNumber, email, Student_id, course, faceDescriptors } = req.body;

    if (!name || !rollNumber || !email || !Student_id || !course || !faceDescriptors) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const descriptorArray = Array.isArray(faceDescriptors)
      ? faceDescriptors
      : Array.from(faceDescriptors);

    let student = await Student.findOne({ rollNumber });

    if (student) {
      student.faceDescriptors.push(descriptorArray);
    } else {
      student = new Student({
        name,
        rollNumber,
        email,
        Student_id,
        course,
        faceDescriptors: [descriptorArray],
      });
    }

    await student.save();
    res.json({ success: true, message: "Student saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ─── Get All Students (with attendance count) ────────────────────────────────
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find().select("-faceDescriptors"); // exclude heavy descriptor data

    res.status(200).json({
      success: true,
      total: students.length,
      students,
    });

  } catch (error) {
    console.error("getStudents error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Get Single Student by ID ────────────────────────────────────────────────

// export const getStudentById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // ✅ Guard against invalid ObjectId (e.g., "email" string)
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ success: false, message: "Invalid student ID" });
//     }

//     const student = await Student.findById(id).select("-faceDescriptors");

//     // ✅ Check student existence BEFORE running expensive queries
//     if (!student) {
//       return res.status(404).json({ success: false, message: "Student not found" });
//     }

//     // ✅ Run all queries in parallel for better performance
//     const [totalClasses, attendanceRecords] = await Promise.all([
//       Class.countDocuments(),
//       Attendance.find({ studentId: id }).sort({ createdAt: -1 }),
//     ]);

//     const presentCount = attendanceRecords.length;
//     const absentCount = totalClasses - presentCount;
//     const percentage = totalClasses > 0
//       ? Math.round((presentCount / totalClasses) * 100)
//       : 0;

//     res.status(200).json({
//       success: true,
//       student,
//       attendanceRecords,
//       totalClasses,
//       presentCount,
//       absentCount,
//       percentage,
//     });

//   } catch (error) {
//     console.error("getStudentById error:", error.message);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select("-faceDescriptors");
    // ✅ Total unique class days held
    const totalClasses = await Class.countDocuments();
    // ✅ Days this student attended
    const studentAttendance = await Attendance.find({ studentId: req.params.id });
    const presentCount = studentAttendance.length;

    // ✅ Absent = total classes - present
    const absentCount = totalClasses - presentCount;
    // ✅ Attendance percentage
    const percentage = totalClasses > 0
      ? Math.round((presentCount / totalClasses) * 100)
      : 0;



    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // get their attendance records too
    const attendanceRecords = await Attendance.find({ studentId: req.params.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      student,
      attendanceRecords,
      totalClasses,        // ✅ real total classes
      presentCount,        // ✅ days attended
      absentCount,         // ✅ days missed
      percentage,

    });

  } catch (error) {
    console.error("getStudentById error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Get Student by Roll Number ───────────────────────────────────────────────
export const getStudentByRoll = async (req, res) => {
  try {
    const student = await Student.findOne({ rollNumber: req.params.rollNumber })
      .select("-faceDescriptors");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.status(200).json({ success: true, student });

  } catch (error) {
    console.error("getStudentByRoll error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
// ─── Get Student by Email id ───────────────────────────────────────────────
export const getStudentByemail = async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.params.email })
      .select("-faceDescriptors")
    if (!student) {
      return res.status(404).json({ success: false, message: "student not found" })
    }
    const [totalClasses, attendanceRecords] = await Promise.all([
      Class.countDocuments(),
      Attendance.find({ studentId: student._id }).sort({ createdAt: -1 }),
    ]);

    const presentCount = attendanceRecords.length;
    const absentCount = totalClasses - presentCount;
    const percentage = totalClasses > 0
      ? Math.round((presentCount / totalClasses) * 100)
      : 0;

    // ❌ Bug 3: Response only had `student` — now includes all stats
    res.status(200).json({
      success: true,
      student,
      attendanceRecords,
      totalClasses,
      presentCount,
      absentCount,
      percentage,
    });

  } catch (error) {
    console.err("getStudentByemail error:", error.message)
    res.status(500).json({ success: false, error: error.message })
  }

}


// ─── Update Student ───────────────────────────────────────────────────────────
export const updateStudent = async (req, res) => {
  try {
    const { name, email, course } = req.body; // only allow safe fields to update

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, email, course },
      { new: true, runValidators: true }
    ).select("-faceDescriptors");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.status(200).json({
      success: true,
      message: "Student updated ✅",
      student,
    });

  } catch (error) {
    console.error("updateStudent error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Delete Student ───────────────────────────────────────────────────────────
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found ❌" });
    }

    // delete student's attendance records too
    await Attendance.deleteMany({ studentId: req.params.id });

    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Student and attendance records deleted ✅",
    });

  } catch (error) {
    console.error("deleteStudent error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Delete All Students ──────────────────────────────────────────────────────
export const deleteAllStudents = async (req, res) => {
  try {
    await Attendance.deleteMany({});  // clear all attendance first
    await Student.deleteMany({});     // then clear all students

    res.status(200).json({
      success: true,
      message: "All students and attendance records deleted ✅",
    });

  } catch (error) {
    console.error("deleteAllStudents error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
