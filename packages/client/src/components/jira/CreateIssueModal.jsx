import React, { useState } from 'react';
import { Card, Button, Input } from '../ui';
import useJiraStore from '../../stores/jiraStore';

const CreateIssueModal = ({ projectKey, onClose, onSuccess }) => {
  const { createIssue } = useJiraStore();
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    issueType: 'Task',
    priority: 'Medium',
    labels: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const issueData = {
        projectKey,
        summary: formData.summary,
        description: formData.description,
        issueType: formData.issueType,
        priority: formData.priority,
        labels: formData.labels
          ? formData.labels.split(',').map(l => l.trim()).filter(l => l)
          : []
      };

      await createIssue(issueData);
      onSuccess();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-cream rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-jungle">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-poster text-vintage-text">
              Create New Issue
            </h2>
            <button
              onClick={onClose}
              className="text-3xl text-vintage-text hover:text-terracotta"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Summary */}
            <div>
              <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
                Summary *
              </label>
              <Input
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Brief description of the issue"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of the issue..."
                rows="5"
                className="w-full px-4 py-3 bg-cream border-3 border-vintage-text rounded font-body text-vintage-text focus:outline-none focus:border-jungle transition-colors"
              />
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
                Issue Type *
              </label>
              <select
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-cream border-3 border-vintage-text rounded font-body text-vintage-text focus:outline-none focus:border-jungle transition-colors"
                required
              >
                <option value="Task">Task</option>
                <option value="Bug">Bug</option>
                <option value="Story">Story</option>
                <option value="Epic">Epic</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-cream border-3 border-vintage-text rounded font-body text-vintage-text focus:outline-none focus:border-jungle transition-colors"
                required
              >
                <option value="Lowest">Lowest</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Highest">Highest</option>
              </select>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
                Labels
              </label>
              <Input
                name="labels"
                value={formData.labels}
                onChange={handleChange}
                placeholder="comma, separated, labels"
              />
              <p className="text-xs text-vintage-text opacity-70 mt-1">
                Separate multiple labels with commas
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-terracotta bg-opacity-10 border-2 border-terracotta-dark rounded">
                <p className="text-sm text-terracotta-dark">
                  ❌ {error}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t-2 border-vintage-text">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Issue'}
              </Button>
            </div>
          </form>

          {/* Help */}
          <div className="mt-6 p-4 bg-sand rounded border-2 border-teal">
            <p className="text-sm text-vintage-text mb-2">
              <strong>📖 Project:</strong> {projectKey}
            </p>
            <p className="text-xs text-vintage-text opacity-80">
              This issue will be created in the selected project. You can edit details later in Jira.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateIssueModal;
