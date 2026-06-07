import express from "express";
import { matchFace } from "../controllers/faceController.js";  
// import { recognizeFace, trainModel } from "../controllers/faceController.js";

const router = express.Router();


router.post("/match", matchFace);
// recognize face from webcam image
// router.post("/recognize", recognizeFace);

// train model after adding new students
// router.post("/train", trainModel);

export default router;