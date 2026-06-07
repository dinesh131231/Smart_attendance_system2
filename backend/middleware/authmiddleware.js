// // import jwt from "jsonwebtoken"
// // import dotenv from "dotenv"

// // dotenv.config()
// // const secretKey=process.env.JWT_SECRET;


// // const authMiddleware = (req, res, next) => {
// //   const header = req.headers.authorization

// //   if (!header) {
// //     return res.status(401).json({ message: "Access denied" })
// //   }

// //   try {
// //     const token = header.split(" ")[1]
// //     const decoded = jwt.verify(token, secretKey)

// //     req.user = decoded
// //     next()

// //   } catch (error) {
// //     res.status(401).json({ message: "Invalid token" })
// //   }
// // }

// export default authMiddleware



import jwt from 'jsonwebtoken';
import  User  from '../models/User.js';

// ─── Admin Auth Middleware ────────────────────────────────────────────────────
export const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied: admins only' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired, please login again' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        console.error('adminAuth error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Student Auth Middleware ──────────────────────────────────────────────────
export const studentAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access denied: students only' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired, please login again' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        console.error('studentAuth error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Any Auth (Admin OR Student) ─────────────────────────────────────────────
export const anyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        if (!['admin', 'student'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Unknown role' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired, please login again' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        console.error('anyAuth error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};