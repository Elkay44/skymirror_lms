"use client";

import { useState, useEffect } from 'react';

import { CheckCircle, Save, AlertTriangle, Clipboard, HelpCircle } from 'lucide-react';
import { Rubric } from './RubricBuilder';

export interface RubricAssessment {
  id?: string;
  rubricId: string;
  submissionId: string;
  evaluatorId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  criteriaAssessments: CriterionAssessment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CriterionAssessment {
  criterionId: string;
  levelId: string;
  score: number;
  maxScore: number;
  comment: string;
}

interface RubricApplicatorProps {
  rubric: Rubric;
  submissionId: string;
  evaluatorId: string;
  initialAssessment?: RubricAssessment;
  onSave: (assessment: RubricAssessment) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export default function RubricApplicator({
  rubric,
  submissionId,
  evaluatorId,
  initialAssessment,
  onSave,
  onCancel,
  readOnly = false,
}: RubricApplicatorProps) {
  const [assessment, setAssessment] = useState<RubricAssessment>(
    initialAssessment || {
      rubricId: rubric.id || '',
      submissionId,
      evaluatorId,
      totalScore: 0,
      maxScore: rubric.maxPoints,
      percentage: 0,
      feedback: '',
      criteriaAssessments: rubric.criteria.map(criterion => ({
        criterionId: criterion.id,
        levelId: '',
        score: 0,
        maxScore: Math.max(...criterion.levels.map(level => level.points)),
        comment: '',
      })),
    }
  );
  
  const [isValid, setIsValid] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'assessment' | 'preview'>('assessment');
  const [showCriterionInfo, setShowCriterionInfo] = useState<string | null>(null);
  
  // Recalculate total score whenever criteria assessments change
  useEffect(() => {
    updateTotalScore();
  }, [assessment.criteriaAssessments]);
  
  // Validate assessment whenever it changes
  useEffect(() => {
    validateAssessment();
  }, [assessment]);
  
  // Update the total score based on criteria assessments
  const updateTotalScore = () => {
    const totalScore = assessment.criteriaAssessments.reduce((sum, ca) => sum + ca.score, 0);
    const percentage = (totalScore / assessment.maxScore) * 100;
    
    setAssessment(prev => ({
      ...prev,
      totalScore,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    }));
  };
  
  // Select a level for a criterion
  const selectLevel = (criterionId: string, levelId: string, points: number) => {
    if (readOnly) return;
    
    setAssessment(prev => ({
      ...prev,
      criteriaAssessments: prev.criteriaAssessments.map(ca => {
        if (ca.criterionId === criterionId) {
          return {
            ...ca,
            levelId,
            score: points,
          };
        }
        return ca;
      }),
    }));
  };
  
  // Update a comment for a criterion
  const updateComment = (criterionId: string, comment: string) => {
    if (readOnly) return;
    
    setAssessment(prev => ({
      ...prev,
      criteriaAssessments: prev.criteriaAssessments.map(ca => {
        if (ca.criterionId === criterionId) {
          return {
            ...ca,
            comment,
          };
        }
        return ca;
      }),
    }));
  };
  
  // Toggle showing the criterion info
  const toggleCriterionInfo = (criterionId: string) => {
    setShowCriterionInfo(prev => prev === criterionId ? null : criterionId);
  };
  
  // Validate the assessment
  const validateAssessment = (): boolean => {
    const errors: string[] = [];
    
    // Check if all criteria have a level selected
    assessment.criteriaAssessments.forEach((ca, index) => {
      const criterion = rubric.criteria.find(c => c.id === ca.criterionId);
      if (!ca.levelId) {
        errors.push(`Please select a level for criterion: ${criterion?.name || `#${index + 1}`}`);
      }
    });
    
    setValidationErrors(errors);
    setIsValid(errors.length === 0);
    
    return errors.length === 0;
  };
  
  // Save the assessment
  const handleSave = () => {
    if (validateAssessment()) {
      onSave(assessment);
    }
  };
  
  // Generate feedback text based on the assessment
  const generateFeedback = () => {
    if (readOnly) return;
    
    let generatedFeedback = `# Project Assessment Feedback\n\n`;
    generatedFeedback += `Overall Score: ${assessment.totalScore}/${assessment.maxScore} (${assessment.percentage}%)\n\n`;
    
    rubric.criteria.forEach(criterion => {
      const criterionAssessment = assessment.criteriaAssessments.find(ca => ca.criterionId === criterion.id);
      if (criterionAssessment) {
        const selectedLevel = criterion.levels.find(level => level.id === criterionAssessment.levelId);
        
        generatedFeedback += `## ${criterion.name}\n`;
        if (selectedLevel) {
          generatedFeedback += `Level: ${selectedLevel.name} (${criterionAssessment.score} points)\n\n`;
        }
        
        if (criterionAssessment.comment) {
          generatedFeedback += `${criterionAssessment.comment}\n\n`;
        }
      }
    });
    
    generatedFeedback += `\n_This feedback was generated automatically based on the rubric assessment._`;
    
    setAssessment(prev => ({
      ...prev,
      feedback: generatedFeedback,
    }));
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {readOnly ? 'View Assessment' : initialAssessment ? 'Edit Assessment' : 'Assess Submission'}
        </h3>
        
        {!readOnly && (
          <div className="flex space-x-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`px-4 py-2 rounded-md text-white flex items-center ${isValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Assessment
            </button>
          </div>
        )}
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${activeTab === 'assessment' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Assessment
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${activeTab === 'preview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Feedback Preview
          </button>
        </nav>
      </div>
      
      <div className="p-6">
        {activeTab === 'assessment' ? (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{rubric.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{rubric.description}</p>
              </div>
              
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-gray-500 mb-1">Current Score</div>
                <div className="text-2xl font-bold text-blue-600">
                  {assessment.totalScore} / {assessment.maxScore}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {assessment.percentage}%
                </div>
              </div>
            </div>
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && !readOnly && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Please fix the following issues:</h4>
                    <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Criteria Assessment */}
            <div className="space-y-6">
              {rubric.criteria.map((criterion, criterionIndex) => {
                const criterionAssessment = assessment.criteriaAssessments.find(
                  ca => ca.criterionId === criterion.id
                );
                
                return (
                  <div key={criterion.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 font-medium rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                          {criterionIndex + 1}
                        </span>
                        <h5 className="font-medium text-gray-900">{criterion.name}</h5>
                        <button
                          onClick={() => toggleCriterionInfo(criterion.id)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {criterionAssessment && criterionAssessment.levelId && (
                        <div className="text-sm font-medium text-gray-700">
                          Score: {criterionAssessment.score} / {criterionAssessment.maxScore}
                        </div>
                      )}
                    </div>
                    
                    {showCriterionInfo === criterion.id && (
                      <div className="px-4 py-3 bg-blue-50 border-t border-b border-blue-200">
                        <p className="text-sm text-blue-800">{criterion.description}</p>
                      </div>
                    )}
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        {criterion.levels.map(level => {
                          const isSelected = criterionAssessment?.levelId === level.id;
                          
                          return (
                            <div 
                              key={level.id}
                              onClick={() => selectLevel(criterion.id, level.id, level.points)}
                              className={`p-3 border rounded-md cursor-pointer transition-colors ${isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                    {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                  </div>
                                  <span className="font-medium text-gray-900">{level.name}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{level.points} points</span>
                              </div>
                              <p className="mt-1 text-sm text-gray-600 pl-7">{level.description}</p>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div>
                        <label 
                          htmlFor={`comment-${criterion.id}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Specific Feedback (optional)
                        </label>
                        <textarea
                          id={`comment-${criterion.id}`}
                          value={criterionAssessment?.comment || ''}
                          onChange={(e) => updateComment(criterion.id, e.target.value)}
                          placeholder="Provide specific feedback about this criterion..."
                          rows={2}
                          disabled={readOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!readOnly && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="assessment-feedback" className="block text-sm font-medium text-gray-700">
                    Overall Feedback
                  </label>
                  <button
                    onClick={generateFeedback}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Clipboard className="h-4 w-4 mr-1" />
                    Auto-generate
                  </button>
                </div>
                <textarea
                  id="assessment-feedback"
                  value={assessment.feedback}
                  onChange={(e) => setAssessment(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Provide overall feedback about the submission..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Markdown formatting is supported. Use # for headings, * for bullet points, etc.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Feedback Preview</h4>
                <p className="text-sm text-gray-600">This is how the feedback will appear to the student</p>
              </div>
              
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Final Score</div>
                <div className="text-xl font-bold text-blue-600">
                  {assessment.totalScore} / {assessment.maxScore}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {assessment.percentage}%
                </div>
              </div>
            </div>
            
            <div className="prose max-w-none border border-gray-200 rounded-lg p-6 bg-white">
              {assessment.feedback ? (
                <div dangerouslySetInnerHTML={{ 
                  __html: assessment.feedback
                    .replace(/\n/g, '<br>')
                    .replace(/#{1,6}\s+([^\n]+)/g, '<strong>$1</strong><br>')
                    .replace(/\*\s+([^\n]+)/g, '• $1<br>')
                }} />
              ) : (
                <div className="text-gray-500 italic">
                  No feedback provided yet. Switch to the Assessment tab to add feedback or click "Auto-generate".
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
