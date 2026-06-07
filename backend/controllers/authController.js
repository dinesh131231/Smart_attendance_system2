// import User from "../models/User.js"
// import bcrypt from "bcrypt"
// import jwt from "jsonwebtoken"
// import dotenv from "dotenv"

// dotenv.config();


// const secretKey=process.env.JWT_SECRET;
// const expiresIn=process.env.JWT_EXPIRES_IN;
// // Register
// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password,adminKey } = req.body

//     const userExists = await User.findOne({ email })
//     if (userExists) {
//       return res.status(400).json({ message: "User already exists" })
//     }
//     let role = "student"; // default role
//     if (adminKey && adminKey === process.env.ADMIN_KEY) {
//       role = "admin";
//     }

//     const hashedPassword = await bcrypt.hash(password, 10)

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//     })

//     res.json({
//       message: "User registered",
//       user
//     })

//   } catch (error) {
//     res.status(500).json({ error: error.message })
//   }
// }


// // Login
// export const loginUser = async (req, res) => {
//   try {

//     const { email, password } = req.body; // ✅ removed role

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     const match = await bcrypt.compare(password, user.password);

//     if (!match) {
//       return res.status(400).json({ message: "Invalid password" });
//     }

//     // ✅ include role inside token payload
//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       secretKey,
//       { expiresIn: expiresIn }
//     );

//     // ✅ ALSO send role separately
//     res.json({
//       token,
//       role: user.role
//     });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Profile
// export const getProfile = async (req, res) => {

//   const user = await User.findById(req.user.id).select("-password")

//   res.json(user)
// }


// import User from "../models/User.js";
// import Student from "../models/Student.js";
// import Attendance from "../models/Attendance.js";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

// dotenv.config();

// const secretKey = process.env.JWT_SECRET;
// const expiresIn = process.env.JWT_EXPIRES_IN;

// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // ✅ Find user by email
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "User not found" });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(400).json({ message: "Invalid password" });

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       secretKey,
//       { expiresIn }
//     );

//     // ✅ If student — find Student record by SAME email
//     let studentProfile = null;

//     if (user.role === "student") {
//       const student = await Student.findOne({ email: user.email }) // ✅ match by email
//         .select("-faceDescriptors");

//       if (student) {
//         const attendanceRecords = await Attendance.find({
//           studentId: student._id
//         }).sort({ createdAt: -1 });

//         const allUniqueDates = await Attendance.distinct("date");
//         const totalClasses = allUniqueDates.length;
//         const presentCount = attendanceRecords.length;
//         const absentCount = Math.max(0, totalClasses - presentCount);
//         const percentage = totalClasses > 0
//           ? Math.round((presentCount / totalClasses) * 100)
//           : 0;

//         studentProfile = {
//           ...student.toObject(),
//           totalClasses,
//           presentCount,
//           absentCount,
//           percentage,
//           attendanceRecords,
//         };

//       } else {
//         // ✅ Student record not created yet in dashboard
//         return res.status(200).json({
//           token,
//           role: user.role,
//           studentProfile: null,
//           message: "Please complete your student registration in dashboard",
//         });
//       }
//     }

//     res.status(200).json({
//       token,
//       role: user.role,
//       studentProfile,
//     });

//   } catch (error) {
//     console.error("loginUser error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };




import User from "../models/User.js";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const secretKey = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN;

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "student",
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      secretKey|| "dinesh",
      { expiresIn }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      role: newUser.role,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (error) {
    console.error("registerUser error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // ✅ Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      secretKey,
      { expiresIn }
    );
    // ✅ If student — find Student record by SAME email
    let studentProfile = null;
    if (user.role === "student") {
      const student = await Student.findOne({ email: user.email }) // ✅ match by email
        .select("-faceDescriptors");
      if (student) {
        const attendanceRecords = await Attendance.find({
          studentId: student._id
        }).sort({ createdAt: -1 });
        const allUniqueDates = await Attendance.distinct("date");
        const totalClasses = allUniqueDates.length;
        const presentCount = attendanceRecords.length;
        const absentCount = Math.max(0, totalClasses - presentCount);
        const percentage = totalClasses > 0
          ? Math.round((presentCount / totalClasses) * 100)
          : 0;
        studentProfile = {
          ...student.toObject(),
          totalClasses,
          presentCount,
          absentCount,
          percentage,
          attendanceRecords,
        };
      } else {
        // ✅ Student record not created yet in dashboard
        return res.status(200).json({
          token,
          role: user.role,
          studentProfile: null,
          message: "Please complete your student registration in dashboard",
        });
      }
    }
    res.status(200).json({
      token,
      role: user.role,
      studentProfile,
    });
    
  } catch (error) {
    console.error("loginUser error:", error.message);
    res.status(500).json({ error: error.message });
  }
};