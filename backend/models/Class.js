
import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // one per day
  subject: { type: String, default: "General" },
  totalStudents: { type: Number, default: 0 },
}, { timestamps: true });

const Class = mongoose.model("Class", classSchema);
export default Class;