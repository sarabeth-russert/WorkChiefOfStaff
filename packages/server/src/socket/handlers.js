import logger from '../config/logger.js';
import agentFactory from '../agents/AgentFactory.js';
import orchestrator from '../agents/AgentOrchestrator.js';
import TerminalSession from '../terminal/TerminalSession.js';

// Terminal sessions map (shared across connections)
const terminalSessions = new Map();

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.info('Client connected', { socketId: socket.id });

    // Agent task submission with streaming via orchestrator
    socket.on('agent:task', async (data) => {
      try {
        const { agentType, taskType, task } = data;

        logger.info('Agent task received via socket', {
          socketId: socket.id,
          agentType,
          taskType
        });

        const taskId = Date.now();
        socket.emit('agent:task:started', {
          taskId,
          agentType
        });

        // Use orchestrator to execute task with streaming
        await orchestrator.executeTask({
          taskType: taskType || 'custom',
          task,
          agentType,
          stream: true,
          onChunk: (event) => {
            if (event.type === 'chunk') {
              socket.emit('agent:task:chunk', {
                taskId,
                agentType: event.agent.type,
                chunk: event.data
              });
            } else if (event.type === 'complete') {
              socket.emit('agent:task:response', {
                taskId,
                agentType: event.agent.type,
                response: event.data
              });

              socket.emit('agent:task:completed', {
                taskId,
                success: true
              });
            } else if (event.type === 'error') {
              socket.emit('agent:task:error', {
                taskId,
                error: event.error
              });
            }
          }
        });

      } catch (error) {
        logger.error('Error processing agent task', error);
        socket.emit('agent:task:error', {
          error: error.message
        });
      }
    });

    // Terminal session management
    socket.on('terminal:create', (data) => {
      const sessionId = data.sessionId || `session-${Date.now()}`;
      const session = new TerminalSession(sessionId, socket);
      terminalSessions.set(sessionId, session);

      logger.info('Terminal session created', {
        socketId: socket.id,
        sessionId
      });

      socket.emit('terminal:created', {
        sessionId,
        cwd: session.getCwd()
      });
    });

    socket.on('terminal:command', async (data) => {
      const { sessionId, command } = data;

      logger.info('Terminal command received', {
        socketId: socket.id,
        sessionId,
        command: command.substring(0, 100)
      });

      const session = terminalSessions.get(sessionId);
      if (!session) {
        socket.emit('terminal:error', {
          sessionId,
          error: 'Session not found'
        });
        return;
      }

      await session.executeCommand(command);
    });

    socket.on('terminal:kill', (data) => {
      const { sessionId } = data;
      const session = terminalSessions.get(sessionId);

      if (session) {
        session.kill();
        logger.info('Terminal process killed', {
          socketId: socket.id,
          sessionId
        });
      }
    });

    socket.on('terminal:destroy', (data) => {
      const { sessionId } = data;
      const session = terminalSessions.get(sessionId);

      if (session) {
        session.kill();
        terminalSessions.delete(sessionId);
        logger.info('Terminal session destroyed', {
          socketId: socket.id,
          sessionId
        });
      }
    });

    // App management events
    socket.on('app:start', (data) => {
      logger.info('App start requested', {
        socketId: socket.id,
        appId: data.appId
      });
      // TODO: Start app
    });

    socket.on('app:stop', (data) => {
      logger.info('App stop requested', {
        socketId: socket.id,
        appId: data.appId
      });
      // TODO: Stop app
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });
  });
}
