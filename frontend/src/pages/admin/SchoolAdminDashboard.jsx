import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';

const SchoolAdminDashboard = () => {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { token } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [schoolNameConfirm, setSchoolNameConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState('');

  const fetchSchoolData = useCallback(async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/schools/admin', config);
      setSchool(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch school data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSchoolData();
  }, [fetchSchoolData]);

  const handleTeacherApproval = async (teacherId, action) => {
    setError('');
    setMessage('');
    
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.put(`/api/schools/teachers/${teacherId}`, { action }, config);
      setMessage(res.data.message);
      fetchSchoolData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request');
    }
  };

  const getStats = () => {
    if (!school) return {};
    
    const pendingTeachers = school.teachers.filter(t => t.status === 'pending').length;
    const approvedTeachers = school.teachers.filter(t => t.status === 'approved').length;
    const totalStudents = school.students.length;

    return { pendingTeachers, approvedTeachers, totalStudents };
  };

  const handleDeleteSchool = async () => {
    if (schoolNameConfirm !== school.name) {
      setError('School name does not match. Please type the school name exactly to confirm.');
      return;
    }

    if (!window.confirm('This action is irreversible! All school data including teachers, students, exams, and results will be permanently deleted. Are you absolutely sure?')) {
      return;
    }

    setIsDeleting(true);
    setError('');
    setMessage('');
    
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Show initial progress
      setDeletionProgress('Executing the deletion process...');
      
      const res = await axios.delete(`/api/schools/${school._id}`, {
        ...config,
        // Add timeout since deletion might take time
        timeout: 30000
      });
      
      setDeletionProgress('Deletion completed! Redirecting...');
      setMessage(res.data.message);
      
      // Redirect after a brief delay to show success message
      setTimeout(() => {
        window.location.href = '/schools';
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete school');
      setIsDeleting(false);
      setDeletionProgress('');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading School Data...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!school) return <div className="p-8 text-center">No school data found.</div>;

  const stats = getStats();

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{school.name}</h1>
          <p className="text-gray-600">{school.description}</p>
          <p className="text-sm text-gray-500">Subscription: {school.subscriptionTier}</p>
        </div>
        <Link to="/teacher/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm">
          &larr; Back to Teacher Dashboard
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'teachers', 'students', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}

      {activeTab === 'overview' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">School Overview</h2>
          <div className="space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Students</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Approved Teachers</h3>
                <p className="text-3xl font-bold text-green-600">{stats.approvedTeachers}</p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Pending Teachers</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingTeachers}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <div className="flex space-x-4">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                  Manage Subscription
                </button>
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teachers' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Teacher Management</h2>
          
          {/* Pending Teachers */}
          {stats.pendingTeachers > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-yellow-700 mb-3">Pending Approval ({stats.pendingTeachers})</h3>
              <div className="space-y-3">
                {school.teachers
                  .filter(teacher => teacher.status === 'pending')
                  .map((teacher) => (
                    <div key={teacher._id} className="flex justify-between items-center p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium">{teacher.teacher?.email}</p>
                        <p className="text-sm text-gray-600">
                          Requested: {new Date(teacher.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTeacherApproval(teacher.teacher._id, 'approve')}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleTeacherApproval(teacher.teacher._id, 'reject')}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Approved Teachers */}
          <div>
            <h3 className="text-lg font-medium text-green-700 mb-3">Approved Teachers ({stats.approvedTeachers})</h3>
            {stats.approvedTeachers === 0 ? (
              <p className="text-gray-500 text-center py-4">No approved teachers yet.</p>
            ) : (
              <div className="space-y-3">
                {school.teachers
                  .filter(teacher => teacher.status === 'approved')
                  .map((teacher) => (
                    <div key={teacher._id} className="flex justify-between items-center p-4 border border-green-200 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">{teacher.teacher?.email}</p>
                        <p className="text-sm text-gray-600">
                          Joined: {new Date(teacher.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleTeacherApproval(teacher.teacher._id, 'remove')}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Student Management ({stats.totalStudents})</h2>
          {stats.totalStudents === 0 ? (
            <p className="text-gray-500 text-center py-8">No students have joined your school yet.</p>
          ) : (
            <div className="space-y-3">
              {school.students.map((student) => (
                <div key={student._id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">{student.email}</p>
                    <p className="text-sm text-gray-600">Student</p>
                  </div>
                  <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">School Settings</h2>
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">School Information</h3>
              <p className="text-sm text-gray-600 mb-4">Update your school's basic information</p>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                Edit School Details
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Subscription Management</h3>
              <p className="text-sm text-gray-600 mb-2">Current Plan: {school.subscriptionTier}</p>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                Upgrade Plan
              </button>
            </div>

            {/* Dangerous Zone */}
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
              <p className="text-sm text-red-600 mb-4">
                Once you delete a school, there is no going back. Please be certain.
              </p>
              
              {isDeleting ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                    <div>
                      <p className="text-red-700 font-medium">Deleting School Data...</p>
                      <p className="text-sm text-red-600">{deletionProgress}</p>
                    </div>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ) : !deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Delete School
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 font-medium">
                    Type the school name <strong>"{school.name}"</strong> to confirm deletion:
                  </p>
                  <input
                    type="text"
                    value={schoolNameConfirm}
                    onChange={(e) => setSchoolNameConfirm(e.target.value)}
                    placeholder={`Type "${school.name}" to confirm`}
                    className="w-full p-2 border border-red-300 rounded text-sm"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDeleteSchool}
                      disabled={schoolNameConfirm !== school.name}
                      className={`px-4 py-2 text-white rounded text-sm ${
                        schoolNameConfirm === school.name
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-red-400 cursor-not-allowed'
                      }`}
                    >
                      I understand, delete everything
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirm(false);
                        setSchoolNameConfirm('');
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdminDashboard;