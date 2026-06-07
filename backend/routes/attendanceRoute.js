import express from "express";
import {
  markAttendance,
  getAllAttendance,
  getAttendanceByStudent,
  getAttendanceByDate,
  getAttendanceByStudentrollNumber,
  deleteAttendance,

} from "../controllers/attendanceController.js";
import { ipRestrict } from "../middleware/ipRestriction.js";

const router = express.Router();

router.post("/mark",ipRestrict ,markAttendance);                        // mark attendance
router.get("/all", getAllAttendance);                         // get all records
router.get("/student/:studentId", getAttendanceByStudent);   // by student
router.get("/studentrollNumber/:rollNumber", getAttendanceByStudentrollNumber);   // by student
router.get("/date/:date", getAttendanceByDate);              // by date
router.delete("/:id", deleteAttendance);                     // delete record
// router.sse("/stream",ip)

export default router;