import React, { useState } from 'react';
import { Card, Button, Input, TextArea } from '../ui';

const AddKnowledgeForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    type: 'note',
    tags: '',
    autoClassify: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSubmit({
      ...formData,
      tags
    });

    // Reset form
    setFormData({
      title: '',
      content: '',
      category: 'general',
      type: 'note',
      tags: '',
      autoClassify: true
    });
  };

  return (
    <Card>
      <h3 className="text-2xl font-poster text-vintage-text mb-4">
        Add Knowledge Item
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="Enter a descriptive title"
        />

        <TextArea
          label="Content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          placeholder="Enter your knowledge content..."
          rows={6}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-ui text-lg uppercase tracking-wide text-vintage-text mb-2">
              Category
            </label>
            <select
              className="w-full px-4 py-3 font-serif text-vintage-text bg-cream-light border-3 border-vintage-text rounded-md shadow-vintage focus:outline-none focus:shadow-vintage-hover"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="general">General</option>
              <option value="code">Code</option>
              <option value="documentation">Documentation</option>
              <option value="tutorial">Tutorial</option>
              <option value="reference">Reference</option>
              <option value="note">Note</option>
              <option value="idea">Idea</option>
              <option value="link">Link</option>
            </select>
          </div>

          <div>
            <label className="block font-ui text-lg uppercase tracking-wide text-vintage-text mb-2">
              Type
            </label>
            <select
              className="w-full px-4 py-3 font-serif text-vintage-text bg-cream-light border-3 border-vintage-text rounded-md shadow-vintage focus:outline-none focus:shadow-vintage-hover"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="note">Note</option>
              <option value="code">Code</option>
              <option value="link">Link</option>
              <option value="doc">Document</option>
            </select>
          </div>
        </div>

        <Input
          label="Tags (comma-separated)"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="react, javascript, hooks"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoClassify"
            checked={formData.autoClassify}
            onChange={(e) => setFormData({ ...formData, autoClassify: e.target.checked })}
            className="w-5 h-5"
          />
          <label htmlFor="autoClassify" className="text-sm text-vintage-text">
            Auto-classify with AI (suggest tags and category)
          </label>
        </div>

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary">
            Add Item
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddKnowledgeForm;
