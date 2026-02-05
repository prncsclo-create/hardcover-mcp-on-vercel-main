import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HardcoverClient } from '../lib/hardcover-client.js';

const HARDCOVERAPI_KEY = process.env.HARDCOVERAPI_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('MCP API handler called', { method: req.method, url: req.url });
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET' || req.method === 'POST') {
    try {
      console.log('Setting up MCP server');
      
      // For debugging, let's first try a super simple response to test connection
      if (req.query.test === 'true') {
        console.log('Test mode - sending simple response');
        res.status(200).json({ status: 'ok', message: 'MCP server running' });
        return;
      }
      
      console.log('Creating SSE transport');
      const transport = new SSEServerTransport('/api/mcp', res);
      
      console.log('Creating MCP server');
      const server = new McpServer({
        name: 'Hardcover MCP',
        version: '1.0.0'
      });
      
      console.log('Creating Hardcover client');
      const client = new HardcoverClient(HARDCOVERAPI_KEY);
      
      console.log('API Key length:', HARDCOVERAPI_KEY ? HARDCOVERAPI_KEY.length : 0);
      
      console.log('Registering search_books tool');
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
          console.log('Executing search_books', { query, limit });
          try {
            const books = await client.searchBooks(query, limit);
            console.log('Search results', { count: books.length });
            return books;
          } catch (error) {
            console.error('Error searching books:', error);
            return { error: `Failed to search books: ${error instanceof Error ? error.message : String(error)}` };
          }
        }
      });
      
      console.log('Registering get_book_details tool');
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
          console.log('Executing get_book_details', { book_id });
          try {
            const book = await client.getBookDetails(book_id);
            console.log('Book details retrieved');
            return book;
          } catch (error) {
            console.error('Error getting book details:', error);
            return { error: `Failed to get book details: ${error instanceof Error ? error.message : String(error)}` };
          }
        }
      });
      
      console.log('Registering get_user_library tool');
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
          console.log('Executing get_user_library', { user_id });
          try {
            const books = await client.getUserLibrary(user_id);
            console.log('User library retrieved', { count: books.length });
            return books;
          } catch (error) {
            console.error('Error getting user library:', error);
            return { error: `Failed to get user library: ${error instanceof Error ? error.message : String(error)}` };
          }
        }
      });
      
      console.log('Connecting server to transport');
      await server.connect(transport);
      console.log('Server connected');
      
      return;
    } catch (error) {
      console.error('Error in MCP handler:', error);
      res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
      return;
    }
  } else {
    console.log('Method not allowed:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
}
