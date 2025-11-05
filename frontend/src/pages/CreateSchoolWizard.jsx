import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/useAuth';

const CreateSchoolWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: School Details
    schoolName: '',
    schoolDescription: '',
    // Step 2: Admin Account
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.schoolName.trim()) {
      setError('School name is required.');
      return false;
    }
    if (formData.schoolName.length < 3) {
      setError('School name must be at least 3 characters.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.adminEmail || !formData.adminPassword) {
      setError('All fields are required.');
      return false;
    }
    if (formData.adminPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        school: {
          name: formData.schoolName,
          description: formData.schoolDescription
        },
        admin: {
          email: formData.adminEmail,
          password: formData.adminPassword
        }
      };

      const res = await axios.post('/api/schools/create-with-admin', payload);

      // Auto-login the created admin
      const { token, user } = res.data;
      login(user, token);
      
      navigate('/admin/school', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create school.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === currentStep ? 'bg-indigo-600 text-white' :
                step < currentStep ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step}
              </div>
              <span className="text-xs mt-1 text-gray-600">
                {step === 1 ? 'School' : step === 2 ? 'Admin' : 'Done'}
              </span>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600">
          {currentStep === 1 && 'Create Your School'}
          {currentStep === 2 && 'Create Admin Account'}
        </h2>

        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded">{error}</p>}

        <form onSubmit={currentStep === 2 ? handleSubmit : (e) => e.preventDefault()}>
          {/* Step 1: School Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">School Name *</label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter school name"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Description (Optional)</label>
                <textarea
                  name="schoolDescription"
                  value={formData.schoolDescription}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description of your school"
                  rows={3}
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>You'll be the School Admin</strong> - with full control over teachers, students, and settings.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Admin Account */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Admin Email *</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your email address"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Password *</label>
                <input
                  type="password"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Re-enter your password"
                  required
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
            ) : (
              <div></div> // Spacer for flex alignment
            )}
            
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating School...' : 'Create School'}
              </button>
            )}
          </div>
        </form>

        {/* Back to home link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-orange-600 hover:text-orange-800"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSchoolWizard;