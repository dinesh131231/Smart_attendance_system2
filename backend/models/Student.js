import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    rollNumber: {
      type: String,
      required: true,
      unique: true
    },

   faceDescriptors: {
    type: [[Number]], // array of arrays (128 values each)
    default: [],
  },
   attendanceCount: {
    type: Number,
    default: 0,
  },
  email:{type:String, required:true, unique:true},
  Student_id:{type:String, required:true, unique:true},
  course:{type:String, required:true},
  lastattendanceDate:{type:Date}
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;