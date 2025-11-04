import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';

const YEAR_OF_STUDY_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'];

const StudentProfileForm = () => {
    const { user, token, updateUser } = useAuth();
    const navigate = useNavigate();
    const [isProfileLocked, setIsProfileLocked] = useState(false);
    
    // Initial state setup
    const [formData, setFormData] = useState({
        fullName: '',
        admissionNumber: '',
        yearOfStudy: YEAR_OF_STUDY_OPTIONS[0],
        age: 18,
        residence: '',
    });
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    // Fetch existing profile data on component load
    useEffect(() => {
        const fetchProfile = async () => {
            if (!token || !user) {
                setLoading(false);
                return;
            }

            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('/api/student/profile', config);
                
                if (res.data.exists && res.data.profile) {
                    const profile = res.data.profile;
                    setFormData({
                        fullName: profile.fullName || '',
                        admissionNumber: profile.admissionNumber || '',
                        yearOfStudy: profile.yearOfStudy || YEAR_OF_STUDY_OPTIONS[0],
                        age: profile.age || 18,
                        residence: profile.residence || '',
                    });
                    
                    // Set lock flag based on user verification
                    setIsProfileLocked(user.isVerified);
                    
                    setMessage('Profile loaded successfully.');
                } else {
                    // No profile exists yet
                    setIsProfileLocked(false);
                }
            } catch (err) {
                console.error("Profile fetch error:", err);
                setIsProfileLocked(false);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token, user]);

    const handleChange = (e) => {
        // Prevent changes if profile is locked (except residence)
        const { name, value } = e.target;
        
        if (isProfileLocked && name !== 'residence') {
            setError("Core profile fields are locked and cannot be modified.");
            return;
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null); // Clear error when valid change is made
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent submission if profile is locked (except for residence updates)
        if (isProfileLocked) {
            // Check if only residence is being updated
            const currentProfile = user.studentProfile || {};
            const isOnlyResidenceUpdate = 
                formData.fullName === currentProfile.fullName &&
                formData.admissionNumber === currentProfile.admissionNumber &&
                formData.yearOfStudy === currentProfile.yearOfStudy &&
                formData.age === currentProfile.age;
            
            if (!isOnlyResidenceUpdate) {
                setError("Core profile fields are locked. Only residence can be updated.");
                return;
            }
            
            // If only residence is being updated, proceed without confirmation
        } else {
            // First-time submission - show confirmation
            const confirmMessage = "⚠️ WARNING: Are you sure about this information? The profile details you enter (Full Name, Admission Number, Year, Age) will NOT be editable after this submission. Proceed?";
            if (!window.confirm(confirmMessage)) {
                return;
            }
        }
        
        setIsSaving(true);
        setError(null);
        setMessage('');

        try {
            const config = { 
                headers: { 
                    'Content-Type': 'application/json', 
                    Authorization: `Bearer ${token}` 
                } 
            };
            
            const res = await axios.post('/api/student/profile', formData, config);
            
            if (res.data.user && res.data.user.isVerified) {
                updateUser({ ...res.data.user }); 
                setIsProfileLocked(true); // Lock the form after successful submission
                
                // Navigate to dashboard after verification, with a short delay
                setTimeout(() => {
                    navigate('/student/dashboard', { replace: true });
                }, 1500);
            } else {
                setMessage(res.data.message || 'Profile saved successfully!');
            }

        } catch (err) {
            console.error("Submission Error:", err);
            setError(err.response?.data?.message || 'Failed to save profile. Please check your data.');
        } finally {
            setIsSaving(false);
        }
    };

    const isRequiredFieldsMissing = !formData.fullName || !formData.admissionNumber || !formData.yearOfStudy || !formData.age;

    // Helper function to determine if a field should be disabled
    const isFieldDisabled = (fieldName) => {
        if (fieldName === 'residence') return false; // Residence is always editable
        return isProfileLocked;
    };

    const getFieldClassName = (fieldName) => {
        const baseClasses = "mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500";
        
        if (isFieldDisabled(fieldName)) {
            return `${baseClasses} bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed`;
        }
        
        return `${baseClasses} border-gray-300`;
    };

    if (loading) return <div className="p-8 text-center text-blue-600">Loading profile data...</div>;

    return (
        <div className="p-8 bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
            <Link 
                to={user.isVerified ? "/student/dashboard" : "#"} 
                className={`text-indigo-600 hover:text-indigo-800 text-sm mb-4 block ${
                    !user.isVerified ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={(e) => {
                    if (!user.isVerified) {
                        e.preventDefault();
                        setError("Please complete your profile verification first.");
                    }
                }}
            >
                &larr; Back to Dashboard
            </Link>
            
            <h1 className="text-3xl font-bold text-indigo-700 mb-2">
                {isProfileLocked ? 'Student Profile' : 'Student Profile Completion'}
            </h1>
            
            {user.isVerified ? (
                <p className="mb-6 text-green-600 font-semibold">
                    ✅ Your account is verified.
                    {isProfileLocked && (
                        <span className="text-green-500 ml-2 font-light"> (Core profile data is locked)</span>
                    )}
                </p>
            ) : (
                <p className="mb-6 text-red-600 font-semibold">
                    🛑 Please complete the required fields to verify your account and access the dashboard.
                </p>
            )}

            {/* Help text */}
            {isProfileLocked ? (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">
                        <strong>Profile Locked:</strong> Core profile information cannot be changed after initial submission. 
                        Only the residence field can be updated. Contact support if you need to modify locked fields.
                    </p>
                </div>
            ) : (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-red-700">
                        <strong>Important:</strong> After submitting, your core profile information (Name, Admission Number, Year, Age) 
                        will be permanently locked and cannot be changed.
                    </p>
                </div>
            )}
            <br />

            {error && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded">{error}</p>}
            {message && <p className="text-green-600 mb-4 p-3 bg-green-50 rounded">{message}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                            Full Name * {isFieldDisabled('fullName') && <span className="text-gray-400 text-xs">(Locked)</span>}
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            disabled={isFieldDisabled('fullName')}
                            className={getFieldClassName('fullName')}
                        />
                    </div>

                    {/* Admission Number */}
                    <div>
                        <label htmlFor="admissionNumber" className="block text-sm font-medium text-gray-700">
                            Admission Number * {isFieldDisabled('admissionNumber') && <span className="text-gray-400 text-xs">(Locked)</span>}
                        </label>
                        <input
                            id="admissionNumber"
                            type="text"
                            name="admissionNumber"
                            value={formData.admissionNumber}
                            onChange={handleChange}
                            required
                            disabled={isFieldDisabled('admissionNumber')}
                            className={`${getFieldClassName('admissionNumber')} uppercase`}
                        />
                    </div>

                    {/* Year of Study */}
                    <div>
                        <label htmlFor="yearOfStudy" className="block text-sm font-medium text-gray-700">
                            Year of Study * {isFieldDisabled('yearOfStudy') && <span className="text-gray-400 text-xs">(Locked)</span>}
                        </label>
                        <select
                            id="yearOfStudy"
                            name="yearOfStudy"
                            value={formData.yearOfStudy}
                            onChange={handleChange}
                            required
                            disabled={isFieldDisabled('yearOfStudy')}
                            className={getFieldClassName('yearOfStudy')}
                        >
                            {YEAR_OF_STUDY_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    {/* Age */}
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                            Age * {isFieldDisabled('age') && <span className="text-gray-400 text-xs">(Locked)</span>}
                        </label>
                        <input
                            id="age"
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            required
                            min="16"
                            disabled={isFieldDisabled('age')}
                            className={getFieldClassName('age')}
                        />
                    </div>
                </div>

                {/* Residence (Always Editable) */}
                <div>
                    <label htmlFor="residence" className="block text-sm font-medium text-gray-700">
                        Residence (Optional) <span className="text-green-600 text-xs">(Editable)</span>
                    </label>
                    <input
                        id="residence"
                        type="text"
                        name="residence"
                        value={formData.residence}
                        onChange={handleChange}
                        className={getFieldClassName('residence')}
                    />
                </div>
                
                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSaving || (isProfileLocked ? false : isRequiredFieldsMissing)}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 
                     isProfileLocked ? 'Update Residence Only' : 
                     'Complete & Verify Account'}
                </button>
            </form>
            
            
        </div>
    );
};

export default StudentProfileForm;