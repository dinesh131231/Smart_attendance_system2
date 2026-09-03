import express from "express";
import { matchFace } from "../controllers/faceController.js";  

const router = express.Router();


router.post("/match", matchFace);


export default router;