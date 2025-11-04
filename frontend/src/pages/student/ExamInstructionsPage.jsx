// frontend/src/pages/student/ExamInstructionsPage.jsx - Update the fetch call
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const ExamInstructionsPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Fetch exam details using student endpoint
  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        if (!token) {
          setFetchError('Authentication error. Please log in again.');
          setFetchLoading(false);
          return;
        }

        const config = { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        };
        
        const url = `/api/student/exams/${examId}/details`;
        
        const response = await axios.get(url, config);
        setExamData(response.data);
        
      // In the catch block of fetchExamDetails:
      } catch (error) {
          console.error('❌ Failed to fetch exam details:', error);
          console.error('📊 Error details:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              message: error.response?.data?.message
          });
          
          // Handle specific error cases
          if (error.response?.status === 401) {
              setFetchError('Authentication failed. Please log in again.');
          } else if (error.response?.status === 403) {
              error.response?.data?.details;
              if (error.response?.data?.message?.includes('not enrolled')) {
                  setFetchError('You are not enrolled in the unit for this exam. Please contact your teacher.');
              } else {
                  setFetchError('You do not have permission to access this exam.');
              }
          } else if (error.response?.status === 404) {
              setFetchError('Exam not found or no longer available.');
          } else if (error.response?.status === 400) {
              if (error.response?.data?.message?.includes('not started')) {
                  setFetchError(`Exam has not started yet. It will be available from: ${new Date(error.response.data.scheduledStart).toLocaleString()}`);
              } else if (error.response?.data?.message?.includes('already ended')) {
                  setFetchError(`Exam has already ended. It was available until: ${new Date(error.response.data.scheduledEnd).toLocaleString()}`);
              } else {
                  setFetchError(error.response?.data?.message || 'Exam is not currently available.');
              }
          } else {
              const errorMessage = error.response?.data?.message || 'Failed to load exam information. Please try again.';
              setFetchError(errorMessage);
          }
      } finally {
          setFetchLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId, token]);

  const handleStartExam = async () => {
    if (!accepted) {
      alert('You must accept the exam instructions to continue.');
      return;
    }

    setLoading(true);
    try {
      // Navigate to the actual exam page
      navigate(`/student/exams/${examId}/take`);
    } catch (error) {
      console.error('Failed to start exam:', error);
      alert('Failed to start exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (window.confirm('Are you sure you want to go back? You will need to accept the instructions to take the exam.')) {
      navigate('/student/exams');
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam information...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-bold mb-2">Cannot Load Exam</h2>
            <p className="mb-4">{fetchError}</p>
            <button
              onClick={() => navigate('/student/exams')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Exam List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Exam not found.</p>
          <Link to="/student/exams" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Back to Exam List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/student/exams" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">
          &larr; Back to Exam List
        </Link>
        
        <div className="bg-white rounded-lg shadow-lg border p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Exam Instructions</h1>
            <p className="text-gray-600">Please read the following instructions carefully before starting your exam.</p>
          </div>

          {/* Exam Details Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Exam Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Exam Name</p>
                <p className="font-semibold">{examData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{examData.durationMinutes} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="font-semibold">{examData.totalQuestions} questions</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Marks</p>
                <p className="font-semibold">{examData.totalMarks} marks</p>
              </div>
              {examData.unit && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Unit</p>
                    <p className="font-semibold">{examData.unit.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unit Code</p>
                    <p className="font-semibold">{examData.unit.code}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-6 mb-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">📝 General Instructions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>This exam must be completed in one sitting. You cannot pause and resume later.</li>
                <li>The timer will start as soon as you begin the exam and cannot be paused.</li>
                <li>All questions must be answered within the allotted time.</li>
                <li>Use the "Flag" feature to mark questions you want to review later.</li>
                <li>Your answers are saved automatically as you progress through the exam.</li>
                {examData.allowMultipleAttempts ? (
                  <li className="text-green-600 font-semibold">Multiple attempts are allowed for this exam.</li>
                ) : (
                  <li className="text-red-600 font-semibold">Only one attempt is allowed for this exam.</li>
                )}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">⚡ Technical Requirements</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Stable internet connection is required throughout the exam</li>
                <li>Use a modern browser (Chrome, Firefox, Safari, or Edge)</li>
                <li>Ensure your device is plugged in or fully charged</li>
                <li>Close all other applications and browser tabs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-red-800 mb-3">🚫 Strict Exam Integrity Policy</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Zero-Tolerance Violations (Immediate Auto-Submission):</h3>
                <ul className="list-disc list-inside space-y-2 text-red-700">
                  <li><strong>Switching tabs or applications</strong> - IMMEDIATE auto-submission</li>
                  <li><strong>Opening developer tools (F12, Ctrl+Shift+I)</strong> - IMMEDIATE auto-submission</li>
                  <li><strong>Taking screenshots (Print Screen)</strong> - IMMEDIATE auto-submission</li>
                  <li><strong>Using Alt+Tab or Cmd+Tab to switch apps</strong> - IMMEDIATE auto-submission</li>
                  <li><strong>Losing window focus</strong> - IMMEDIATE auto-submission</li>
                </ul>
                
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
                  <p className="text-red-800 font-semibold text-center">
                    ⚠️ <strong>CRITICAL:</strong> Close ALL other browser tabs and applications before starting. 
                    Any attempt to switch away from this exam will result in immediate automatic submission.
                  </p>
                </div>

                <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                  <h4 className="font-semibold text-yellow-800 mb-1">Allowed Actions:</h4>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                    <li>Right-click (context menu) - allowed but monitored</li>
                    <li>Copying text within the exam - prevented but not penalized</li>
                    <li>Normal browser navigation within the exam</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-green-800 mb-3">✅ Preparation Checklist</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Close all other browser tabs and windows</li>
                <li>Close all other applications (Word, PDF viewers, etc.)</li>
                <li>Ensure you have stable internet connection</li>
                <li>Put your phone on silent and away from your desk</li>
                <li>Inform others not to disturb you during the exam</li>
                <li>Use a fully charged device or keep it plugged in</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-green-800 mb-3">✅ What to Expect</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>You can navigate between questions using the sidebar</li>
                <li>Your progress is saved automatically every 30 seconds</li>
                <li>You can submit your exam at any time before the timer expires</li>
                <li>Results will be available after your teacher releases them</li>
              </ul>
            </section>
          </div>

          {/* Acceptance Checkbox */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-yellow-800">
                  I have read and understood all the instructions above
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  I confirm that I will adhere to the exam rules and understand that violations may result in automatic submission and academic penalties.
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between space-x-4">
            <button
              onClick={handleDecline}
              className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
            >
              Decline & Go Back
            </button>
            
            <button
              onClick={handleStartExam}
              disabled={!accepted || loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting Exam...
                </>
              ) : (
                'Start Exam Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInstructionsPage;