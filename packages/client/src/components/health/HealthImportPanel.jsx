import React, { useState, useRef } from 'react';
import { Card } from '../ui';
import Button from '../ui/Button';

const HealthImportPanel = ({ onImportComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiUrl}/api/health/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
        onImportComplete?.();
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <Card variant="canvas">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">&#x1F34E;</span>
          <h3 className="text-xl font-poster text-vintage-text">Import Apple Health Data</h3>
        </div>
        <span className="text-vintage-text font-poster">{isOpen ? '\u25BC' : '\u25B6'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-vintage-text font-serif">
            Import your Apple Health data in two ways:
          </p>

          {/* Method 1: File Upload */}
          <div className="space-y-2">
            <h4 className="font-poster text-sm text-vintage-text uppercase">Option 1: Upload Export</h4>
            <p className="text-xs text-vintage-text opacity-70 font-serif">
              On your iPhone: Health app &rarr; Profile &rarr; Export All Health Data. Then upload the .zip file here.
            </p>

            <div
              className={`border-3 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-teal bg-teal bg-opacity-10'
                  : 'border-vintage-text border-opacity-30 hover:border-opacity-60'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.xml"
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploading ? (
                <div>
                  <div className="text-3xl mb-2">&#x23F3;</div>
                  <p className="font-ui text-sm text-vintage-text">Importing... This may take a while for large exports.</p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">&#x1F4E4;</div>
                  <p className="font-ui text-sm text-vintage-text">
                    Drop your export.zip here or click to browse
                  </p>
                  <p className="text-xs text-vintage-text opacity-50 mt-1">Supports .zip and .xml files up to 2GB</p>
                </div>
              )}
            </div>
          </div>

          {/* Method 2: Health Auto Export app */}
          <div className="space-y-2">
            <h4 className="font-poster text-sm text-vintage-text uppercase">Option 2: Automatic Sync</h4>
            <p className="text-xs text-vintage-text opacity-70 font-serif">
              Use the <strong>Health Auto Export</strong> iOS app for continuous sync. Set its REST API
              destination to:
            </p>
            <code className="block bg-sand p-3 rounded text-xs font-mono text-vintage-text border border-vintage-text border-opacity-20">
              {window.location.origin}/api/health/ingest
            </code>
            <p className="text-xs text-vintage-text opacity-50 font-serif">
              The app will automatically send new health data as it becomes available.
            </p>
          </div>

          {/* Result */}
          {result && (
            <div className="p-3 bg-jungle bg-opacity-10 border-2 border-jungle rounded-lg">
              <p className="text-sm text-jungle font-poster">Import Complete</p>
              <p className="text-xs text-vintage-text mt-1">
                {result.records?.toLocaleString() || result.recordsIngested?.toLocaleString() || 0} records
                across {result.days || result.daysAffected || 0} days
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-terracotta bg-opacity-10 border-2 border-terracotta rounded-lg">
              <p className="text-sm text-terracotta font-poster">Import Failed</p>
              <p className="text-xs text-vintage-text mt-1">{error}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default HealthImportPanel;
