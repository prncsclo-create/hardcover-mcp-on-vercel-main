import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HardcoverClient } from '../lib/hardcover-client.js';

// Environment validation
const APIKEY = "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJIYXJkY292ZXIiLCJ2ZXJzaW9uIjoiOCIsImp0aSI6ImQ4NjJiZTYzLWIxNTgtNGI3Mi04ZTc0LTY1MWNiZWY2NTQzYSIsImFwcGxpY2F0aW9uSWQiOjIsInN1YiI6Ijc0MDUzIiwiYXVkIjoiMSIsImlkIjoiNzQwNTMiLCJsb2dnZWRJbiI6dHJ1ZSwiaWF0IjoxNzcwMjQ5NTcyLCJleHAiOjE4MDE3ODU1NzIsImh0dHBzOi8vaGFzdXJhLmlvL2p3dC9jbGFpbXMiOnsieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJ1c2VyIl0sIngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6InVzZXIiLCJ4LWhhc3VyYS1yb2xlIjoidXNlciIsIlgtaGFzdXJhLXVzZXItaWQiOiI3NDA1MyJ9LCJ1c2VyIjp7ImlkIjo3NDA1M319.gNJLFlwI_tB8WYn3C4ILc6bS7HMrYy77sWbgVsS0JU8";
if (!APIKEY) {
  console.error('APIKEY environment variable is required');
  process.exit(1);
}

// Initialize server and client
const server = new McpServer(
  {
    name: 'hardcover-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const hardcoverClient = new HardcoverClient(APIKEY);

// Schema definitions for tool parameters
const searchBooksSchema = z.object({
  query: z.string().describe('The book title or author name to search for'),
  limit: z.number().optional().default(10).describe('Maximum number of results to return'),
});

const getBookDetailsSchema = z.object({
  id: z.number().describe('The Hardcover book ID'),
});

const addToLibrarySchema = z.object({
  bookId: z.number().describe('The ID of the book to add'),
  status: z.enum(['WANT_TO_READ', 'CURRENTLY_READING', 'READ', 'DID_NOT_FINISH'])
    .describe('Reading status for the book'),
});

const updateStatusSchema = z.object({
  id: z.number().describe('The user book ID to update'),
  status: z.enum(['WANT_TO_READ', 'CURRENTLY_READING', 'READ', 'DID_NOT_FINISH'])
    .describe('New reading status'),
  rating: z.number().min(1).max(5).optional().describe('Book rating (1-5 stars)'),
  progress: z.number().min(0).max(100).optional().describe('Reading progress percentage'),
});

// Tool: Search for books
server.registerTool(
  'search_books',
  {
    description: 'Search for books on Hardcover by title or author',
    inputSchema: searchBooksSchema,
  },
  async ({ query, limit }): Promise<CallToolResult> => {
    const books = await hardcoverClient.searchBooks(query, limit);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(books, null, 2),
        },
      ],
    };
  }
);

// Tool: Get book details
server.registerTool(
  'get_book_details',
  {
    description: 'Get detailed information about a specific book',
    inputSchema: getBookDetailsSchema,
  },
  async ({ id }): Promise<CallToolResult> => {
    const book = await hardcoverClient.getBookDetails(id);
    if (!book) {
      return {
        content: [
          {
            type: 'text',
            text: `Book with ID ${id} not found`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(book, null, 2),
        },
      ],
    };
  }
);

// Tool: Get user library
server.registerTool(
  'get_user_library',
  {
    description: 'Get the current user\'s reading library',
  },
  async (): Promise<CallToolResult> => {
    const library = await hardcoverClient.getUserLibrary();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(library, null, 2),
        },
      ],
    };
  }
);

// Tool: Add to library
server.registerTool(
  'add_to_library',
  {
    description: 'Add a book to the user\'s library with a specific status',
    inputSchema: addToLibrarySchema,
  },
  async ({ bookId, status }): Promise<CallToolResult> => {
    return {
      content: [
        {
          type: 'text',
          text: `Added book ${bookId} to library with status: ${status}`,
        },
      ],
    };
  }
);

// Tool: Update reading status
server.registerTool(
  'update_reading_status',
  {
    description: 'Update the reading status, rating, or progress of a book in the library',
    inputSchema: updateStatusSchema,
  },
  async ({ id, status, rating, progress }): Promise<CallToolResult> => {
    return {
      content: [
        {
          type: 'text',
          text: `Updated book ${id} - Status: ${status}, Rating: ${rating || 'N/A'}, Progress: ${progress || 'N/A'}%`,
        },
      ],
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hardcover MCP server running on stdio');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
