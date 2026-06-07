// import express from "express";
// import {
//   addStudent,
//   getStudents,
  
//   deleteStudent
// } from "../controllers/studentController.js";
// import allowRoles from "../middleware/roleMiddleware.js";
// import authMiddleware from "../middleware/authmiddleware.js";

// const router = express.Router();

// // add student
// router.post("/",addStudent);

// // get all students
// // router.get("/",authMiddleware,allowRoles("admin") ,getStudents);

// // delete student
// // router.delete("/:id", authMiddleware,allowRoles("admin"),deleteStudent);

// // delete all students


// export default router;


import express from "express";
import {
  addStudent,
  getStudents,
  getStudentById,
  getStudentByRoll,
  getStudentByemail,
  updateStudent,
  deleteStudent,
  deleteAllStudents,
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/", addStudent);                          // add student
router.get("/", getStudents);                          // get all students
router.get("/email/:email", getStudentByemail);     // get by email
router.get("/roll/:rollNumber", getStudentByRoll);     // get by roll number
router.get("/:id", getStudentById);                    // get single student + attendance
router.put("/:id", updateStudent);                     // update student
router.delete("/all", deleteAllStudents);              // delete all students
router.delete("/:id", deleteStudent);                  // delete one student

export default router;