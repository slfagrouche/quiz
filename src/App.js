import React, { useState } from 'react';
import config from './config';
import TopicInput from './components/TopicInput';
import FlashcardContainer from './components/FlashcardContainer';
import QuizContainer from './components/QuizContainer';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('input'); // 'input', 'flashcards', 'quiz'
  const [generatedContent, setGeneratedContent] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleContentGenerated = async (content, topic) => {
    setGeneratedContent(content);
    setCurrentTopic(topic);
    setIsLoading(true);
    setLoadingMessage('Generating flashcards from your content...');
    
    try {
      const flashcardResponse = await fetch(`${config.API_URL}/api/generate-flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      const flashcardData = await flashcardResponse.json();
      
      if (flashcardData.success) {
        setFlashcards(flashcardData.flashcards);
        setCurrentView('flashcards');
      } else {
        alert('Error generating flashcards: ' + flashcardData.error);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Failed to generate flashcards. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    setLoadingMessage('Creating quiz questions...');
    
    try {
      const response = await fetch(`${config.API_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: generatedContent }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQuiz(data.quiz);
        setCurrentView('quiz');
      } else {
        alert('Error generating quiz: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleBackToInput = () => {
    setCurrentView('input');
    setGeneratedContent('');
    setCurrentTopic('');
    setFlashcards([]);
    setQuiz([]);
  };

  const handleBackToFlashcards = () => {
    setCurrentView('flashcards');
  };

  if (isLoading) {
    return <LoadingSpinner message={loadingMessage || "Processing your request..."} />;
  }

  return (
    <div className="App">
      {currentView === 'input' && (
        <TopicInput 
          onContentGenerated={handleContentGenerated}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setLoadingMessage={setLoadingMessage}
        />
      )}
      
      {currentView === 'flashcards' && flashcards.length > 0 && (
        <FlashcardContainer 
          flashcards={flashcards}
          topic={currentTopic}
          content={generatedContent}
          onGenerateQuiz={handleGenerateQuiz}
          onBackToInput={handleBackToInput}
        />
      )}
      
      {currentView === 'quiz' && quiz.length > 0 && (
        <QuizContainer 
          quiz={quiz}
          topic={currentTopic}
          flashcards={flashcards}
          content={generatedContent}
          onBackToFlashcards={handleBackToFlashcards}
          onBackToInput={handleBackToInput}
          onGenerateNewQuiz={handleGenerateQuiz}
        />
      )}
    </div>
  );
}

export default App; 