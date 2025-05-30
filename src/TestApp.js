import React from 'react';
import TopicInput from './components/TopicInput';

function TestApp() {
  const handleContentGenerated = (content, topic) => {
    console.log('Content generated:', content);
    console.log('Topic:', topic);
  };

  return (
    <TopicInput 
      onContentGenerated={handleContentGenerated}
      isLoading={false}
      setIsLoading={() => {}}
    />
  );
}

export default TestApp; 