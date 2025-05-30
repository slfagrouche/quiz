import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <h3>{message}</h3>
        <p>This may take a few moments...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 