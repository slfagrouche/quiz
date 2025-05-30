import React, { useState } from 'react';
import config from '../config';
import './FlashcardContainer.css';

const FlashcardContainer = ({ flashcards, topic, content, onGenerateQuiz, onBackToInput }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const generatePDF = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          content: content,
          flashcards: flashcards
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_study_materials.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const isLastCard = currentIndex === flashcards.length - 1;

  return (
    <div className="flashcard-container">
      <div className="flashcard-header">
        <h1>📚 Flashcards: {topic}</h1>
        <p>{currentIndex + 1} of {flashcards.length}</p>
      </div>

      <div className="flashcard-wrapper">
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={flipCard}>
          <div className="flashcard-front">
            <h3>Question</h3>
            <p>{flashcards[currentIndex]?.question}</p>
            <small>Click to reveal answer</small>
          </div>
          <div className="flashcard-back">
            <h3>Answer</h3>
            <p>{flashcards[currentIndex]?.answer}</p>
            <small>Click to go back to question</small>
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        <button 
          onClick={prevCard} 
          disabled={currentIndex === 0}
          className="nav-btn"
        >
          ← Previous
        </button>
        
        <div className="card-indicators">
          {flashcards.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentIndex(index);
                setIsFlipped(false);
              }}
            />
          ))}
        </div>
        
        <button 
          onClick={nextCard} 
          disabled={isLastCard}
          className="nav-btn"
        >
          Next →
        </button>
      </div>

      <div className="action-buttons">
        <button onClick={generatePDF} className="pdf-btn">
          Download PDF 📄
        </button>
        {isLastCard && (
          <button onClick={onGenerateQuiz} className="quiz-btn">
            Generate Quiz 🎯
          </button>
        )}
        <button onClick={onBackToInput} className="back-btn">
          Start Over 🔄
        </button>
      </div>
    </div>
  );
};

export default FlashcardContainer; 