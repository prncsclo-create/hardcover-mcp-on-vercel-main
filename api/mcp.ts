import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HardcoverClient } from '../lib/hardcover-client.js';

const HARDCOVERAPI_KEY = process.env.HARDCOVERAPI_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET' || req.method === 'POST') {
    // SSEServerTransport takes path and response arguments
    const transport = new SSEServerTransport('/api/mcp', res);
    const server = new McpServer({
      name: 'Hardcover MCP',
      version: '1.0.0'
    });
    
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
      execute: async ({ query, limit = 10 }: { query: string; limit?: number }) => {
        try {
          const books = await client.searchBooks(query, limit);
          return books;
        } catch (error) {
          console.error('Error searching books:', error);
          return { error: `Failed to search books: ${error instanceof Error ? error.message : String(error)}` };
        }
      }
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
      execute: async ({ book_id }: { book_id: number }) => {
        try {
          const book = await client.getBookDetails(book_id);
          return book;
        } catch (error) {
          console.error('Error getting book details:', error);
          return { error: `Failed to get book details: ${error instanceof Error ? error.message : String(error)}` };
        }
      }
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
      execute: async ({ user_id }: { user_id?: number }) => {
        try {
          const books = await client.getUserLibrary(user_id);
          return books;
        } catch (error) {
          console.error('Error getting user library:', error);
          return { error: `Failed to get user library: ${error instanceof Error ? error.message : String(error)}` };
        }
      }
    });
    
    await server.connect(transport);
    
    // SSE transport doesn't use handleRequest, the transport is already handling the request
    // Just return to keep the connection open
    return;
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
