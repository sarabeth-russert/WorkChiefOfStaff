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
        <p className="text-sm text-vintage-text opacity-70">
          {selectedAgent ? (
            <>
              <span className="text-lg mr-2">{selectedAgent.icon}</span>
              {selectedAgent.name} is ready to help
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
