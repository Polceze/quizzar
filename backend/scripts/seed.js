import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;
await mongoose.connect(uri);

const studentSchema = new mongoose.Schema({
  name: String,
  studentId: String,
  year: Number
});
const Student = mongoose.model('Student', studentSchema);

await Student.create({ name: 'Test Student', studentId: 'S0001', year: 2 });
console.log('Seed complete');
process.exit(0);
