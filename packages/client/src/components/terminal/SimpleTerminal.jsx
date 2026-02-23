import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Card, Input, Button } from '../ui';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5554';

const SimpleTerminal = () => {
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [output, setOutput] = useState([]);
  const [command, setCommand] = useState('');
  const [cwd, setCwd] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const outputRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // Create terminal session
      const sid = `session-${Date.now()}`;
      newSocket.emit('terminal:create', { sessionId: sid });
    });

    newSocket.on('terminal:created', (data) => {
      setSessionId(data.sessionId);
      setCwd(data.cwd);
      setOutput([{ type: 'system', data: `Terminal session started in ${data.cwd}` }]);
    });

    newSocket.on('terminal:output', (data) => {
      setOutput(prev => [...prev, { type: data.isError ? 'error' : 'output', data: data.data }]);
    });

    newSocket.on('terminal:exit', (data) => {
      setIsExecuting(false);
      if (data.code !== 0) {
        setOutput(prev => [...prev, { type: 'error', data: `Command exited with code ${data.code}` }]);
      }
    });

    newSocket.on('terminal:cwd', (data) => {
      setCwd(data.cwd);
    });

    newSocket.on('terminal:error', (data) => {
      setOutput(prev => [...prev, { type: 'error', data: data.error }]);
      setIsExecuting(false);
    });

    return () => {
      if (sessionId) {
        newSocket.emit('terminal:destroy', { sessionId });
      }
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!command.trim() || !socket || !sessionId) return;

    // Add command to output
    setOutput(prev => [...prev, { type: 'command', data: `$ ${command}` }]);

    // Execute command
    setIsExecuting(true);
    socket.emit('terminal:command', { sessionId, command });

    // Clear input
    setCommand('');
  };

  const handleClear = () => {
    setOutput([{ type: 'system', data: `Terminal session in ${cwd}` }]);
  };

  return (
    <Card variant="canvas" className="border-vintage-text">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-poster text-vintage-text">
          ⛺ Terminal
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-vintage-text opacity-70">
            {cwd}
          </span>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={outputRef}
        className="bg-vintage-text text-cream font-mono text-sm p-4 rounded min-h-[400px] max-h-[600px] overflow-y-auto mb-4"
      >
        {output.map((line, index) => (
          <div
            key={index}
            className={`mb-1 ${
              line.type === 'command' ? 'text-jungle-light font-bold' :
              line.type === 'error' ? 'text-terracotta-light' :
              line.type === 'system' ? 'text-teal-light' :
              'text-cream'
            }`}
          >
            {line.data}
          </div>
        ))}
        {isExecuting && (
          <div className="text-teal-light animate-pulse">Executing...</div>
        )}
      </div>

      {/* Command Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <span className="text-vintage-text font-mono self-center">$</span>
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command..."
          disabled={isExecuting || !sessionId}
          className="flex-1 font-mono"
        />
        <Button type="submit" disabled={isExecuting || !sessionId}>
          Execute
        </Button>
      </form>
    </Card>
  );
};

export default SimpleTerminal;
