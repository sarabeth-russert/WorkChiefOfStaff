import React, { useEffect, useState } from 'react';
import { Card, Button, Input } from '../components/ui';
import useJiraStore from '../stores/jiraStore';
import CreateIssueModal from '../components/jira/CreateIssueModal';
import IssueCard from '../components/jira/IssueCard';

const Jira = () => {
  const {
    projects,
    issues,
    selectedProject,
    loading,
    error,
    fetchProjects,
    fetchIssues,
    setSelectedProject,
    clearError
  } = useJiraStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hardcode to CONTECH project only
  const CONTECH_PROJECT = 'CONTECH';

  useEffect(() => {
    // Always fetch only MY CONTECH issues (assignee OR reporter)
    fetchIssues(CONTECH_PROJECT, { myIssuesOnly: true });
  }, []);

  // Filter issues by search query only (server handles assignee/reporter filtering)
  const filteredIssues = issues.filter(issue => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      issue.key.toLowerCase().includes(query) ||
      issue.fields.summary.toLowerCase().includes(query)
    );
  });

  // Group issues by status for Kanban view
  const kanbanColumns = filteredIssues.reduce((acc, issue) => {
    const status = issue.fields.status?.name || 'No Status';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(issue);
    return acc;
  }, {});

  // Define column order (customize as needed)
  const columnOrder = ['To Do', 'In Progress', 'In Review', 'Done'];
  const orderedColumns = columnOrder.filter(status => kanbanColumns[status]);
  // Add any other statuses not in predefined order
  Object.keys(kanbanColumns).forEach(status => {
    if (!columnOrder.includes(status)) {
      orderedColumns.push(status);
    }
  });

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage mb-8">
        <img
          src="/images/pages/jira-header.png"
          alt="CONTECH Tickets"
          className="w-full h-48 md:h-64 object-cover"
          onError={(e) => e.target.style.display = 'none'}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
          <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress drop-shadow-lg mb-2">
            Jira Tickets
          </h1>
          <p className="text-lg text-vintage-text drop-shadow-md">
            Your active Content Technology tickets
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-terracotta-dark">
          <div className="flex items-center justify-between">
            <p className="text-terracotta-dark">
              <strong>Error:</strong> {error}
            </p>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Search and Create */}
      <div className="flex gap-4 items-center">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your CONTECH issues by key or summary..."
          className="flex-1"
        />
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="whitespace-nowrap"
        >
          + Create Issue
        </Button>
      </div>

      {/* Issues List */}
      {loading && issues.length === 0 ? (
        <Card>
          <p className="text-center text-vintage-text py-8">
            Loading your CONTECH issues...
          </p>
        </Card>
      ) : filteredIssues.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-vintage-text mb-4">
              {searchQuery ? 'No issues match your search.' : 'You have no active CONTECH issues.'}
            </p>
            <p className="text-sm text-vintage-text opacity-70 mb-4">
              (Showing tickets assigned to you or created by you, excluding Done)
            </p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create First Issue
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-poster text-vintage-text">
              Your Issues ({filteredIssues.length})
            </h2>
          </div>

          {/* Kanban Board */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {orderedColumns.map((status) => (
              <div
                key={status}
                className="flex-shrink-0 w-80 bg-sand rounded-lg p-4 border-2 border-vintage-text"
              >
                {/* Column Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-poster text-vintage-text mb-1">
                    {status}
                  </h3>
                  <p className="text-sm text-vintage-text opacity-70">
                    {kanbanColumns[status].length} issue{kanbanColumns[status].length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Column Cards */}
                <div className="space-y-3">
                  {kanbanColumns[status].map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Issue Modal */}
      {showCreateModal && (
        <CreateIssueModal
          projectKey={CONTECH_PROJECT}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchIssues(CONTECH_PROJECT, { myIssuesOnly: true });
          }}
        />
      )}
    </div>
  );
};

export default Jira;
