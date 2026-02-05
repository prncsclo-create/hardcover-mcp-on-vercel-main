import { GraphQLClient } from 'graphql-request';
import {
  SEARCH_BOOKS_QUERY,
  GET_BOOK_DETAILS_QUERY,
  GET_USER_LIBRARY_QUERY
} from './queries.js';
import {
  HardcoverBook,
  SearchBooksResponse,
  GetBookResponse,
  UserLibraryResponse
} from './types.js';

export class HardcoverClient {
  private client: GraphQLClient;

  constructor(apiKey: string) {
    this.client = new GraphQLClient('https://api.hardcover.app/v1/graphql', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async searchBooks(query: string, limit = 10): Promise<HardcoverBook[]> {
    try {
      const variables = {
        query: query,
        limit
      };

      const response: SearchBooksResponse = await this.client.request(
        SEARCH_BOOKS_QUERY,
        variables
      );

      return response.books || [];
    } catch (error) {
      console.error('Error searching books:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to search books: ${error.message}`);
      }
      throw new Error(`Failed to search books: ${String(error)}`);
    }
  }

  async getBookDetails(bookId: number): Promise<HardcoverBook | null> {
    try {
      const variables = { id: bookId };

      const response: GetBookResponse = await this.client.request(
        GET_BOOK_DETAILS_QUERY,
        variables
      );

      return response.books_by_pk || null;
    } catch (error) {
      console.error('Error getting book details:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get book details: ${error.message}`);
      }
      throw new Error(`Failed to get book details: ${String(error)}`);
    }
  }

  async getUserLibrary(userId?: number): Promise<any[]> {
    try {
      const variables: any = {};
      if (userId !== undefined) {
        variables.userId = userId;
      }

      const response: UserLibraryResponse = await this.client.request(
        GET_USER_LIBRARY_QUERY,
        variables
      );

      return response.user_books || [];
    } catch (error) {
      console.error('Error getting user library:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get user library: ${error.message}`);
      }
      throw new Error(`Failed to get user library: ${String(error)}`);
    }
  }
}
