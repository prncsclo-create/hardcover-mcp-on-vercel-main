import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HardcoverClient } from '../lib/hardcover-client.js';

const HARDCOVERAPI_KEY = process.env.HARDCOVERAPI_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET' || req.method === 'POST') {
    const transport = new SSEServerTransport('/api/mcp', res);
    const server = new McpServer();
    
    // Create client
    const client = new HardcoverClient(HARDCOVERAPI_KEY);
    
    // Register search books tool
    server.registerTool({
      name: 'search_books',
      description: 'Search for books by title, author, or ISBN',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (title, author, or ISBN)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 10,
          },
        },
        required: ['query'],
      },
      execute: async ({ query, limit = 10 }) => {
        try {
          const books = await client.searchBooks(query, limit);
          return books;
        } catch (error) {
          console.error('Error searching books:', error);
          return { error: `Failed to search books: ${error instanceof Error ? error.message : String(error)}` };
        }
      },
    });
    
    // Register get book details tool
    server.registerTool({
      name: 'get_book_details',
      description: 'Get detailed information about a specific book by ID',
      parameters: {
        type: 'object',
        properties: {
          book_id: {
            type: 'number',
            description: 'Hardcover book ID',
          },
        },
        required: ['book_id'],
      },
      execute: async ({ book_id }) => {
        try {
          const book = await client.getBookDetails(book_id);
          return book;
        } catch (error) {
          console.error('Error getting book details:', error);
          return { error: `Failed to get book details: ${error instanceof Error ? error.message : String(error)}` };
        }
      },
    });
    
    // Register get user library tool
    server.registerTool({
      name: 'get_user_library',
      description: 'Get a list of books in the user\'s library',
      parameters: {
        type: 'object',
        properties: {
          user_id: {
            type: 'number',
            description: 'Hardcover user ID (optional)',
          },
        },
      },
      execute: async ({ user_id }) => {
        try {
          const books = await client.getUserLibrary(user_id);
          return books;
        } catch (error) {
          console.error('Error getting user library:', error);
          return { error: `Failed to get user library: ${error instanceof Error ? error.message : String(error)}` };
        }
      },
    });
    
    await server.connect(transport);
    transport.handleRequest(req);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
