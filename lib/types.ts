```typescript
export interface HardcoverBook {
id: number;
title: string;
description?: string;
release_date?: string;
rating?: number;
usersreadcount?: number;
pages?: number;
language?: string;
isbn_10?: string;
isbn_13?: string;
cached_tags?: string[];
images: HardcoverImage[];
author_users: HardcoverAuthorUser[];
series_books?: HardcoverSeriesBook[];
reviews?: HardcoverReview[];
}

export interface HardcoverImage {
url: string;
width?: number;
height?: number;
}

export interface HardcoverAuthorUser {
user: {
id: number;
name: string;
bio?: string;
};
}

export interface HardcoverSeriesBook {
series: {
id: number;
name: string;
description?: string;
};
position?: number;
}

export interface HardcoverReview {
id: number;
body: string;
rating?: number;
created_at: string;
user: {
name: string;
};
}

export interface HardcoverUserBook {
id: number;
status: 'WANTTOREAD' | 'CURRENTLYREADING' | 'READ' | 'DIDNOT_FINISH';
rating?: number;
progress?: number;
created_at: string;
updated_at: string;
book: HardcoverBook;
}

export interface SearchBooksResponse {
books: HardcoverBook[];
}

export interface GetBookResponse {
booksbypk: HardcoverBook;
}

export interface UserLibraryResponse {
user_books: HardcoverUserBook[];
}

export interface BookSearchParams {
query: string;
limit?: number;
}

export interface BookDetailsParams {
id: number;
}

export interface AddToLibraryParams {
bookId: number;
status: string;
}

export interface UpdateStatusParams {
id: number;
status: string;
rating?: number;
progress?: number;
}
```
