import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import jiraManager from '../integrations/JiraManager';
import './JiraBoard.css';

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
        const response = await jiraManager.getIssues(projectKey);
        
        // Group tickets by status
        const groupedTickets = response.issues.reduce((acc, ticket) => {
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

    // Update ticket status in Jira
    try {
      const newStatus = COLUMNS[destination.droppableId].statuses[0];
      await jiraManager.updateIssue(draggableId, { status: newStatus });
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

  if (loading) return <div>Loading tickets...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="jira-board">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board-columns">
          {Object.keys(COLUMNS).map(columnName => (
            <div key={columnName} className="board-column">
              <h3>{columnName}</h3>
              <Droppable droppableId={columnName}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="column-content"
                  >
                    {tickets[columnName]?.map((ticket, index) => (
                      <Draggable
                        key={ticket.key}
                        draggableId={ticket.key}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="ticket-card"
                          >
                            <div className="ticket-key">{ticket.key}</div>
                            <div className="ticket-summary">{ticket.fields.summary}</div>
                            <div className="ticket-meta">
                              <span className="priority">{ticket.fields.priority?.name}</span>
                              <span className="assignee">
                                {ticket.fields.assignee?.displayName || 'Unassigned'}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default JiraBoard;