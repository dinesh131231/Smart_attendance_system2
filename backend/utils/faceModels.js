import * as faceapi from "@vladmandic/face-api";
import * as canvas from "canvas";
import path from "path";

const { Canvas, Image, ImageData } = canvas;

// ✅ Patch for Node
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// 🔥 ADD HERE

const MODEL_PATH = path.join(process.cwd(), "face-models");

// ✅ Load function
export const loadModels = async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);

  console.log("✅ Models Loaded");
};