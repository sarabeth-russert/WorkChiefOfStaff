import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

const COLUMNS = {
  'To Do': {
    id: 'todo',
    statuses: ['To Do', 'Open', 'Backlog']
  },
  'In Progress': {
    id: 'inprogress',
    statuses: ['In Progress']
  },
  'Review': {
    id: 'review',
    statuses: ['In Review', 'Review']
  },
  'Done': {
    id: 'done',
    statuses: ['Done', 'Closed', 'Resolved']
  }
};

const JiraBoard = ({ projectKey }) => {
  const [tickets, setTickets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tickets and organize by column
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await fetch(`${API_URL}/api/jira/issues/${projectKey}`);
        const data = await response.json();

        // Group tickets by status
        const groupedTickets = (data.issues || []).reduce((acc, ticket) => {
          const status = ticket.fields.status.name;
          const column = Object.keys(COLUMNS).find(key =>
            COLUMNS[key].statuses.includes(status)
          ) || 'To Do';

          if (!acc[column]) acc[column] = [];
          acc[column].push(ticket);
          return acc;
        }, {});

        // Ensure all columns exist
        Object.keys(COLUMNS).forEach(column => {
          if (!groupedTickets[column]) groupedTickets[column] = [];
        });

        setTickets(groupedTickets);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadTickets();
  }, [projectKey]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Skip if dropped in same column
    if (source.droppableId === destination.droppableId) return;

    // Update local state
    const sourceColumn = tickets[source.droppableId];
    const destColumn = tickets[destination.droppableId];
    const ticket = sourceColumn.find(t => t.key === draggableId);

    const newSourceColumn = sourceColumn.filter(t => t.key !== draggableId);
    const newDestColumn = [...destColumn, ticket];

    setTickets({
      ...tickets,
      [source.droppableId]: newSourceColumn,
      [destination.droppableId]: newDestColumn
    });

    // Update ticket status via API
    try {
      const newStatus = COLUMNS[destination.droppableId].statuses[0];
      await fetch(`${API_URL}/api/jira/issues/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      // Revert on error
      setTickets({
        ...tickets,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn
      });
      setError('Failed to update ticket status');
    }
  };

  if (loading) return <div className="text-vintage-text font-serif">Loading tickets...</div>;
  if (error) return <div className="text-red-500 font-serif">Error: {error}</div>;

  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {Object.keys(COLUMNS).map(columnName => (
        <div key={columnName} className="flex-1 min-w-[250px] bg-sand rounded-lg border-2 border-vintage-text p-3">
          <h3 className="font-poster text-lg text-vintage-text mb-3 uppercase">{columnName}</h3>
          <div className="space-y-2 min-h-[100px]">
            {tickets[columnName]?.map((ticket) => (
              <div
                key={ticket.key}
                className="bg-cream border-2 border-vintage-text rounded p-3 shadow-vintage"
              >
                <div className="font-ui text-xs text-terracotta uppercase">{ticket.key}</div>
                <div className="font-serif text-sm text-vintage-text mt-1">{ticket.fields.summary}</div>
                <div className="flex justify-between items-center mt-2 text-xs font-ui text-vintage-text opacity-70">
                  <span>{ticket.fields.priority?.name}</span>
                  <span>{ticket.fields.assignee?.displayName || 'Unassigned'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default JiraBoard;
