"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

// Base interface for all question types
interface BaseQuestionProps {
  id: string;
  questionText: string;
  questionType: string;
  points: number;
  explanation?: string | null;
  isReview?: boolean;
  isCorrect?: boolean;
  onAnswer?: (answer: any) => void;
}

// Multiple Choice Question
interface MultipleChoiceProps extends BaseQuestionProps {
  options: {
    id: string;
    optionText: string;
    position: number;
  }[];
  selectedOptionIds?: string[];
  correctOptionIds?: string[];
}

export function MultipleChoiceQuestion({
  id,
  questionText,
  points,
  options,
  explanation,
  selectedOptionIds = [],
  correctOptionIds = [],
  isReview = false,
  isCorrect,
  onAnswer,
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string[]>(selectedOptionIds || []);
  const isMultiSelect = correctOptionIds.length > 1;

  // Handle option selection
  const handleSelect = (optionId: string) => {
    if (isReview) return; // Disable selection in review mode
    
    let newSelected: string[];
    
    if (isMultiSelect) {
      // For multi-select questions
      newSelected = selected.includes(optionId)
        ? selected.filter(id => id !== optionId)
        : [...selected, optionId];
    } else {
      // For single-select questions
      newSelected = [optionId];
    }
    
    setSelected(newSelected);
    if (onAnswer) onAnswer(newSelected);
  };

  // Sort options by position
  const sortedOptions = [...options].sort((a, b) => a.position - b.position);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">{questionText}</h3>
        <span className="text-sm text-gray-500">{points} {points === 1 ? 'point' : 'points'}</span>
      </div>
      
      {isMultiSelect && (
        <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
      )}
      
      <div className="space-y-3">
        {sortedOptions.map((option) => {
          const isOptionSelected = selected.includes(option.id);
          const isOptionCorrect = isReview && correctOptionIds.includes(option.id);
          const isOptionIncorrect = isReview && isOptionSelected && !correctOptionIds.includes(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`w-full text-left flex items-center p-3 rounded-lg border ${isReview ? 'cursor-default' : 'cursor-pointer'} ${isOptionSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'} ${isOptionCorrect ? 'border-green-300 bg-green-50' : ''} ${isOptionIncorrect ? 'border-red-300 bg-red-50' : ''}`}
              disabled={isReview}
            >
              <div className="flex-shrink-0 mr-3">
                {isReview ? (
                  isOptionCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : isOptionIncorrect ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : isMultiSelect ? (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )
                ) : isMultiSelect ? (
                  <div className={`h-5 w-5 border-2 rounded ${isOptionSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                    {isOptionSelected && (
                      <svg className="h-full w-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <div className={`h-5 w-5 border-2 rounded-full ${isOptionSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                    {isOptionSelected && (
                      <div className="h-2 w-2 mx-auto mt-1 rounded-full bg-white" />
                    )}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-gray-900">{option.optionText}</span>
            </button>
          );
        })}
      </div>
      
      {isReview && explanation && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Explanation:</span> {explanation}
          </p>
        </div>
      )}
      
      {isReview && typeof isCorrect !== 'undefined' && (
        <div className={`mt-4 p-3 ${isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'} rounded-lg`}>
          <p className={`text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? 'Correct answer!' : 'Incorrect answer. Please review the explanation above.'}
          </p>
        </div>
      )}
    </div>
  );
}

// True/False Question
interface TrueFalseProps extends BaseQuestionProps {
  correctAnswer?: boolean;
  userAnswer?: boolean | null;
}

export function TrueFalseQuestion({
  id,
  questionText,
  points,
  explanation,
  correctAnswer,
  userAnswer,
  isReview = false,
  isCorrect,
  onAnswer,
}: TrueFalseProps) {
  const [selected, setSelected] = useState<boolean | null>(userAnswer === undefined ? null : userAnswer);

  const handleSelect = (value: boolean) => {
    if (isReview) return;
    setSelected(value);
    if (onAnswer) onAnswer(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">{questionText}</h3>
        <span className="text-sm text-gray-500">{points} {points === 1 ? 'point' : 'points'}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect(true)}
          className={`p-4 rounded-lg border text-center ${isReview ? 'cursor-default' : 'cursor-pointer'} ${
            selected === true ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
          } ${isReview && correctAnswer === true ? 'border-green-300 bg-green-50' : ''} ${
            isReview && selected === true && correctAnswer === false ? 'border-red-300 bg-red-50' : ''
          }`}
          disabled={isReview}
        >
          <span className="text-lg font-medium">True</span>
        </button>
        
        <button
          onClick={() => handleSelect(false)}
          className={`p-4 rounded-lg border text-center ${isReview ? 'cursor-default' : 'cursor-pointer'} ${
            selected === false ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
          } ${isReview && correctAnswer === false ? 'border-green-300 bg-green-50' : ''} ${
            isReview && selected === false && correctAnswer === true ? 'border-red-300 bg-red-50' : ''
          }`}
          disabled={isReview}
        >
          <span className="text-lg font-medium">False</span>
        </button>
      </div>
      
      {isReview && explanation && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Explanation:</span> {explanation}
          </p>
        </div>
      )}
      
      {isReview && typeof isCorrect !== 'undefined' && (
        <div className={`mt-4 p-3 ${isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'} rounded-lg`}>
          <p className={`text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? 'Correct answer!' : 'Incorrect answer. The correct answer is ' + (correctAnswer ? 'True' : 'False')}
          </p>
        </div>
      )}
    </div>
  );
}

// Fill in the Blank Question
interface FillBlankProps extends BaseQuestionProps {
  correctAnswers?: string[];
  userAnswer?: string;
}

export function FillBlankQuestion({
  id,
  questionText,
  points,
  explanation,
  correctAnswers = [],
  userAnswer = '',
  isReview = false,
  isCorrect,
  onAnswer,
}: FillBlankProps) {
  const [answer, setAnswer] = useState(userAnswer || '');
  
  // Format the question to highlight the blank
  const formattedQuestion = questionText.replace('_____', '<span class="px-1 mx-1 border-b-2 border-gray-400">_____</span>');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReview) return;
    setAnswer(e.target.value);
    if (onAnswer) onAnswer(e.target.value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: formattedQuestion }}></h3>
        <span className="text-sm text-gray-500">{points} {points === 1 ? 'point' : 'points'}</span>
      </div>
      
      <div className="mt-4">
        <input
          type="text"
          value={answer}
          onChange={handleChange}
          placeholder="Enter your answer"
          className={`w-full p-3 border rounded-lg ${isReview ? 'bg-gray-100' : 'bg-white'} ${
            isReview && isCorrect ? 'border-green-300' : isReview && !isCorrect ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={isReview}
        />
      </div>
      
      {isReview && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">Correct Answer(s):</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
            {correctAnswers.map((answer, index) => (
              <li key={index}>{answer}</li>
            ))}
          </ul>
        </div>
      )}
      
      {isReview && explanation && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Explanation:</span> {explanation}
          </p>
        </div>
      )}
      
      {isReview && typeof isCorrect !== 'undefined' && (
        <div className={`mt-4 p-3 ${isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'} rounded-lg`}>
          <p className={`text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? 'Correct answer!' : 'Incorrect answer. Please review the correct answers above.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Short Answer Question
interface ShortAnswerProps extends BaseQuestionProps {
  correctAnswers?: string[];
  userAnswer?: string;
}

export function ShortAnswerQuestion({
  id,
  questionText,
  points,
  explanation,
  correctAnswers = [],
  userAnswer = '',
  isReview = false,
  isCorrect,
  onAnswer,
}: ShortAnswerProps) {
  const [answer, setAnswer] = useState(userAnswer || '');
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isReview) return;
    setAnswer(e.target.value);
    if (onAnswer) onAnswer(e.target.value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">{questionText}</h3>
        <span className="text-sm text-gray-500">{points} {points === 1 ? 'point' : 'points'}</span>
      </div>
      
      <div className="mt-4">
        <textarea
          value={answer}
          onChange={handleChange}
          placeholder="Enter your answer"
          rows={4}
          className={`w-full p-3 border rounded-lg ${isReview ? 'bg-gray-100' : 'bg-white'} ${
            isReview && isCorrect ? 'border-green-300' : isReview && !isCorrect ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={isReview}
        />
      </div>
      
      {isReview && correctAnswers.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">Sample Answer:</p>
          <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">{correctAnswers[0]}</p>
          </div>
        </div>
      )}
      
      {isReview && explanation && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Explanation:</span> {explanation}
          </p>
        </div>
      )}
      
      {isReview && typeof isCorrect !== 'undefined' && (
        <div className={`mt-4 p-3 ${isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'} rounded-lg`}>
          <p className={`text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? 'Correct answer!' : 'Your answer was marked incorrect. Please review the sample answer above.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Matching Question
interface MatchingProps extends BaseQuestionProps {
  items: { id: string; text: string }[];
  matches: { id: string; text: string }[];
  correctPairs?: { itemId: string; matchId: string }[];
  userPairs?: { itemId: string; matchId: string }[];
}

export function MatchingQuestion({
  id,
  questionText,
  points,
  explanation,
  items,
  matches,
  correctPairs = [],
  userPairs = [],
  isReview = false,
  isCorrect,
  onAnswer,
}: MatchingProps) {
  const [pairs, setPairs] = useState<{ itemId: string; matchId: string }[]>(userPairs || []);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  const handleItemSelect = (itemId: string) => {
    if (isReview) return;
    setSelectedItem(itemId);
  };
  
  const handleMatchSelect = (matchId: string) => {
    if (isReview || !selectedItem) return;
    
    // Create a new pair or update existing
    const existingPairIndex = pairs.findIndex(p => p.itemId === selectedItem);
    let newPairs = [...pairs];
    
    if (existingPairIndex >= 0) {
      newPairs[existingPairIndex] = { itemId: selectedItem, matchId };
    } else {
      newPairs.push({ itemId: selectedItem, matchId });
    }
    
    setPairs(newPairs);
    setSelectedItem(null);
    if (onAnswer) onAnswer(newPairs);
  };
  
  const getMatchForItem = (itemId: string) => {
    const pair = pairs.find(p => p.itemId === itemId);
    if (!pair) return null;
    return matches.find(m => m.id === pair.matchId) || null;
  };
  
  const isItemCorrect = (itemId: string) => {
    if (!isReview) return undefined;
    const userPair = pairs.find(p => p.itemId === itemId);
    if (!userPair) return false;
    return correctPairs.some(p => p.itemId === itemId && p.matchId === userPair.matchId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">{questionText}</h3>
        <span className="text-sm text-gray-500">{points} {points === 1 ? 'point' : 'points'}</span>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column - Items */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Items</h4>
          <div className="space-y-2">
            {items.map(item => {
              const match = getMatchForItem(item.id);
              const isCorrect = isItemCorrect(item.id);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item.id)}
                  className={`w-full text-left flex justify-between items-center p-3 rounded-lg border ${
                    selectedItem === item.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  } ${isReview && isCorrect ? 'border-green-300 bg-green-50' : ''} ${
                    isReview && isCorrect === false ? 'border-red-300 bg-red-50' : ''
                  } ${isReview ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}`}
                  disabled={isReview}
                >
                  <span className="text-sm font-medium">{item.text}</span>
                  {match && (
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">{match.text}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right column - Matches */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Matches</h4>
          <div className="space-y-2">
            {matches.map(match => (
              <button
                key={match.id}
                onClick={() => handleMatchSelect(match.id)}
                className={`w-full text-left p-3 rounded-lg border border-gray-200 ${
                  isReview ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'
                } ${selectedItem ? 'bg-gray-50' : ''}`}
                disabled={isReview}
              >
                <span className="text-sm">{match.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {selectedItem && (
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
          <p className="text-sm text-indigo-800">
            <span className="font-medium">Selected Item:</span> {items.find(i => i.id === selectedItem)?.text}
            <br />
            <span className="font-medium">Now select a match from the right column.</span>
          </p>
        </div>
      )}
      
      {isReview && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Correct Pairs:</h4>
          <div className="space-y-1">
            {correctPairs.map((pair, index) => {
              const item = items.find(i => i.id === pair.itemId);
              const match = matches.find(m => m.id === pair.matchId);
              if (!item || !match) return null;
              
              return (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.text}</span>
                  <span className="font-medium">{match.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {isReview && explanation && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Explanation:</span> {explanation}
          </p>
        </div>
      )}
      
      {isReview && typeof isCorrect !== 'undefined' && (
        <div className={`mt-4 p-3 ${isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'} rounded-lg`}>
          <p className={`text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? 'All matches are correct!' : 'Some matches are incorrect. Please review the correct pairs above.'}
          </p>
        </div>
      )}
    </div>
  );
}
