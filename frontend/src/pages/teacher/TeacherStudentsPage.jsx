// frontend/src/pages/teacher/TeacherStudentsPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';

const TeacherStudentsPage = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const { token } = useAuth();

  const studentsPerPage = 10;
  const initialLoadRef = useRef(true);

  const fetchUnitStudents = useCallback(async (unitId) => {
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`/api/units/${unitId}/students`, config);
      setStudents(res.data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(`Failed to fetch students for this unit: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const fetchTeacherUnits = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('/api/units', config);
        setUnits(res.data);
        
        // Auto-select first unit only on initial load
        if (res.data.length > 0 && initialLoadRef.current) {
          initialLoadRef.current = false;
          setSelectedUnit(res.data[0]);
          fetchUnitStudents(res.data[0]._id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching units:', err);
        setError(`Failed to fetch units: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      }
    };

    fetchTeacherUnits();
  }, [token, fetchUnitStudents]);

  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u._id === unitId);
    setSelectedUnit(unit);
    setCurrentPage(1);
    fetchUnitStudents(unitId);
  };

  const handleRemoveStudent = (student) => {
    setStudentToRemove(student);
    setShowRemoveModal(true);
  };

  const confirmRemoveStudent = async () => {
    if (!studentToRemove || !selectedUnit) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/units/${selectedUnit._id}/students/${studentToRemove._id}`, config);
      
      setMessage(`Student ${studentToRemove.fullName} removed from ${selectedUnit.name}`);
      setShowRemoveModal(false);
      setStudentToRemove(null);
      
      // Refresh students list
      fetchUnitStudents(selectedUnit._id);
    } catch (err) {
      console.error('Error removing student:', err);
      setError(`Failed to remove student from unit: ${err.response?.data?.message || err.message}`);
    }
  };


  // Filter and sort students
  const filteredStudents = students.filter(student =>
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.fullName || '').localeCompare(b.fullName || '');
      case 'admission':
        return (a.admissionNumber || '').localeCompare(b.admissionNumber || '');
      case 'year': {
        const yearOrder = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4, '5th Year': 5, 'Graduate': 6 };
        return (yearOrder[a.yearOfStudy] || 0) - (yearOrder[b.yearOfStudy] || 0);
      }
      default:
        return 0;
    }
  });

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = sortedStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(sortedStudents.length / studentsPerPage);

  const getStudentStats = useCallback(() => {
    if (!selectedUnit) return {};
    
    const totalStudents = students.length;
    const byYear = students.reduce((acc, student) => {
      const year = student.yearOfStudy || 'Unknown';
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    return { totalStudents, byYear };
  }, [students, selectedUnit]);

  const stats = getStudentStats();

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <Link to="/teacher/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
        &larr; Back to Dashboard
      </Link>

      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
          <p className="text-gray-600">View and manage students in your units</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}

      {/* Unit Selection */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2">Select Unit</label>
        <select
          value={selectedUnit?._id || ''}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Choose a unit...</option>
          {units.map(unit => (
            <option key={unit._id} value={unit._id}>
              {unit.name} ({unit.code}) - {unit.students?.length || 0} students
            </option>
          ))}
        </select>
      </div>

      {selectedUnit && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Total Students</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
            </div>
            {Object.entries(stats.byYear).map(([year, count]) => (
              <div key={year} className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-sm font-medium text-green-800">{year}</h3>
                <p className="text-2xl font-bold text-green-600">{count}</p>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="name">Sort by Name</option>
                <option value="admission">Sort by Admission No.</option>
                <option value="year">Sort by Year</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {currentStudents.length} of {sortedStudents.length} students
            </div>
          </div>

          {/* Students Table */}
          {loading ? (
            <div className="text-center py-8">Loading students...</div>
          ) : currentStudents.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                {searchTerm ? 'No students match your search.' : 'No students enrolled in this unit.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admission No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.fullName || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.admissionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {student.yearOfStudy}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleRemoveStudent(student)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-sm transition"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Remove Student Confirmation Modal */}
      {showRemoveModal && studentToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Remove Student</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove <strong>{studentToRemove.fullName}</strong> from <strong>{selectedUnit?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveStudent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Remove Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudentsPage;