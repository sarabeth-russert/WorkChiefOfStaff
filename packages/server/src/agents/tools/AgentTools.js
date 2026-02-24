import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../../config/logger.js';

const execAsync = promisify(exec);

/**
 * Agent Tools - Give agents access to file system and code operations
 * These tools allow agents to read, write, and search code files
 */
class AgentTools {
  constructor() {
    // Base directory for agent operations (project root)
    this.baseDir = process.cwd();
    this.allowedPaths = [
      path.join(this.baseDir, 'packages'),
      path.join(this.baseDir, 'scripts'),
      path.join(this.baseDir, 'docs')
    ];
  }

  /**
   * Check if a path is allowed (security check)
   * DISABLED - Allow agents full access to work
   */
  isPathAllowed(filePath) {
    // Allow all paths - agents need full access to do their work
    return true;
  }

  /**
   * Get tool definitions for Claude API
   */
  getToolDefinitions() {
    return [
      {
        name: 'read_file',
        description: 'Read the contents of a file from the codebase. Use this to examine code, configuration files, or documentation.',
        input_schema: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'Relative path to the file from project root (e.g., "packages/client/src/pages/Jira.jsx")'
            }
          },
          required: ['file_path']
        }
      },
      {
        name: 'write_file',
        description: 'Write content to a file. Use this to create new files or completely replace existing ones.',
        input_schema: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'Relative path to the file from project root'
            },
            content: {
              type: 'string',
              description: 'Complete content to write to the file'
            }
          },
          required: ['file_path', 'content']
        }
      },
      {
        name: 'edit_file',
        description: 'Edit a file by replacing specific text. Use this for targeted code changes.',
        input_schema: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'Relative path to the file from project root'
            },
            old_text: {
              type: 'string',
              description: 'Exact text to find and replace (must be unique in the file)'
            },
            new_text: {
              type: 'string',
              description: 'New text to replace with'
            }
          },
          required: ['file_path', 'old_text', 'new_text']
        }
      },
      {
        name: 'list_directory',
        description: 'List contents of a directory. Use this to explore project structure.',
        input_schema: {
          type: 'object',
          properties: {
            dir_path: {
              type: 'string',
              description: 'Relative path to directory from project root (e.g., "packages/client/src/pages")'
            },
            recursive: {
              type: 'boolean',
              description: 'If true, list all subdirectories recursively'
            }
          },
          required: ['dir_path']
        }
      },
      {
        name: 'search_code',
        description: 'Search for text patterns in code files using grep. Use this to find where code is used.',
        input_schema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Text or regex pattern to search for'
            },
            directory: {
              type: 'string',
              description: 'Directory to search in (e.g., "packages/client/src")'
            },
            file_extension: {
              type: 'string',
              description: 'Optional file extension to filter (e.g., ".jsx", ".js")'
            }
          },
          required: ['pattern', 'directory']
        }
      },
      {
        name: 'run_command',
        description: 'Run a bash command in the project directory. Use for npm scripts, git commands, or testing. **Use with caution!**',
        input_schema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Bash command to execute (e.g., "npm test", "git status")'
            }
          },
          required: ['command']
        }
      }
    ];
  }

  /**
   * Execute a tool call
   */
  async executeTool(toolName, toolInput) {
    console.log('🔧 TOOL EXECUTION CALLED:', { toolName, input: toolInput });
    logger.info('Agent tool execution', { toolName, input: toolInput });

    try {
      // Map Claude CLI tool names to our internal tool names
      // Claude CLI uses: Read, Write, Edit, Bash, Glob, Grep
      const toolMap = {
        'Read': 'read_file',
        'Write': 'write_file',
        'Edit': 'edit_file',
        'Bash': 'run_command',
        'Glob': 'list_directory',
        'Grep': 'search_code'
      };

      const mappedName = toolMap[toolName] || toolName;
      console.log('🗺️ TOOL MAPPED:', { original: toolName, mapped: mappedName });
      logger.info('Tool mapped', { original: toolName, mapped: mappedName });

      switch (mappedName) {
        case 'read_file':
          return await this.readFile(toolInput.file_path);

        case 'write_file':
          return await this.writeFile(toolInput.file_path, toolInput.content);

        case 'edit_file':
          return await this.editFile(toolInput.file_path, toolInput.old_string, toolInput.new_string);

        case 'list_directory':
          return await this.listDirectory(toolInput.path || toolInput.dir_path, toolInput.recursive);

        case 'search_code':
          return await this.searchCode(toolInput.pattern, toolInput.path || toolInput.directory, toolInput.glob || toolInput.file_extension);

        case 'run_command':
          return await this.runCommand(toolInput.command);

        default:
          throw new Error(`Unknown tool: ${toolName} (mapped to: ${mappedName})`);
      }
    } catch (error) {
      console.error('❌ TOOL EXECUTION ERROR:', {
        toolName,
        input: toolInput,
        error: error.message,
        stack: error.stack
      });
      logger.error('Agent tool execution failed', {
        toolName,
        input: toolInput,
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Read a file
   */
  async readFile(filePath) {
    const fullPath = path.join(this.baseDir, filePath);

    // Path check disabled - agents have full access
    // if (!this.isPathAllowed(fullPath)) {
    //   throw new Error(`Access denied: ${filePath} is outside allowed directories`);
    // }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    return {
      success: true,
      file_path: filePath,
      content: content,
      line_count: lines.length,
      size: Buffer.byteLength(content, 'utf8')
    };
  }

  /**
   * Write a file
   */
  async writeFile(filePath, content) {
    const fullPath = path.join(this.baseDir, filePath);

    // Path check disabled - agents have full access
    // if (!this.isPathAllowed(fullPath)) {
    //   throw new Error(`Access denied: ${filePath} is outside allowed directories`);
    // }

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, 'utf8');

    return {
      success: true,
      file_path: filePath,
      message: 'File written successfully',
      size: Buffer.byteLength(content, 'utf8')
    };
  }

  /**
   * Edit a file by replacing text
   */
  async editFile(filePath, oldText, newText) {
    const fullPath = path.join(this.baseDir, filePath);

    // Path check disabled - agents have full access
    // if (!this.isPathAllowed(fullPath)) {
    //   throw new Error(`Access denied: ${filePath} is outside allowed directories`);
    // }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Check if old text exists
    if (!content.includes(oldText)) {
      throw new Error(`Text to replace not found in file: ${filePath}`);
    }

    // Check if old text appears multiple times
    const occurrences = (content.match(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (occurrences > 1) {
      throw new Error(`Text appears ${occurrences} times in file. Please provide more unique text to replace.`);
    }

    // Replace text
    content = content.replace(oldText, newText);
    fs.writeFileSync(fullPath, content, 'utf8');

    return {
      success: true,
      file_path: filePath,
      message: 'File edited successfully',
      old_text_length: oldText.length,
      new_text_length: newText.length
    };
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath, recursive = false) {
    const fullPath = path.join(this.baseDir, dirPath);

    // Path check disabled - agents have full access
    // if (!this.isPathAllowed(fullPath)) {
    //   throw new Error(`Access denied: ${dirPath} is outside allowed directories`);
    // }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const listRecursive = (dir, baseDir = '') => {
      const results = [];
      const items = fs.readdirSync(dir);

      for (const item of items) {
        // Skip node_modules, .git, and hidden files
        if (item === 'node_modules' || item === '.git' || item.startsWith('.')) {
          continue;
        }

        const fullItemPath = path.join(dir, item);
        const relativePath = path.join(baseDir, item);
        const stats = fs.statSync(fullItemPath);

        results.push({
          name: item,
          path: relativePath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime
        });

        if (recursive && stats.isDirectory()) {
          results.push(...listRecursive(fullItemPath, relativePath));
        }
      }

      return results;
    };

    const contents = listRecursive(fullPath);

    return {
      success: true,
      directory: dirPath,
      items: contents,
      count: contents.length
    };
  }

  /**
   * Search code using grep
   */
  async searchCode(pattern, directory, fileExtension = '') {
    const fullPath = path.join(this.baseDir, directory);

    // Path check disabled - agents have full access
    // if (!this.isPathAllowed(fullPath)) {
    //   throw new Error(`Access denied: ${directory} is outside allowed directories`);
    // }

    // Build grep command
    let cmd = `grep -r -n "${pattern}" "${fullPath}"`;

    if (fileExtension) {
      cmd += ` --include="*${fileExtension}"`;
    }

    // Exclude common non-code directories
    cmd += ' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build';

    try {
      const { stdout } = await execAsync(cmd);
      const lines = stdout.trim().split('\n').filter(line => line);

      const matches = lines.map(line => {
        const match = line.match(/^(.+?):(\d+):(.+)$/);
        if (match) {
          return {
            file: match[1].replace(this.baseDir + '/', ''),
            line: parseInt(match[2]),
            content: match[3].trim()
          };
        }
        return null;
      }).filter(Boolean);

      return {
        success: true,
        pattern: pattern,
        directory: directory,
        matches: matches,
        count: matches.length
      };
    } catch (error) {
      // grep returns exit code 1 when no matches found
      if (error.code === 1) {
        return {
          success: true,
          pattern: pattern,
          directory: directory,
          matches: [],
          count: 0
        };
      }
      throw error;
    }
  }

  /**
   * Run a bash command
   */
  async runCommand(command) {
    logger.info('Agent running command', { command });

    // Security: Disallow dangerous commands
    const dangerousPatterns = [
      /rm\s+-rf/,
      /rm\s+.*\/\*/,
      />\s*\/dev\/sd/,
      /mkfs/,
      /dd\s+if=/,
      /:()\{.*\|.*&\};:/  // Fork bomb
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        throw new Error(`Dangerous command rejected: ${command}`);
      }
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.baseDir,
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 // 1MB max output
      });

      return {
        success: true,
        command: command,
        stdout: stdout,
        stderr: stderr,
        exit_code: 0
      };
    } catch (error) {
      return {
        success: false,
        command: command,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exit_code: error.code || 1
      };
    }
  }
}

// Singleton instance
const agentTools = new AgentTools();
export default agentTools;
