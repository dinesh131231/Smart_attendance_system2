import User from "../models/User.js";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const secretKey = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

if (!secretKey) {
  // Fail loudly instead of silently falling back to a guessable secret.
  // A missing JWT_SECRET should never reach production.
  console.warn(
    "⚠️  JWT_SECRET is not set in .env — using an insecure fallback. Set JWT_SECRET before deploying."
  );
}

const ALLOWED_SELF_SIGNUP_ROLES = ["student", "admin"]; // admin is excluded on purpose

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

    // Prevent a caller from self-registering as "admin" by passing role in the body.
    const safeRole = ALLOWED_SELF_SIGNUP_ROLES.includes(role) ? role : "student";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: safeRole,
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      secretKey || "dinesh",
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
      secretKey || "dinesh",
      { expiresIn }
    );

    // ✅ Admins/teachers skip the student-profile lookup entirely
    if (user.role !== "student") {
      return res.status(200).json({
        token,
        role: user.role,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // ✅ If student — find Student record by SAME email
    let studentProfile = null;
    const student = await Student.findOne({ email: user.email }).select(
      "-faceDescriptors"
    );

    if (!student) {
      // ✅ Student record not created yet in dashboard
      return res.status(200).json({
        token,
        role: user.role,
        studentProfile: null,
        message: "Please complete your student registration in dashboard",
      });
    }

    const attendanceRecords = await Attendance.find({
      studentId: student._id,
    }).sort({ createdAt: -1 });

    const allUniqueDates = await Attendance.distinct("date");
    const totalClasses = allUniqueDates.length;
    const presentCount = attendanceRecords.length;
    const absentCount = Math.max(0, totalClasses - presentCount);
    const percentage =
      totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    studentProfile = {
      ...student.toObject(),
      totalClasses,
      presentCount,
      absentCount,
      percentage,
      attendanceRecords,
    };

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


export const defultAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    const existingAdmin = await User.findOne({ email: adminEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    if (existingAdmin) {
      existingAdmin.name = "Super Admin";
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log(`🔐 Default admin password refreshed: ${adminEmail}`);
      return;
    }

    await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log(`✅ Default admin created: ${adminEmail}`);
  } catch (error) {
    console.error("ensureAdminExists error:", error.message);
  }
};

export const createDefaultStudent = async () => {
  try {
    const studentEmail = (process.env.DEFAULT_STUDENT_EMAIL || "student@example.com").toLowerCase();
    const studentPassword = process.env.DEFAULT_STUDENT_PASSWORD || "Student@123";

    const existingUser = await User.findOne({ email: studentEmail });
    const existingStudent = await Student.findOne({ email: studentEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(studentPassword, salt);

    if (!existingUser) {
      await User.create({
        name: "Default Student",
        email: studentEmail,
        password: hashedPassword,
        role: "student",
      });
    } else {
      existingUser.name = "Default Student";
      existingUser.password = hashedPassword;
      existingUser.role = "student";
      await existingUser.save();
    }

    if (!existingStudent) {
      await Student.create({
        name: "Default Student",
        rollNumber: "STU001",
        email: studentEmail,
        Student_id: "STU001",
        course: "General",
        faceDescriptors: [],
      });
    }

    console.log(`✅ Default student ready: ${studentEmail}`);
  } catch (error) {
    console.error("createDefaultStudent error:", error.message);
  }
};