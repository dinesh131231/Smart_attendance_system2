import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    name: { type: String },   // "Dinesh sutar"
    rollNumber: { type: String },
    date: {
      type: String,
      required: true
    },

    time: {
      type: String,
      required: true
    },

    status: {
      type: String,
      default: "Present"
    }
  },
  { timestamps: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;