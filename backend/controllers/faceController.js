// import axios from "axios";
// import dotenv from "dotenv";
// import fetch from "node-fetch";

// dotenv.config();
// const ML_PORT=process.env.ML_PORT || "http://localhost:5000";

// // recognize face
// export const recognizeFace = async (req, res) => {
//   try {
//     const { image } = req.body;

//     const response = await fetch(`${ML_PORT}/recognize`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ image }),
//     });

//     const data = await response.json();

//     res.json(data);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Recognition failed" });
//   }
// };


// // train ML model
// export const trainModel = async (req, res) => {
//   try {

//     const response = await axios.post(
//       `${ML_PORT}/train`
//     );

//     res.json(response.data);

//   } catch (error) {
//     res.status(500).json({ error: "Model training failed" });
//   }
// };//matching face

// import * as faceapi from "@vladmandic/face-api";
// import Student from "../models/Student.js";

// export const matchFace = async (req, res) => {
//   try {
//     const { descriptor } = req.body;

//     // ✅ Validation
//     if (!descriptor || descriptor.length !== 128) {
//       return res.status(400).json({ error: "Invalid descriptor" });
//     }

//     const students = await Student.find();

//     if (!students.length) {
//       return res.json({ success: false, message: "No students found" });
//     }

//     // 🔥 Convert DB
//     const labeledDescriptors = students.map((student) => {
//       return new faceapi.LabeledFaceDescriptors(
//         student._id.toString(),
//         student.faceDescriptors.map(
//           (desc) => new Float32Array(desc)
//         )
//       );
//     });

//     // 🔥 Create matcher
//     const faceMatcher = new faceapi.FaceMatcher(
//       labeledDescriptors,
//       0.5
//     );

//     // 🔥 Match
//     const bestMatch = faceMatcher.findBestMatch(
//       new Float32Array(descriptor)
//     );

//     if (bestMatch.label !== "unknown") {
//       const student = await Student.findById(bestMatch.label);

//       // ✅ Prevent multiple attendance
//       const today = new Date().toDateString();

//       if (student.lastAttendanceDate === today) {
//         return res.json({
//           success: false,
//           message: "Attendance already marked today",
//         });
//       }

//       student.attendanceCount += 1;
//       student.lastAttendanceDate = today;

//       await student.save();

//       return res.json({
//         success: true,
//         name: student.name,
//         distance: bestMatch.distance,
//       });
//     }

//     res.json({ success: false, message: "No match" });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";
import { euclideanDistance } from "../utils/distance.js";


export const matchFace = async (req, res) => {
  const { descriptor } = req.body;

  // Validate descriptor
  if (!descriptor || !Array.isArray(descriptor)) {
    return res.status(400).json({
      match: false,
      message: "Invalid descriptor provided"
    });
  }

  const students = await Student.find();

  if (!students.length) {
    return res.status(404).json({
      match: false,
      message: "No students found in database"
    });
  }

  let bestMatch = null;
  let minDistance = Infinity;

  students.forEach((student) => {
    student.faceDescriptors.forEach((storedDesc) => {
      if (!storedDesc || storedDesc.length !== 128) return
      const distance = euclideanDistance(storedDesc, descriptor);

      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = student;
      }
    });
  });

  // Threshold check
  if (bestMatch && minDistance < 0.5) {

    const today = new Date().toDateString();
    const lastDate = bestMatch.lastAttendanceDate?.toDateString();

     // ✅ Create class record for today if not exists
  await Class.findOneAndUpdate(
    { date: today },
    { $inc: { totalStudents: 1 } }, // increment students present
    { upsert: true, new: true }      // create if not exists
  );
const alreadyMarked = await Attendance.findOne({
    studentId: bestMatch._id,
    date: today,
  });

    // ✅ Already marked today
    if (alreadyMarked) {
      return res.status(200).json({
        match: true,
        alreadyMarked: true,
        message: `Attendance already marked today for ${bestMatch.name}`,
        student: {
          name: bestMatch.name,
          rollNumber: bestMatch.rollNumber,
          studentId: bestMatch._id.toString(),
        attendanceCount: bestMatch.attendanceCount,
         
        }
      });
    }

    await Attendance.create({
      studentId: bestMatch._id,
      name: bestMatch.name,
      rollNumber: bestMatch.rollNumber,
      date: new Date().toDateString(),
      time: new Date().toLocaleTimeString(),
      status: "Present",
    });

    // ✅ Mark attendance
    await Student.findByIdAndUpdate(bestMatch._id, {
      $inc: { attendanceCount: 1 },  // increment count
      lastAttendanceDate: new Date(), // update date
    });

    return res.status(200).json({
      match: true,
      alreadyMarked: false,
      message: "Attendance marked successfully",
      student: {
        name: bestMatch.name,
        rollNumber: bestMatch.rollNumber,
        attendanceCount: bestMatch.attendanceCount + 1,
         studentId: bestMatch._id.toString(), // send updated count
      }
    });
  }

  // No match found
  return res.status(200).json({
    match: false,
    message: "No match found"
  });
};