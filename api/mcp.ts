import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HardcoverClient } from '../lib/hardcover-client.js';

const HARDCOVERAPI_KEY = process.env.HARDCOVERAPI_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET' || req.method === 'POST') {
    // SSEServerTransport takes req, res arguments
    const transport = new SSEServerTransport(req, res);
    const server = new McpServer({
      serverName: 'Hardcover MCP',
      serverVersion: '1.0.0'
    });
    
    // Create client
    const client = new HardcoverClient(HARDCOVERAPI_KEY);
    
    // Register search books tool - fix arguments
    server.registerTool(
      'search_books',
      'Search for books by title, author, or ISBN',
      {
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
      async ({ query, limit = 10 }: { query: string; limit?: number }) => {
        try {
          const books = await client.searchBooks(query, limit);
          return books;
        } catch (error) {
          console.error('Error searching books:', error);
          return { error: `Failed to search books: ${error instanceof Error ? error.message : String(error)}` };
        }
      }
    );
    
    // Register get book details tool
    server.registerTool(
      'get_book_details',
      'Get detailed information about a specific book by ID',
      {
        type: 'object',
        properties: {
          book_id: {
            type: 'number',
            description: 'Hardcover book ID',
          },
        },
        required: ['book_id'],
      },
      async ({ book_id }: { book_id: number }) => {
        try {
          const book = await client.getBookDetails(book_id);
          return book;
        } catch (error) {
          console.error('Error getting book details:', error);
          return { error: `Failed to get book details: ${error instanceof Error ? error.message : String(error)}` };
        }
      }
    );
    
    // Register get user library tool
    server.registerTool(
      'get_user_library',
      'Get a list of books in the user\'s library',
      {
        type: 'object',
        properties: {
          user_id: {
            type: 'number',
            description: 'Hardcover user ID (optional)',
          },
        },
      },
      async ({ user_id }: { user_id?: number }) => {
        try {
          const books = await client.getUserLibrary(user_id);
          return books;
        } catch (error) {
          console.error('Error getting user library:', error);
          return { error: `Failed to get user library: ${error instanceof Error ? error.message : String(error)}` };
        }
      }
    );
    
    await server.connect(transport);
    
    // SSE transport doesn't use handleRequest, the transport is already handling the request
    // Just return to keep the connection open
    return;
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
