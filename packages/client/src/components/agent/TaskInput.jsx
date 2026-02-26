import React, { useState } from 'react';
import { Button, TextArea } from '../ui';

const TaskInput = ({ onSubmit, isProcessing, selectedAgent }) => {
  const [task, setTask] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (task.trim() && selectedAgent) {
      onSubmit(task);
      setTask('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextArea
        label="What would you like the agent to do?"
        placeholder="Enter your task here... (e.g., 'Review this code', 'Analyze this architecture', 'Suggest refactoring for...')"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        rows={6}
        disabled={isProcessing || !selectedAgent}
      />
      <div className="flex items-center justify-between">
        <p className="text-sm text-vintage-text opacity-70 flex items-center gap-2">
          {selectedAgent ? (
            <>
              {selectedAgent.imagePath ? (
                <img
                  src={selectedAgent.imagePath}
                  alt={selectedAgent.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-vintage-text shadow-sm"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'inline';
                  }}
                />
              ) : null}
              <span className="text-lg" style={{ display: selectedAgent?.imagePath ? 'none' : 'inline' }}>
                {selectedAgent.icon}
              </span>
              <span>{selectedAgent.name} is ready to help</span>
            </>
          ) : (
            'Please select an agent first'
          )}
        </p>
        <Button
          type="submit"
          disabled={!task.trim() || isProcessing || !selectedAgent}
        >
          {isProcessing ? 'Processing...' : 'Submit Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskInput;
