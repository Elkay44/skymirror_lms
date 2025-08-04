"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, PlusCircle, MinusCircle, Copy, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  id: string;
  name: string;
  points: number;
  description: string;
}

export interface Rubric {
  id?: string;
  title: string;
  description: string;
  maxPoints: number;
  criteria: RubricCriterion[];
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RubricBuilderProps {
  initialRubric?: Rubric;
  projectId?: string;
  onSave: (rubric: Rubric) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export default function RubricBuilder({ 
  initialRubric, 
  projectId, 
  onSave, 
  onCancel,
  readOnly = false 
}: RubricBuilderProps) {
  const [rubric, setRubric] = useState<Rubric>(initialRubric || {
    title: '',
    description: '',
    maxPoints: 100,
    criteria: [],
    projectId: projectId,
  });
  
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Generate a unique ID for new items
  const generateId = () => `id_${Math.random().toString(36).substr(2, 9)}`;
  
  // Validate the rubric whenever it changes
  useEffect(() => {
    validateRubric();
  }, [rubric]);
  
  // Add a new criterion to the rubric
  const addCriterion = () => {
    if (readOnly) return;
    
    const newCriterion: RubricCriterion = {
      id: generateId(),
      name: '',
      description: '',
      weight: 1,
      levels: [
        {
          id: generateId(),
          name: 'Excellent',
          points: 4,
          description: '',
        },
        {
          id: generateId(),
          name: 'Good',
          points: 3,
          description: '',
        },
        {
          id: generateId(),
          name: 'Satisfactory',
          points: 2,
          description: '',
        },
        {
          id: generateId(),
          name: 'Needs Improvement',
          points: 1,
          description: '',
        },
      ],
    };
    
    setRubric(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion],
    }));
    
    // Open the new criterion's accordion
    setActiveAccordion(newCriterion.id);
  };
  
  // Remove a criterion from the rubric
  const removeCriterion = (criterionId: string) => {
    if (readOnly) return;
    
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria.filter(c => c.id !== criterionId),
    }));
    
    if (activeAccordion === criterionId) {
      setActiveAccordion(null);
    }
  };
  
  // Add a new level to a criterion
  const addLevel = (criterionId: string) => {
    if (readOnly) return;
    
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => {
        if (c.id === criterionId) {
          return {
            ...c,
            levels: [...c.levels, {
              id: generateId(),
              name: 'New Level',
              points: 0,
              description: '',
            }],
          };
        }
        return c;
      }),
    }));
  };
  
  // Remove a level from a criterion
  const removeLevel = (criterionId: string, levelId: string) => {
    if (readOnly) return;
    
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => {
        if (c.id === criterionId) {
          return {
            ...c,
            levels: c.levels.filter(l => l.id !== levelId),
          };
        }
        return c;
      }),
    }));
  };
  
  // Update criterion properties
  const updateCriterion = (criterionId: string, field: keyof RubricCriterion, value: any) => {
    if (readOnly) return;
    
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => {
        if (c.id === criterionId) {
          return {
            ...c,
            [field]: value,
          };
        }
        return c;
      }),
    }));
  };
  
  // Update level properties
  const updateLevel = (criterionId: string, levelId: string, field: keyof RubricLevel, value: any) => {
    if (readOnly) return;
    
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => {
        if (c.id === criterionId) {
          return {
            ...c,
            levels: c.levels.map(l => {
              if (l.id === levelId) {
                return {
                  ...l,
                  [field]: field === 'points' ? Number(value) : value,
                };
              }
              return l;
            }),
          };
        }
        return c;
      }),
    }));
  };
  
  // Duplicate a criterion
  const duplicateCriterion = (criterionId: string) => {
    if (readOnly) return;
    
    const criterionToDuplicate = rubric.criteria.find(c => c.id === criterionId);
    
    if (criterionToDuplicate) {
      const newCriterion: RubricCriterion = {
        ...criterionToDuplicate,
        id: generateId(),
        name: `${criterionToDuplicate.name} (Copy)`,
        levels: criterionToDuplicate.levels.map(l => ({ ...l, id: generateId() })),
      };
      
      setRubric(prev => ({
        ...prev,
        criteria: [...prev.criteria, newCriterion],
      }));
      
      // Open the new criterion's accordion
      setActiveAccordion(newCriterion.id);
    }
  };
  
  // Move a criterion up in the list
  const moveCriterionUp = (criterionId: string) => {
    if (readOnly) return;
    
    const criterionIndex = rubric.criteria.findIndex(c => c.id === criterionId);
    
    if (criterionIndex > 0) {
      const newCriteria = [...rubric.criteria];
      const temp = newCriteria[criterionIndex];
      newCriteria[criterionIndex] = newCriteria[criterionIndex - 1];
      newCriteria[criterionIndex - 1] = temp;
      
      setRubric(prev => ({
        ...prev,
        criteria: newCriteria,
      }));
    }
  };
  
  // Move a criterion down in the list
  const moveCriterionDown = (criterionId: string) => {
    if (readOnly) return;
    
    const criterionIndex = rubric.criteria.findIndex(c => c.id === criterionId);
    
    if (criterionIndex < rubric.criteria.length - 1) {
      const newCriteria = [...rubric.criteria];
      const temp = newCriteria[criterionIndex];
      newCriteria[criterionIndex] = newCriteria[criterionIndex + 1];
      newCriteria[criterionIndex + 1] = temp;
      
      setRubric(prev => ({
        ...prev,
        criteria: newCriteria,
      }));
    }
  };
  
  // Toggle accordion open/closed state
  const toggleAccordion = (criterionId: string) => {
    setActiveAccordion(prev => prev === criterionId ? null : criterionId);
  };
  
  // Save the rubric
  const handleSave = () => {
    if (validateRubric()) {
      onSave(rubric);
    }
  };
  
  // Validate the rubric
  const validateRubric = (): boolean => {
    const errors: string[] = [];
    
    if (!rubric.title.trim()) {
      errors.push('Rubric title is required');
    }
    
    if (rubric.criteria.length === 0) {
      errors.push('At least one criterion is required');
    }
    
    rubric.criteria.forEach((criterion, index) => {
      if (!criterion.name.trim()) {
        errors.push(`Criterion #${index + 1} name is required`);
      }
      
      if (criterion.levels.length === 0) {
        errors.push(`Criterion #${index + 1} must have at least one level`);
      }
      
      criterion.levels.forEach((level) => {
        if (!level.name.trim()) {
          errors.push(`Level name in criterion #${index + 1} is required`);
        }
      });
    });
    
    setValidationErrors(errors);
    setIsValid(errors.length === 0);
    
    return errors.length === 0;
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center min-w-0">
        <h3 className="text-lg font-semibold break-words">
          {initialRubric ? 'Edit Rubric' : 'Create New Rubric'}
        </h3>
        
        {!readOnly && (
          <div className="flex space-x-2 min-w-0">
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
              Save Rubric
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4 lg:p-6">
        {/* Rubric Header Information */}
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4 lg:gap-6">
            <div>
              <label htmlFor="rubric-title" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                Rubric Title
              </label>
              <input
                id="rubric-title"
                type="text"
                value={rubric.title}
                onChange={(e) => setRubric(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Web Application Project Rubric"
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            
            <div>
              <label htmlFor="rubric-max-points" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                Maximum Points
              </label>
              <input
                id="rubric-max-points"
                type="number"
                value={rubric.maxPoints}
                onChange={(e) => setRubric(prev => ({ ...prev, maxPoints: Number(e.target.value) }))}
                min="1"
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label htmlFor="rubric-description" className="block text-sm font-medium text-gray-700 mb-1 break-words">
              Description
            </label>
            <textarea
              id="rubric-description"
              value={rubric.description}
              onChange={(e) => setRubric(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose and scope of this rubric..."
              rows={3}
              disabled={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
        </div>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && !readOnly && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-start min-w-0">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 break-words">Please fix the following issues:</h4>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside break-words">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Criteria List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center min-w-0">
            <h4 className="text-lg font-medium break-words">Criteria</h4>
            
            {!readOnly && (
              <button
                onClick={addCriterion}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center break-words min-w-0"
              >
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Add Criterion
              </button>
            )}
          </div>
          
          {rubric.criteria.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              {readOnly ? (
                <p className="text-gray-500">No criteria defined for this rubric.</p>
              ) : (
                <div>
                  <p className="text-gray-500 mb-3">No criteria defined yet. Add your first criterion to get started.</p>
                  <button
                    onClick={addCriterion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center min-w-0"
                  >
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    Add Criterion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {rubric.criteria.map((criterion, index) => (
                <div
                  key={criterion.id}
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                >
                  <div 
                    className={`bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer ${activeAccordion === criterion.id ? 'border-b border-gray-200' : ''}`}
                    onClick={() => toggleAccordion(criterion.id)}
                  >
                    <div className="flex items-center min-w-0">
                      <span className="bg-blue-100 text-blue-800 font-medium rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 break-words min-w-0">
                        {index + 1}
                      </span>
                      <h5 className="font-medium text-gray-900 break-words">
                        {criterion.name || 'Unnamed Criterion'}
                      </h5>
                      <span className="ml-3 text-sm text-gray-500 break-words">
                        ({criterion.levels.length} levels, weight: {criterion.weight})
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 min-w-0">
                      {!readOnly && (
                        <div className="flex space-x-1 min-w-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveCriterionUp(criterion.id); }}
                            disabled={index === 0}
                            className={`p-1 rounded-md ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'}`}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveCriterionDown(criterion.id); }}
                            disabled={index === rubric.criteria.length - 1}
                            className={`p-1 rounded-md ${index === rubric.criteria.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'}`}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); duplicateCriterion(criterion.id); }}
                            className="p-1 rounded-md text-gray-500 hover:bg-gray-200"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeCriterion(criterion.id); }}
                            className="p-1 rounded-md text-red-500 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      <span className="text-gray-500">
                        {activeAccordion === criterion.id ? 
                          <ChevronUp className="h-5 w-5" /> : 
                          <ChevronDown className="h-5 w-5" />}
                      </span>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {activeAccordion === criterion.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4 lg:gap-6">
                            <div>
                              <label htmlFor={`criterion-name-${criterion.id}`} className="block text-sm font-medium text-gray-700 mb-1 break-words">
                                Criterion Name
                              </label>
                              <input
                                id={`criterion-name-${criterion.id}`}
                                type="text"
                                value={criterion.name}
                                onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                                placeholder="e.g., Code Quality"
                                disabled={readOnly}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                              />
                            </div>
                            
                            <div>
                              <label htmlFor={`criterion-weight-${criterion.id}`} className="block text-sm font-medium text-gray-700 mb-1 break-words">
                                Weight
                              </label>
                              <input
                                id={`criterion-weight-${criterion.id}`}
                                type="number"
                                value={criterion.weight}
                                onChange={(e) => updateCriterion(criterion.id, 'weight', Number(e.target.value))}
                                min="0"
                                step="0.1"
                                disabled={readOnly}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <label htmlFor={`criterion-desc-${criterion.id}`} className="block text-sm font-medium text-gray-700 mb-1 break-words">
                              Description
                            </label>
                            <textarea
                              id={`criterion-desc-${criterion.id}`}
                              value={criterion.description}
                              onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                              placeholder="Describe what you are evaluating with this criterion..."
                              rows={2}
                              disabled={readOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                            />
                          </div>
                          
                          {/* Levels Section */}
                          <div className="mt-6">
                            <div className="flex justify-between items-center mb-3 min-w-0">
                              <h6 className="text-sm font-medium text-gray-700 break-words">Assessment Levels</h6>
                              
                              {!readOnly && (
                                <button
                                  onClick={() => addLevel(criterion.id)}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs flex items-center min-w-0"
                                >
                                  <PlusCircle className="h-3 w-3 mr-1" />
                                  Add Level
                                </button>
                              )}
                            </div>
                            
                            <div className="bg-gray-50 rounded-md p-3">
                              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 mb-2 px-2 break-words">
                                <div className="col-span-3">Level</div>
                                <div className="col-span-2">Points</div>
                              </div>
                              {criterion.levels.map((level: RubricLevel) => (
                                <div key={level.id} className="grid grid-cols-12 gap-2">
                                  <div className="col-span-3">
                                    <input
                                      type="text"
                                      value={level.name}
                                      onChange={(e) => updateLevel(criterion.id, level.id, 'name', e.target.value)}
                                      placeholder="Level name"
                                      disabled={readOnly}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 break-words"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <input
                                      type="number"
                                      value={level.points}
                                      onChange={(e) => updateLevel(criterion.id, level.id, 'points', e.target.value)}
                                      min="0"
                                      max={rubric.maxPoints}
                                      disabled={readOnly}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 break-words"
                                    />
                                  </div>
                                  <div className="col-span-6">
                                    <input
                                      type="text"
                                      value={level.description}
                                      onChange={(e) => updateLevel(criterion.id, level.id, 'description', e.target.value)}
                                      placeholder="Describe the expectations for this level..."
                                      disabled={readOnly}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 break-words"
                                    />
                                  </div>
                                  <div className="col-span-1 flex justify-end min-w-0">
                                    {!readOnly && criterion.levels.length > 1 && (
                                      <button
                                        onClick={() => removeLevel(criterion.id, level.id)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded-md"
                                      >
                                        <MinusCircle className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
