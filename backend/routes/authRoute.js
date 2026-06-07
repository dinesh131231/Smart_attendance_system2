import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

// import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();
// Register
router.post("/register", registerUser);

// Login
router.post("/login",loginUser);


// Get logged user profile
// router.get("/profile", authMiddleware, studentProfile);

export default router;