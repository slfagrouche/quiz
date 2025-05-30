import React, { useState } from 'react';
import './QuizContainer.css';

const QuizContainer = ({ quiz, topic, onBackToFlashcards, onBackToInput, onGenerateNewQuiz }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) {
      alert('Please select an answer');
      return;
    }
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestion] = {
      selected: selectedAnswer,
      correct: selectedAnswer === quiz[currentQuestion].correct_answer
    };
    setUserAnswers(newUserAnswers);

    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const calculateScore = () => {
    const correct = userAnswers.filter(answer => answer.correct).length;
    return Math.round((correct / quiz.length) * 100);
  };

  const retryQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setUserAnswers([]);
    setQuizCompleted(false);
  };

  if (quizCompleted) {
    const score = calculateScore();
    const correctAnswers = userAnswers.filter(answer => answer.correct).length;

    return (
      <div className="quiz-container">
        <div className="quiz-results">
          <h1>🎉 Quiz Complete!</h1>
          <div className="score-display">
            <h2>Your Score: {score}%</h2>
            <p>{correctAnswers} out of {quiz.length} correct</p>
          </div>
          
          <div className="performance-message">
            {score >= 80 ? (
              <p>🌟 Excellent work! You've mastered this topic!</p>
            ) : score >= 60 ? (
              <p>👍 Good job! You're getting there!</p>
            ) : (
              <p>💪 Keep studying! You'll get it next time!</p>
            )}
          </div>

          <div className="quiz-actions">
            <button onClick={retryQuiz} className="retry-btn">
              Retry Quiz 🔄
            </button>
            <button onClick={onGenerateNewQuiz} className="new-quiz-btn">
              Generate New Quiz 🎯
            </button>
            <button onClick={onBackToFlashcards} className="flashcards-btn">
              Back to Flashcards 📚
            </button>
            <button onClick={onBackToInput} className="start-over-btn">
              Start Over 🏠
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = quiz[currentQuestion];

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1>🎯 Quiz: {topic}</h1>
        <p>Question {currentQuestion + 1} of {quiz.length}</p>
      </div>

      <div className="quiz-card">
        <h3>{currentQ.question}</h3>
        
        <div className="answer-options">
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              className={`answer-option ${
                selectedAnswer === index ? 'selected' : ''
              } ${
                showAnswer && index === currentQ.correct_answer ? 'correct' : ''
              } ${
                showAnswer && selectedAnswer === index && index !== currentQ.correct_answer ? 'incorrect' : ''
              }`}
              onClick={() => !showAnswer && handleAnswerSelect(index)}
              disabled={showAnswer}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              {option}
            </button>
          ))}
        </div>

        {showAnswer && (
          <div className="explanation">
            <h4>Explanation:</h4>
            <p>{currentQ.explanation}</p>
          </div>
        )}

        <div className="quiz-controls">
          {!showAnswer ? (
            <button 
              onClick={handleCheckAnswer} 
              className="check-btn"
              disabled={selectedAnswer === null}
            >
              Check Answer ✓
            </button>
          ) : (
            <button onClick={handleNextQuestion} className="next-btn">
              {currentQuestion === quiz.length - 1 ? 'Finish Quiz' : 'Next Question'} →
            </button>
          )}
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default QuizContainer; 