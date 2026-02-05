import { gql } from 'graphql-request';

export const SEARCH_BOOKS_QUERY = gql`
  query SearchBooks($query: String!, $limit: Int = 10) {
    books(
      where: {
        _or: [
          { title: { _ilike: $query } }
          { author_users: { user: { name: { _ilike: $query } } } }
        ]
      }
      limit: $limit
      order_by: { users_read_count: desc }
    ) {
      id
      title
      description
      release_date
      rating
      users_read_count
      cached_tags
      images {
        url
        width
        height
      }
      author_users {
        user {
          id
          name
        }
      }
      series_books {
        series {
          name
          id
        }
        position
      }
    }
  }
`;

export const GET_BOOK_DETAILS_QUERY = gql`
  query GetBook($id: Int!) {
    books_by_pk(id: $id) {
      id
      title
      description
      release_date
      rating
      users_read_count
      pages
      language
      isbn_10
      isbn_13
      cached_tags
      images {
        url
        width
        height
      }
      author_users {
        user {
          id
          name
          bio
        }
      }
      series_books {
        series {
          id
          name
          description
        }
        position
      }
      reviews(limit: 5, order_by: { created_at: desc }) {
        id
        body
        rating
        user {
          name
        }
        created_at
      }
    }
  }
`;

export const GET_USER_LIBRARY_QUERY = gql`
  query GetUserLibrary($userId: Int) {
    user_books(
      where: { user_id: { _eq: $userId } }
      order_by: { updated_at: desc }
    ) {
      id
      status
      rating
      progress
      created_at
      updated_at
      book {
        id
        title
        description
        release_date
        rating
        pages
        images {
          url
        }
        author_users {
          user {
            name
          }
        }
      }
    }
  }
`;

export const ADD_BOOK_TO_LIBRARY_MUTATION = gql`
  mutation AddBookToLibrary($bookId: Int!, $status: String!) {
    insert_user_books_one(object: { book_id: $bookId, status: $status }) {
      id
      status
      book {
        id
        title
      }
    }
  }
`;

export const UPDATE_READING_STATUS_MUTATION = gql`
  mutation UpdateReadingStatus($id: Int!, $status: String!, $rating: Int, $progress: Int) {
    update_user_books_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, rating: $rating, progress: $progress }
    ) {
      id
      status
      rating
      progress
    }
  }
`;
