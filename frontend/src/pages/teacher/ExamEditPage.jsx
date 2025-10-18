import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const ExamEditPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [exam, setExam] = useState(null);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [totalPoints, setTotalPoints] = useState(0);
    const [duration, setDuration] = useState(60);

    // Track initial state for comparison
    const [initialState, setInitialState] = useState({
        selectedQuestionIds: new Set(),
        duration: 60,
        totalPoints: 0
    });

    // FIXED: fetchExamData moved outside and wrapped with useCallback for ESLint compliance
    const fetchExamData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // 1. Fetch Exam Details (GET /api/exams/:examId)
            const examRes = await axios.get(`/api/exams/${examId}`, config);
            const fetchedExam = examRes.data;
            setExam(fetchedExam);
            setDuration(fetchedExam.durationMinutes);

            // Set initial selection and calculate points from existing exam questions
            const initialIds = new Set(fetchedExam.questions.map(q => q._id));
            setSelectedQuestionIds(initialIds);

            const initialPoints = fetchedExam.questions.reduce((sum, q) => sum + q.points, 0);
            setTotalPoints(initialPoints);
            
            // 2. Fetch ALL Available Questions for the Unit (GET /api/questions/unit/:unitId)
            const unitId = fetchedExam.unit._id; 
            if (!unitId) {
                throw new Error("Exam data is corrupt: Missing Unit ID.");
            }                
            const questionsRes = await axios.get(`/api/questions/unit/${unitId}`, config);
            setAvailableQuestions(questionsRes.data);

            // Set initial state after all data is loaded
            setInitialState({
                selectedQuestionIds: new Set(initialIds),
                duration: fetchedExam.durationMinutes,
                totalPoints: initialPoints
            });

        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load exam details.';
            setError(msg);
            // If the exam is not found, navigate back to the list
            if (err.response?.status === 404 || err.response?.status === 403) {
                 navigate('/teacher/exams', { replace: true, state: { error: msg } });
            }
        } finally {
            setLoading(false);
        }
    }, [examId, token, navigate]); // Include all dependencies

    // --- Data Fetching ---
    useEffect(() => {
        fetchExamData();
    }, [fetchExamData]); // Now only depends on fetchExamData which is stable

    // --- Handlers ---

    // Recalculates total points whenever selected questions change
    useEffect(() => {
        const newTotalPoints = availableQuestions
            .filter(q => selectedQuestionIds.has(q._id))
            .reduce((sum, q) => sum + q.points, 0);
        setTotalPoints(newTotalPoints);
    }, [selectedQuestionIds, availableQuestions]);

    // Check if anything has changed
    const hasChanges = () => {
        // Check if selected questions have changed
        const initialIdsArray = Array.from(initialState.selectedQuestionIds);
        const currentIdsArray = Array.from(selectedQuestionIds);
        
        const questionsChanged = 
            initialIdsArray.length !== currentIdsArray.length ||
            !initialIdsArray.every(id => currentIdsArray.includes(id)) ||
            !currentIdsArray.every(id => initialIdsArray.includes(id));
        
        // Check if duration has changed
        const durationChanged = initialState.duration !== duration;
        
        return questionsChanged || durationChanged;
    };

    const handleToggleQuestion = (question) => {
        const newSelectedIds = new Set(selectedQuestionIds);
        if (newSelectedIds.has(question._id)) {
            newSelectedIds.delete(question._id);
        } else {
            newSelectedIds.add(question._id);
        }
        setSelectedQuestionIds(newSelectedIds);
    };

    // For duration input
    const handleDurationChange = (e) => {
        setDuration(parseInt(e.target.value) || 1); // Ensure it's a number
        setError(null);
    };

    const handleSaveContent = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
            
            const payload = {
                questions: Array.from(selectedQuestionIds),
                totalMarks: totalPoints,
                durationMinutes: duration,
            };

            // PUT /api/exams/:examId
            await axios.put(`/api/exams/${examId}`, payload, config);
            
            // Update initial state to current state after successful save
            setInitialState({
                selectedQuestionIds: new Set(selectedQuestionIds),
                duration: duration,
                totalPoints: totalPoints
            });
            
            alert('Exam content saved successfully!');
            navigate('/teacher/exams');

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save exam content.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!exam || exam.status !== 'draft') return;

        if (!window.confirm("WARNING: Publishing the exam will make it available to students. You will not be able to edit the questions or total marks afterward. Proceed?")) {
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
            
            // NOTE: We rely on the totalPoints being calculated and saved by a preceding 'Save Exam Content' action.
            // We explicitly set the status to 'active' here.
            const payload = {
                status: 'active', // <-- CRITICAL: Change status
                // Optional: Update scheduledStart to current time if you want it immediately available
                // scheduledStart: new Date().toISOString(), 
            };

            // PUT /api/exams/:examId
            await axios.put(`/api/exams/${examId}`, payload, config);
            
            alert('Exam successfully published and is now active!');
            // FIXED: Now we can call fetchExamData to reload data
            fetchExamData(); 
            // Or navigate back to the list:
            // navigate('/teacher/exams'); 

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to publish exam.');
        } finally {
            setIsSaving(false);
        }
    };

    // Check for changes AND the original conditions
    const isSaveDisabled = 
        isSaving || 
        (totalPoints === 0 && availableQuestions.length === 0) ||
        !hasChanges();

    if (loading || !exam) return <div className="p-8 text-center text-red-600">Loading Exam Configuration...</div>;
    if (error && exam === null) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

    // Filter questions into selected and unselected lists
    const selectedQuestions = availableQuestions.filter(q => selectedQuestionIds.has(q._id));
    const unselectedQuestions = availableQuestions.filter(q => !selectedQuestionIds.has(q._id));

    return (
        <div className="p-6 bg-white rounded-lg shadow-xl">
            <Link to="/teacher/exams" className="text-red-600 hover:text-red-800 text-sm mb-4 block">
                &larr; Back to Exam List
            </Link>
            
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-3xl font-bold text-gray-800">Configure Exam: {exam.name || exam.title}</h1>
                
                {/* Duration and Marks Display (Side-by-side for editing) */}
                <div className="flex items-center space-x-4">
                    <div className="text-lg font-semibold bg-gray-100 p-2 rounded-lg">
                        Total Marks: <span className="text-green-600">{totalPoints}</span>
                    </div>
                    
                    {/* EDITABLE DURATION FIELD */}
                    <div className="text-lg font-semibold bg-gray-100 p-2 rounded-lg flex items-center space-x-2">
                        <label htmlFor="duration" className="text-gray-800">Duration (min):</label>
                        <input
                            id="duration"
                            type="number"
                            name="durationMinutes"
                            value={duration}
                            onChange={handleDurationChange}
                            min="1"
                            className="w-16 p-1 border border-gray-300 rounded text-center text-red-600 font-bold"
                            disabled={isSaving || exam.status !== 'draft'}
                        />
                    </div>
                    {/* END EDITABLE DURATION FIELD */}
                </div>
            </div>

            <h2 className="text-xl font-semibold mb-3">Unit: {exam.unit.name} ({availableQuestions.length} Questions Available)</h2>

            {error && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded">{error}</p>}
            
            {/* Action Bar */}
            <div className="mb-6 flex justify-end space-x-3">
                {/* Save Content Button */}
                <button
                    onClick={handleSaveContent}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    disabled={isSaveDisabled || exam.status !== 'draft'}
                    title={!hasChanges() ? "No changes to save" : exam.status !== 'draft' ? "Cannot edit published exam" : ""}
                >
                    {isSaving ? 'Saving...' : 'Save Exam Content'}
                </button>
                
                {/* Publish Button */}
                {exam.status === 'draft' && (
                    <button
                        onClick={handlePublish}
                        disabled={isSaving || totalPoints === 0 || selectedQuestionIds.size === 0} 
                        className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        title={selectedQuestionIds.size === 0 ? "Add questions before publishing" : totalPoints === 0 ? "Questions must have points" : ""}
                    >
                        {isSaving ? 'Publishing...' : 'Publish Exam'}
                    </button>
                )}
                
                {/* Display a reminder if published */}
                {exam.status === 'active' && (
                    <span className="p-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg font-semibold">
                        Status: ACTIVE (Read-Only)
                    </span>
                )}
            </div>

            {/* Show message when no changes */}
            {!hasChanges() && exam.status === 'draft' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm">No changes made to save.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1: Selected Questions */}
                <div>
                    <h3 className="text-lg font-bold mb-3 p-2 bg-green-100 rounded">
                        Selected Questions ({selectedQuestions.length})
                    </h3>
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-3">
                        {selectedQuestions.length === 0 ? (
                            <p className="text-gray-500 italic">No questions selected for this exam.</p>
                        ) : (
                            selectedQuestions.map((q) => (
                                <QuestionCard 
                                    key={q._id} 
                                    question={q} 
                                    isSelected={true} 
                                    onToggle={handleToggleQuestion}
                                    disabled={exam.status !== 'draft'}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Column 2: Available Questions */}
                <div>
                    <h3 className="text-lg font-bold mb-3 p-2 bg-gray-200 rounded">
                        Available Questions ({unselectedQuestions.length})
                    </h3>
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-3">
                        {unselectedQuestions.length === 0 && selectedQuestions.length > 0 ? (
                            <p className="text-gray-500 italic">All unit questions have been selected.</p>
                        ) : availableQuestions.length === 0 ? (
                            <p className="text-red-500 italic font-semibold">No questions exist in this unit. Add questions via the Unit Management page.</p>
                        ) : (
                            unselectedQuestions.map((q) => (
                                <QuestionCard 
                                    key={q._id} 
                                    question={q} 
                                    isSelected={false} 
                                    onToggle={handleToggleQuestion}
                                    disabled={exam.status !== 'draft'}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple reusable component for question display
const QuestionCard = ({ question, isSelected, onToggle, disabled }) => {
    return (
        <div className={`p-3 border rounded-lg shadow-sm transition duration-150 ${
            isSelected ? 'bg-green-50 border-green-400' : 'bg-white hover:bg-gray-50 border-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <p className="text-sm font-medium text-gray-800 line-clamp-2">{question.text}</p>
            <div className="flex justify-between items-center text-xs mt-2">
                <span className="text-gray-500">{question.questionType} ({question.points} Pts)</span>
                <button
                    onClick={() => !disabled && onToggle(question)}
                    className={`px-3 py-1 text-xs rounded transition ${
                        isSelected 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={disabled}
                >
                    {isSelected ? 'Remove' : 'Select'}
                </button>
            </div>
        </div>
    );
};

export default ExamEditPage;