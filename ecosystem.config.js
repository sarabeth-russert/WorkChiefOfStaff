module.exports = {
  apps: [
    {
      name: 'adventureland-server',
      script: './src/index.js',
      cwd: './packages/server',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        PORT: 5554
      },
      watch: ['src'],
      ignore_watch: ['node_modules', 'data', 'logs'],
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      error_file: 'logs/server-error.log',
      out_file: 'logs/server-out.log',
      log_file: 'logs/server-combined.log',
      time: true
    },
    {
      name: 'adventureland-client',
      script: 'npm',
      args: 'run dev',
      cwd: './packages/client',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 5555
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      error_file: 'logs/client-error.log',
      out_file: 'logs/client-out.log',
      log_file: 'logs/client-combined.log',
      time: true
    }
  ]
};
