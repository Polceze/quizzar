import React from 'react';
import { useAuth } from '../../context/useAuth';
import { Navigate } from 'react-router-dom';

// Placeholder for the actual teacher profile form (will be built in the next step)
const TeacherProfileForm = () => {
    return (
        <div className="p-6 bg-white rounded-lg shadow-md border-2 border-green-400">
            <h2 className="text-3xl font-bold mb-4 text-green-600">Teacher Profile Form (Not fully implemented yet)</h2>
            <p className="text-gray-700">This form would allow the teacher to update their details after verification.</p>
        </div>
    );
};

const TeacherProfileGate = () => {
    const { user } = useAuth();
    
    // Check if the user's role is not the final 'teacher' role
    if (user.role === 'pending_teacher') {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-yellow-800 mb-4">Verification Required</h2>
                <p className="text-yellow-700 mb-4">
                    Thank you for registering as a teacher. Your account requires manual verification by an administrator before you can complete your profile and access teaching tools.
                </p>
                <p className="text-yellow-700 font-semibold">
                    Please wait for an administrator to update your account role.
                </p>
            </div>
        );
    }

    // If role is 'teacher' (meaning approved/verified by Admin)
    if (user.role === 'teacher') {
        return <TeacherProfileForm />;
    }

    // Fallback (Shouldn't happen due to ProtectedRoute)
    return <Navigate to="/dashboard" replace />;
};

export default TeacherProfileGate;