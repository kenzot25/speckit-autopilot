#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { speckitSpecify } from './tools/specify.js';
import { speckitClarify } from './tools/clarify.js';
import { speckitPlan } from './tools/plan.js';
import { speckitTasks } from './tools/tasks.js';
import { speckitImplement, markTaskAsComplete } from './tools/implement.js';
import { speckitReview } from './tools/review.js';
import { speckitAutopilot } from './tools/autopilot.js';

// Log to stderr (never stdout for STDIO-based MCP servers)
const log = {
  info: (msg: string) => console.error(`[INFO] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  warn: (msg: string) => console.error(`[WARN] ${msg}`),
};

class SpeckitServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'speckit-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'speckit_specify',
            description: 'Create feature specification from description',
            inputSchema: {
              type: 'object',
              properties: {
                featureDescription: {
                  type: 'string',
                  description: 'Feature description',
                },
              },
              required: ['featureDescription'],
            },
          },
          {
            name: 'speckit_clarify',
            description: 'Review specification and generate clarification questions',
            inputSchema: {
              type: 'object',
              properties: {
                featureDir: {
                  type: 'string',
                  description: 'Path to feature directory',
                },
                maxQuestions: {
                  type: 'number',
                  description: 'Maximum questions to generate',
                  default: 5,
                },
              },
              required: ['featureDir'],
            },
          },
          {
            name: 'speckit_plan',
            description: 'Create technical implementation plan',
            inputSchema: {
              type: 'object',
              properties: {
                featureDir: {
                  type: 'string',
                  description: 'Path to feature directory',
                },
              },
              required: ['featureDir'],
            },
          },
          {
            name: 'speckit_tasks',
            description: 'Generate actionable task list',
            inputSchema: {
              type: 'object',
              properties: {
                featureDir: {
                  type: 'string',
                  description: 'Path to feature directory',
                },
              },
              required: ['featureDir'],
            },
          },
          {
            name: 'speckit_implement',
            description: 'Execute implementation tasks (automatic, no interruptions)',
            inputSchema: {
              type: 'object',
              properties: {
                featureDir: {
                  type: 'string',
                  description: 'Path to feature directory',
                },
                autoContinue: {
                  type: 'boolean',
                  description: 'Automatically continue between phases',
                  default: true,
                },
              },
              required: ['featureDir'],
            },
          },
          {
            name: 'speckit_review',
            description: 'Review code quality and fix issues',
            inputSchema: {
              type: 'object',
              properties: {
                featureDir: {
                  type: 'string',
                  description: 'Path to feature directory',
                },
                maxIterations: {
                  type: 'number',
                  description: 'Maximum review iterations',
                  default: 10,
                },
              },
              required: ['featureDir'],
            },
          },
          {
            name: 'speckit_autopilot',
            description: 'Execute complete speckit workflow: specify → clarify → plan → tasks → implement → review',
            inputSchema: {
              type: 'object',
              properties: {
                featureDescription: {
                  type: 'string',
                  description: 'Feature description',
                },
                skipClarify: {
                  type: 'boolean',
                  description: 'Skip clarification step',
                  default: false,
                },
                skipReview: {
                  type: 'boolean',
                  description: 'Skip review step',
                  default: false,
                },
              },
              required: ['featureDescription'],
            },
          },
          {
            name: 'speckit_mark_task_complete',
            description: 'Mark a task as complete in tasks.md',
            inputSchema: {
              type: 'object',
              properties: {
                featureDir: {
                  type: 'string',
                  description: 'Path to feature directory',
                },
                taskId: {
                  type: 'string',
                  description: 'Task ID (e.g., T001)',
                },
              },
              required: ['featureDir', 'taskId'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new Error('Tool arguments are required');
      }

      try {
        switch (name) {
          case 'speckit_specify':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await speckitSpecify(args.featureDescription as string),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'speckit_clarify':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await speckitClarify(
                      args.featureDir as string,
                      (args.maxQuestions as number) || 5
                    ),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'speckit_plan':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await speckitPlan(args.featureDir as string),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'speckit_tasks':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await speckitTasks(args.featureDir as string),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'speckit_implement':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await speckitImplement(
                      args.featureDir as string,
                      (args.autoContinue as boolean) ?? true
                    ),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'speckit_review':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await speckitReview(
                      args.featureDir as string,
                      (args.maxIterations as number) || 10
                    ),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'speckit_autopilot':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await speckitAutopilot(args.featureDescription as string, {
                      skipClarify: (args.skipClarify as boolean) || false,
                      skipReview: (args.skipReview as boolean) || false,
                    }),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'speckit_mark_task_complete':
            await markTaskAsComplete(
              args.featureDir as string,
              args.taskId as string
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ success: true, message: `Task ${args.taskId} marked as complete` }),
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        log.error(`Error executing tool ${name}: ${error.message}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    log.info('Speckit Autopilot running on stdio');
  }
}

// Start server
const server = new SpeckitServer();
server.run().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
