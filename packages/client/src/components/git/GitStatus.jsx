import React, { useEffect, useState } from 'react';
import { Card } from '../ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5554';

const GitStatus = () => {
  const [status, setStatus] = useState(null);
  const [branches, setBranches] = useState(null);
  const [isRepo, setIsRepo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGitInfo();

    // Refresh every 10 seconds
    const interval = setInterval(fetchGitInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchGitInfo = async () => {
    try {
      // Check if git repo
      const repoRes = await fetch(`${API_URL}/api/git/is-repo`);
      const repoData = await repoRes.json();

      if (!repoData.isRepo) {
        setIsRepo(false);
        setLoading(false);
        return;
      }

      setIsRepo(true);

      // Get status
      const statusRes = await fetch(`${API_URL}/api/git/status`);
      const statusData = await statusRes.json();
      setStatus(statusData);

      // Get branches
      const branchesRes = await fetch(`${API_URL}/api/git/branches`);
      const branchesData = await branchesRes.json();
      setBranches(branchesData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching git info:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card variant="canvas">
        <p className="text-center text-vintage-text py-4">Loading Git info...</p>
      </Card>
    );
  }

  if (!isRepo) {
    return (
      <Card variant="canvas">
        <p className="text-center text-vintage-text py-4">Not a Git repository</p>
      </Card>
    );
  }

  return (
    <Card variant="canvas" className="border-teal">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🧭</span>
        <h3 className="text-2xl font-poster text-vintage-text">Git Status</h3>
      </div>

      {/* Current Branch */}
      {status && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-cream rounded">
            <span className="font-ui text-sm uppercase text-vintage-text opacity-70">
              Current Branch
            </span>
            <span className="font-mono text-lg text-vintage-text font-bold">
              {status.current}
            </span>
          </div>

          {/* Tracking Info */}
          {status.tracking && (
            <div className="text-sm text-vintage-text">
              <p>Tracking: <span className="font-mono">{status.tracking}</span></p>
              {status.ahead > 0 && (
                <p className="text-jungle">↑ {status.ahead} commit(s) ahead</p>
              )}
              {status.behind > 0 && (
                <p className="text-terracotta">↓ {status.behind} commit(s) behind</p>
              )}
            </div>
          )}

          {/* Changes */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {status.modified.length > 0 && (
              <div className="p-2 bg-mustard-light rounded">
                <span className="font-ui uppercase text-xs">Modified</span>
                <span className="ml-2 font-bold">{status.modified.length}</span>
              </div>
            )}
            {status.created.length > 0 && (
              <div className="p-2 bg-jungle-light rounded">
                <span className="font-ui uppercase text-xs">Created</span>
                <span className="ml-2 font-bold">{status.created.length}</span>
              </div>
            )}
            {status.deleted.length > 0 && (
              <div className="p-2 bg-terracotta-light rounded">
                <span className="font-ui uppercase text-xs">Deleted</span>
                <span className="ml-2 font-bold">{status.deleted.length}</span>
              </div>
            )}
            {status.conflicts.length > 0 && (
              <div className="p-2 bg-burgundy-light rounded">
                <span className="font-ui uppercase text-xs">Conflicts</span>
                <span className="ml-2 font-bold">{status.conflicts.length}</span>
              </div>
            )}
          </div>

          {/* Clean Status */}
          {status.isClean && (
            <div className="text-center p-3 bg-jungle text-cream rounded">
              <span className="font-ui uppercase text-sm">✓ Working tree clean</span>
            </div>
          )}
        </div>
      )}

      {/* Branches */}
      {branches && branches.all.length > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-sand">
          <h4 className="font-ui uppercase text-sm text-vintage-text opacity-70 mb-2">
            All Branches ({branches.all.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {branches.all.slice(0, 5).map((branch, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs font-mono rounded ${
                  branch === branches.current
                    ? 'bg-teal text-cream'
                    : 'bg-sand text-vintage-text'
                }`}
              >
                {branch}
              </span>
            ))}
            {branches.all.length > 5 && (
              <span className="px-2 py-1 text-xs text-vintage-text opacity-70">
                +{branches.all.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default GitStatus;
