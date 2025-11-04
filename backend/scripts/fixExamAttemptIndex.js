// backend/scripts/fixExamAttemptIndex.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.db.collection('studentexamattempts');
    
    // Drop the old index
    try {
      await collection.dropIndex('student_1_exam_1');
      console.log('Dropped old index: student_1_exam_1');
    } catch (error) {
      console.log('Old index not found or already dropped');
    }
    
    // Create the new partial index
    await collection.createIndex(
      { student: 1, exam: 1, status: 1 },
      { 
        unique: true,
        partialFilterExpression: { 
          status: { $in: ['not_started', 'in_progress'] } 
        },
        name: 'student_1_exam_1_status_1'
      }
    );
    console.log('Created new partial index: student_1_exam_1_status_1');
    
    console.log('Index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing index:', error);
    process.exit(1);
  }
};

fixIndex();