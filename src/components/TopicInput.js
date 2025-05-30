import React, { useState } from 'react';
import config from '../config';
import './TopicInput.css';

const TopicInput = ({ onContentGenerated, isLoading, setIsLoading, setLoadingMessage }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [learningType, setLearningType] = useState('general');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      alert('Please enter a topic to learn about');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Generating educational content...');
    
    try {
      const response = await fetch(`${config.API_URL}/api/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          learning_type: learningType
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onContentGenerated(data.content, data.topic);
      } else {
        alert('Error generating content: ' + data.error);
        setIsLoading(false);
        setLoadingMessage('');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to connect to server. Please try again.');
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="topic-input-container">
      <div className="topic-input-card">
        <h2>🎓 AI Learning Assistant</h2>
        <p>Enter any topic you want to learn about, and I'll create personalized study materials for you!</p>
        
        <form onSubmit={handleSubmit} className="topic-form">
          <div className="input-group">
            <label htmlFor="topic">What would you like to learn about?</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, World War II, JavaScript, Rosa Parks, Compound Interest, etc."
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="difficulty">Difficulty Level</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isLoading}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="learningType">Learning Style</label>
            <select
              id="learningType"
              value={learningType}
              onChange={(e) => setLearningType(e.target.value)}
              disabled={isLoading}
            >
              <option value="kids">Kids (Elementary)</option>
              <option value="students">Students (High School/College)</option>
              <option value="professionals">Professionals</option>
              <option value="general">General Audience</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="generate-btn"
            disabled={isLoading || !topic.trim()}
          >
            {isLoading ? 'Generating Content...' : 'Generate Study Materials'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TopicInput; 