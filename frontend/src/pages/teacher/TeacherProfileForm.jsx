import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';

const TeacherProfileForm = () => {
    const { user, token, login } = useAuth();
    const navigate = useNavigate();
    
    // State to lock core profile fields after initial submission
    const [isProfileLocked, setIsProfileLocked] = useState(false);
    
    // Initial state setup for Teacher fields
    const [formData, setFormData] = useState({
        fullName: '',
        staffNumber: '',
        phoneNumber: '',
        residence: '',
    });
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    // Store current profile data separately
    const [currentProfile, setCurrentProfile] = useState({});

    // Fetch existing profile data on component load
    useEffect(() => {
        const fetchProfile = async () => {
            if (!token || !user) {
                setLoading(false);
                return;
            }

            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('/api/teacher/profile', config);
                
                if (res.data.exists && res.data.profile) {
                    const profile = res.data.profile;
                    setFormData({
                        fullName: profile.fullName || '',
                        staffNumber: profile.staffNumber || '',
                        phoneNumber: profile.phoneNumber || '',
                        residence: profile.residence || '',
                    });
                    
                    // Store current profile for comparison
                    setCurrentProfile(profile);
                    
                    // Set lock flag based on user verification
                    setIsProfileLocked(user.isVerified);
                    
                    // setMessage('Profile loaded successfully.');
                } else {
                    // No profile exists yet
                    setIsProfileLocked(false);
                    setCurrentProfile({});
                }
            } catch (err) {
                console.error("Profile fetch error:", err);
                setIsProfileLocked(false);
                setCurrentProfile({});
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token, user]);

    // Check if only residence is being updated (only relevant if locked)
    const isOnlyResidenceUpdate = (
        formData.fullName === currentProfile.fullName &&
        formData.staffNumber === currentProfile.staffNumber &&
        formData.phoneNumber === currentProfile.phoneNumber
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Core fields: fullName, staffNumber, phoneNumber
        const coreFields = ['fullName', 'staffNumber', 'phoneNumber'];

        // Prevent changes to core fields if profile is locked
        if (isProfileLocked && coreFields.includes(name)) {
            setError("Core profile fields are locked and cannot be modified.");
            return;
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null); // Clear error when valid change is made
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent submission if locked AND core fields are being modified
        if (isProfileLocked && !isOnlyResidenceUpdate) {
            setError("Core profile fields are locked. Only residence can be updated.");
            return;
        } 
        
        // First-time submission - show confirmation
        if (!isProfileLocked) {
            const confirmMessage = "⚠️ ALERT: Are you sure about this information? The profile details you enter (Full Name, Staff Number, Phone Number) will NOT be editable after this submission. Proceed?";
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
            
            // POST to the teacher profile endpoint
            const res = await axios.post('/api/teacher/profile', formData, config);
            
            // The updateUser from the Auth context will trigger a re-render
            if (res.data.user) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                login(res.data.user, token);
            }

            // Update current profile with new data
            if (res.data.profile) {
                setCurrentProfile(res.data.profile);
            }

            if (res.data.user && res.data.user.isVerified) {
                setIsProfileLocked(true); // Lock the form after successful submission
            }
            
            setMessage(res.data.message || 'Profile saved successfully!');
            
            // Navigate to dashboard only if verification was just completed
            if (!user.isVerified && res.data.user.isVerified) {
                setTimeout(() => {
                    navigate('/teacher/dashboard', { replace: true });
                }, 1500);
            }

        } catch (err) {
            console.error("Submission Error:", err);
            setError(err.response?.data?.message || 'Failed to save profile. Please check your data.');
        } finally {
            setIsSaving(false);
        }
    };

    const isRequiredFieldsMissing = !formData.fullName || !formData.staffNumber || !formData.phoneNumber;

    // Helper function to determine if a field should be disabled
    const isFieldDisabled = (fieldName) => {
        if (fieldName === 'residence') return false; // Residence is always editable
        return isProfileLocked;
    };

    const getFieldClassName = (fieldName) => {
        const baseClasses = "mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-teal-500 focus:border-teal-500 transition duration-150";
        
        if (isFieldDisabled(fieldName)) {
            return `${baseClasses} bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed`;
        }
        
        return `${baseClasses} border-gray-300`;
    };

    if (loading) return <div className="p-8 text-center text-blue-600">Loading profile data...</div>;

    return (
        <div className="p-8 bg-white rounded-lg shadow-xl max-w-2xl mx-auto border border-gray-100">
            <Link to="/teacher/dashboard" className="text-teal-600 hover:text-teal-800 text-sm mb-4 block font-medium">
                &larr; Back to Dashboard
            </Link>
            
            <h1 className="text-3xl font-extrabold text-teal-700 mb-2 border-b pb-2">
                {isProfileLocked ? 'Teacher Profile' : 'Teacher Profile Completion'}
            </h1>
            
            {user.isVerified ? (
                <p className="mb-6 text-green-700 font-semibold p-3 bg-green-50 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    Your account is verified.
                    {isProfileLocked && (
                        <span className="text-green-500 ml-2 text-xs font-normal"> (Core data is locked)</span>
                    )}
                </p>
            ) : (
                <p className="mb-6 text-red-700 font-semibold p-3 bg-red-50 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                    Please complete the required fields to verify your account and access the dashboard.
                </p>
            )}

            {/* Help text */}
            {isProfileLocked ? (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>🔒 Profile Locked:</strong> Core profile information (Full Name, Staff Number, Phone Number) cannot be changed after initial verification. 
                        Only the **Residence** field can be updated.
                    </p>
                </div>
            ) : (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Important:</strong> The information you enter now for your name, staff number, and phone number 
                        will be **permanently locked** upon submission to ensure data integrity. Please review carefully.
                    </p>
                </div>
            )}
            <br />

            {error && <p className="text-red-500 mb-4 p-3 bg-red-100 border border-red-300 rounded-md font-medium">{error}</p>}
            {message && <p className="text-green-600 mb-4 p-3 bg-green-100 border border-green-300 rounded-md font-medium">{message}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                            Full Name * {isFieldDisabled('fullName') && <span className="text-teal-500 text-xs">(Locked)</span>}
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

                    {/* Staff Number */}
                    <div>
                        <label htmlFor="staffNumber" className="block text-sm font-medium text-gray-700">
                            Staff Number * {isFieldDisabled('staffNumber') && <span className="text-teal-500 text-xs">(Locked)</span>}
                        </label>
                        <input
                            id="staffNumber"
                            type="text"
                            name="staffNumber"
                            value={formData.staffNumber}
                            onChange={handleChange}
                            required
                            disabled={isFieldDisabled('staffNumber')}
                            className={`${getFieldClassName('staffNumber')} uppercase`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Number */}
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                            Phone Number * {isFieldDisabled('phoneNumber') && <span className="text-teal-500 text-xs">(Locked)</span>}
                        </label>
                        <input
                            id="phoneNumber"
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                            disabled={isFieldDisabled('phoneNumber')}
                            className={getFieldClassName('phoneNumber')}
                            placeholder="e.g., +1234567890"
                        />
                    </div>
                </div>

                {/* Residence (Always Editable) */}
                <div>
                    <label htmlFor="residence" className="block text-sm font-medium text-gray-700">
                        Residence (Optional) <span className="text-gray-500 text-xs font-normal">(Always Editable)</span>
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
                    // Disable if saving OR if locked and no residence change needed, OR if fields are missing and not locked
                    disabled={isSaving || (isProfileLocked && isOnlyResidenceUpdate && formData.residence === currentProfile.residence) || (isProfileLocked ? false : isRequiredFieldsMissing)}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition duration-200 ease-in-out transform hover:scale-[1.005]"
                >
                    {isSaving ? 'Saving...' : 
                     isProfileLocked ? 'Update Residence Only' : 
                     'Complete & Verify Account'}
                </button>
            </form>
        </div>
    );
};

export default TeacherProfileForm;