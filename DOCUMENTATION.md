# Photo Manager Application - Complete Documentation

A production-level React TypeScript application that fetches photos from JSONPlaceholder API, stores them in IndexedDB with smart caching, and provides full CRUD operations, search, pagination, and favorites management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Component Documentation](#component-documentation)
7. [Hooks Documentation](#hooks-documentation)
8. [Usage Examples](#usage-examples)
9. [Performance Considerations](#performance-considerations)
10. [Error Handling](#error-handling)

---

## Architecture Overview

### Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Database**: IndexedDB (via `idb` library)
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: React hooks (custom `usePhotos` hook)
- **API**: JSONPlaceholder (public REST API)

### Data Flow

```
App Start
  ↓
usePhotos Hook Initialization
  ↓
Check IndexedDB for existing data
  ├─ YES → Load from DB (cached)
  └─ NO → Fetch from API → Save to DB
  ↓
Display photos in grid
  ↓
User interactions (search, filter, pagination)
  ↓
IndexedDB queries for efficient data retrieval
```

### Caching Strategy

The application implements **smart caching** with the following logic:

1. **First Load**: Check if IndexedDB has photos
   - If YES: Load from cache (instant, no API call)
   - If NO: Fetch from API, save to DB, then load

2. **Subsequent Loads**: All data comes from IndexedDB
   - API is never called again unless database is cleared
   - Reduces network requests and improves performance

3. **Data Persistence**: Photos persist across browser sessions
   - Users can close and reopen the app without re-fetching
   - Favorites are also persisted

---

## Features

### Core Features

✅ **Data Fetching**
- Fetch 5000 photos from JSONPlaceholder API
- Each photo contains: id, albumId, title, url, thumbnailUrl
- Automatic caching on first load

✅ **IndexedDB Integration**
- Database: `photos-db`
- Object Stores: `photos` and `favorites`
- Indexes: `by-title` (photos), `by-photoId` (favorites)
- Efficient querying and filtering

✅ **CRUD Operations**
- **Create**: Save photos to database
- **Read**: Get all photos, get by ID, search by title
- **Update**: Toggle favorite status
- **Delete**: Remove photos from database

✅ **Search Functionality**
- Real-time search by photo title
- Case-insensitive matching
- Uses IndexedDB index for efficiency
- Instant results from cached data

✅ **Pagination**
- "Load More" button for progressive loading
- 12 photos per page
- Tracks total count and remaining items
- Smooth infinite scroll experience

✅ **Favorites Management**
- Add/remove photos from favorites
- Persistent favorites stored in separate object store
- Favorites sidebar for quick access
- Favorite count badge

✅ **UI/UX**
- Responsive grid layout (1-4 columns based on screen size)
- Photo detail modal with full image
- Loading states and error handling
- Empty state messages
- Tooltips for truncated titles
- Smooth animations and transitions

---

## Project Structure

```
photo-manager-app/
├── client/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.tsx           # Search input component
│   │   │   ├── PhotoItem.tsx           # Individual photo card
│   │   │   ├── PhotoList.tsx           # Grid of photos
│   │   │   ├── PhotoDetail.tsx         # Photo detail modal
│   │   │   ├── FavoritesBar.tsx        # Favorites sidebar
│   │   │   └── ui/                     # shadcn/ui components
│   │   ├── hooks/
│   │   │   └── usePhotos.ts            # Main data management hook
│   │   ├── lib/
│   │   │   └── db.ts                   # IndexedDB layer
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript interfaces
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx        # Theme provider
│   │   ├── pages/
│   │   │   ├── Home.tsx                # Main page
│   │   │   └── NotFound.tsx
│   │   ├── App.tsx                     # Route definitions
│   │   ├── main.tsx                    # React entry point
│   │   └── index.css                   # Global styles
│   └── index.html
├── server/
│   └── index.ts                        # Express server (static only)
├── shared/
│   └── const.ts                        # Shared constants
├── package.json
└── DOCUMENTATION.md                    # This file
```

---

## Database Schema

### Database: `photos-db`

#### Object Store: `photos`

Stores all photo data fetched from the API.

```typescript
{
  keyPath: "id",
  indexes: {
    "by-title": "title"  // For efficient title-based searches
  }
}
```

**Schema:**
```typescript
interface Photo {
  id: number;              // Primary key
  albumId: number;         // Album identifier
  title: string;           // Photo title (indexed)
  url: string;             // Full-size image URL
  thumbnailUrl: string;    // Thumbnail image URL
}
```

**Example:**
```json
{
  "id": 1,
  "albumId": 1,
  "title": "accusamus beatae ad facilis cum similique qui sunt",
  "url": "https://via.placeholder.com/600/92c952",
  "thumbnailUrl": "https://via.placeholder.com/150/92c952"
}
```

#### Object Store: `favorites`

Stores user's favorite photo references.

```typescript
{
  keyPath: "id",
  autoIncrement: true,
  indexes: {
    "by-photoId": "photoId"  // For efficient lookups
  }
}
```

**Schema:**
```typescript
interface Favorite {
  id: number;              // Auto-incremented primary key
  photoId: number;         // Reference to photo.id
  addedAt: number;         // Timestamp when added
}
```

---

## API Reference

### Database Layer (`lib/db.ts`)

#### Initialization

```typescript
// Initialize database (called automatically)
await initializeDB(): Promise<IDBPDatabase<PhotosDB>>

// Get database instance
await getDB(): Promise<IDBPDatabase<PhotosDB>>
```

#### Photos CRUD

```typescript
// Save multiple photos
await savePhotos(photos: Photo[]): Promise<void>

// Get all photos
await getAllPhotos(): Promise<Photo[]>

// Get paginated photos
await getPhotosPaginated(pageIndex: number, pageSize: number): 
  Promise<{ photos: Photo[], total: number }>

// Get single photo by ID
await getPhotoById(id: number): Promise<Photo | undefined>

// Search photos by title (case-insensitive)
await searchPhotosByTitle(query: string): Promise<Photo[]>

// Delete photo by ID
await deletePhoto(id: number): Promise<void>

// Clear all photos
await clearAllPhotos(): Promise<void>

// Check if photos exist
await hasPhotos(): Promise<boolean>

// Get total photo count
await getPhotoCount(): Promise<number>
```

#### Favorites CRUD

```typescript
// Add photo to favorites
await addFavorite(photoId: number): Promise<number>

// Remove photo from favorites
await removeFavorite(photoId: number): Promise<void>

// Get all favorite photos
await getAllFavorites(): Promise<Photo[]>

// Check if photo is favorite
await isFavorite(photoId: number): Promise<boolean>

// Get favorite count
await getFavoriteCount(): Promise<number>

// Clear all favorites
await clearAllFavorites(): Promise<void>
```

#### Database Management

```typescript
// Close database connection
await closeDB(): Promise<void>

// Delete entire database
await deleteDatabase(): Promise<void>
```

---

## Component Documentation

### SearchBar Component

**Purpose**: Search input for filtering photos by title

**Props:**
```typescript
interface SearchBarProps {
  onSearch: (query: string) => Promise<void>;  // Search handler
  onReset: () => Promise<void>;                // Reset handler
  initialQuery?: string;                       // Initial search term
  isLoading?: boolean;                         // Loading state
}
```

**Features:**
- Real-time search as user types
- Clear button to reset search
- Search icon and loading indicator
- Disabled state during loading

**Usage:**
```tsx
<SearchBar
  onSearch={searchPhotos}
  onReset={resetSearch}
  initialQuery={searchQuery}
  isLoading={appState.isLoading}
/>
```

---

### PhotoItem Component

**Purpose**: Display individual photo in grid with actions

**Props:**
```typescript
interface PhotoItemProps {
  photo: Photo;
  isFavorite: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}
```

**Features:**
- Thumbnail image with lazy loading
- Hover overlay with eye icon
- Truncated title with tooltip
- Favorite toggle button
- Delete button with confirmation
- Responsive card design

**Usage:**
```tsx
<PhotoItem
  photo={photo}
  isFavorite={favoriteIds.has(photo.id)}
  onSelect={selectPhoto}
  onDelete={deletePhotoItem}
  onToggleFavorite={toggleFavorite}
/>
```

---

### PhotoList Component

**Purpose**: Display grid of photos with pagination

**Props:**
```typescript
interface PhotoListProps {
  photos: Photo[];
  favoriteIds: Set<number>;
  onSelectPhoto: (id: number) => void;
  onDeletePhoto: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  error?: string | null;
}
```

**Features:**
- Responsive grid (1-4 columns)
- Load More button for pagination
- Loading skeleton
- Empty state message
- Error alert
- Results counter

**Usage:**
```tsx
<PhotoList
  photos={photos}
  favoriteIds={favoriteIds}
  onSelectPhoto={selectPhoto}
  onDeletePhoto={deletePhotoItem}
  onToggleFavorite={toggleFavorite}
  onLoadMore={loadMorePhotos}
  hasMore={pagination.hasMore}
  isLoading={appState.isLoading}
  error={appState.error}
/>
```

---

### PhotoDetail Component

**Purpose**: Modal for viewing full photo details

**Props:**
```typescript
interface PhotoDetailProps {
  photo: Photo | null;
  isFavorite: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}
```

**Features:**
- Full-size image display
- Photo metadata (ID, Album ID, Title)
- Direct links to image URLs
- Favorite toggle
- Delete button with confirmation
- Close button
- Responsive modal

**Usage:**
```tsx
<PhotoDetail
  photo={currentPhoto}
  isFavorite={currentPhoto ? favoriteIds.has(currentPhoto.id) : false}
  onClose={handleCloseDetail}
  onDelete={handleDeletePhoto}
  onToggleFavorite={handleToggleFavorite}
/>
```

---

### FavoritesBar Component

**Purpose**: Sidebar showing favorite photos

**Props:**
```typescript
interface FavoritesBarProps {
  favorites: Photo[];
  onSelectPhoto: (id: number) => void;
  onRemoveFavorite: (id: number) => void;
}
```

**Features:**
- Collapsible favorites panel
- Favorite count badge
- Thumbnail previews
- Quick photo selection
- Remove button on hover
- Empty state message
- Scrollable list

**Usage:**
```tsx
<FavoritesBar
  favorites={favorites}
  onSelectPhoto={selectPhoto}
  onRemoveFavorite={handleToggleFavorite}
/>
```

---

## Hooks Documentation

### usePhotos Hook

**Purpose**: Main data management hook for the application

**Returns:**
```typescript
interface UsePhotosReturn {
  // Data
  photos: Photo[];
  currentPhoto: Photo | null;
  favorites: Photo[];
  favoriteIds: Set<number>;

  // State
  appState: AppState;
  pagination: PaginationState;
  searchQuery: string;

  // Actions
  loadMorePhotos: () => Promise<void>;
  searchPhotos: (query: string) => Promise<void>;
  selectPhoto: (id: number) => Promise<void>;
  deletePhotoItem: (id: number) => Promise<void>;
  toggleFavorite: (photoId: number) => Promise<void>;
  loadFavorites: () => Promise<void>;
  resetSearch: () => Promise<void>;
}
```

**Initialization Logic:**

```typescript
// On component mount:
1. Check if photos exist in IndexedDB
2. If YES: Load from cache (instant)
3. If NO: Fetch from API, save to DB, then load
4. Load favorite IDs for quick lookups
5. Set isInitialized to true
```

**State Management:**

```typescript
// Data state
const [photos, setPhotos] = useState<Photo[]>([]);
const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
const [favorites, setFavorites] = useState<Photo[]>([]);
const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

// UI state
const [appState, setAppState] = useState<AppState>({
  isLoading: true,
  error: null,
  isInitialized: false,
});

// Pagination state
const [pagination, setPagination] = useState<PaginationState>({
  currentPage: 0,
  pageSize: 12,
  totalCount: 0,
  hasMore: true,
});
```

**Key Features:**

- **Smart Caching**: Only fetches from API if database is empty
- **Pagination**: Loads 12 photos per page with "Load More"
- **Search**: Real-time search with case-insensitive matching
- **Favorites**: Persistent favorites with quick lookups
- **Error Handling**: Comprehensive error states and messages
- **Loading States**: Tracks initialization and operation states

---

## Usage Examples

### Basic Setup

```typescript
// In your React component
import { usePhotos } from '@/hooks/usePhotos';

export default function MyComponent() {
  const {
    photos,
    currentPhoto,
    favorites,
    favoriteIds,
    appState,
    pagination,
    searchQuery,
    loadMorePhotos,
    searchPhotos,
    selectPhoto,
    deletePhotoItem,
    toggleFavorite,
    loadFavorites,
    resetSearch,
  } = usePhotos();

  // Use the hook data and methods...
}
```

### Example 1: Display All Photos

```typescript
import PhotoList from '@/components/PhotoList';
import { usePhotos } from '@/hooks/usePhotos';

export default function PhotoGallery() {
  const {
    photos,
    favoriteIds,
    selectPhoto,
    deletePhotoItem,
    toggleFavorite,
    loadMorePhotos,
    pagination,
    appState,
  } = usePhotos();

  return (
    <PhotoList
      photos={photos}
      favoriteIds={favoriteIds}
      onSelectPhoto={selectPhoto}
      onDeletePhoto={deletePhotoItem}
      onToggleFavorite={toggleFavorite}
      onLoadMore={loadMorePhotos}
      hasMore={pagination.hasMore}
      isLoading={appState.isLoading}
    />
  );
}
```

### Example 2: Search Photos

```typescript
import SearchBar from '@/components/SearchBar';
import { usePhotos } from '@/hooks/usePhotos';

export default function SearchPhotos() {
  const { searchPhotos, resetSearch, searchQuery } = usePhotos();

  return (
    <SearchBar
      onSearch={searchPhotos}
      onReset={resetSearch}
      initialQuery={searchQuery}
    />
  );
}
```

### Example 3: Direct Database Access

```typescript
import {
  getAllPhotos,
  searchPhotosByTitle,
  addFavorite,
  removeFavorite,
  isFavorite,
} from '@/lib/db';

// Get all photos
const allPhotos = await getAllPhotos();

// Search by title
const results = await searchPhotosByTitle('sunset');

// Add to favorites
const favoriteId = await addFavorite(photoId);

// Check if favorite
const isFav = await isFavorite(photoId);

// Remove from favorites
await removeFavorite(photoId);
```

### Example 4: Pagination

```typescript
import { getPhotosPaginated } from '@/lib/db';

// Get first page (12 photos)
const { photos: page1, total } = await getPhotosPaginated(0, 12);
console.log(`Total photos: ${total}, Current page: ${photos.length}`);

// Get second page
const { photos: page2 } = await getPhotosPaginated(1, 12);

// Get third page
const { photos: page3 } = await getPhotosPaginated(2, 12);
```

### Example 5: Working with Favorites

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import { useEffect } from 'react';

export default function FavoritesView() {
  const { favorites, loadFavorites, toggleFavorite } = usePhotos();

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return (
    <div>
      <h2>My Favorites ({favorites.length})</h2>
      {favorites.map(photo => (
        <div key={photo.id}>
          <img src={photo.thumbnailUrl} alt={photo.title} />
          <h3>{photo.title}</h3>
          <button onClick={() => toggleFavorite(photo.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Example 6: Error Handling

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PhotoApp() {
  const { appState, photos } = usePhotos();

  if (appState.isLoading) {
    return <div>Loading photos...</div>;
  }

  if (appState.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{appState.error}</AlertDescription>
      </Alert>
    );
  }

  if (photos.length === 0) {
    return <div>No photos found</div>;
  }

  return <div>Photos loaded: {photos.length}</div>;
}
```

---

## Performance Considerations

### 1. **IndexedDB Queries**

- All queries use IndexedDB instead of in-memory filtering
- Reduces memory usage for large datasets
- Efficient index lookups for search operations

```typescript
// Good: Uses IndexedDB index
const results = await searchPhotosByTitle(query);

// Avoid: In-memory filtering
const results = photos.filter(p => p.title.includes(query));
```

### 2. **Pagination**

- Load 12 photos per page (configurable)
- Prevents rendering thousands of DOM nodes at once
- Improves initial load time and scrolling performance

```typescript
const PAGE_SIZE = 12; // Optimal for most devices
const { photos, total } = await getPhotosPaginated(pageIndex, PAGE_SIZE);
```

### 3. **Lazy Loading**

- Images use `loading="lazy"` attribute
- Thumbnails load only when visible
- Reduces initial page load time

```tsx
<img
  src={photo.thumbnailUrl}
  alt={photo.title}
  loading="lazy"
/>
```

### 4. **Memoization**

- `useCallback` prevents unnecessary function recreations
- `useRef` tracks initialization to prevent duplicate fetches
- `Set<number>` for O(1) favorite lookups

```typescript
const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
// O(1) lookup instead of O(n) array search
const isFav = favoriteIds.has(photoId);
```

### 5. **Caching Strategy**

- First load: Check IndexedDB, fetch from API only if empty
- Subsequent loads: All data from cache
- Eliminates redundant API calls

### 6. **Memory Management**

- Only current page photos in state
- Favorites loaded on demand
- Search results replace full list temporarily

---

## Error Handling

### Error Types

1. **API Fetch Errors**
   ```typescript
   if (!response.ok) {
     throw new Error(`API Error: ${response.status}`);
   }
   ```

2. **Database Errors**
   ```typescript
   try {
     await savePhotos(data);
   } catch (error) {
     console.error('Database error:', error);
   }
   ```

3. **User Action Errors**
   ```typescript
   try {
     await deletePhoto(id);
   } catch (error) {
     setAppState(prev => ({
       ...prev,
       error: 'Failed to delete photo'
     }));
   }
   ```

### Error Recovery

- All errors are caught and stored in `appState.error`
- Users see friendly error messages in UI
- App remains functional after errors
- Retry logic can be implemented if needed

```typescript
if (appState.error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{appState.error}</AlertDescription>
    </Alert>
  );
}
```

---

## TypeScript Interfaces

```typescript
// Photo from API
interface Photo {
  id: number;
  albumId: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

// Favorite entry
interface Favorite {
  id: number;
  photoId: number;
  addedAt: number;
}

// Pagination state
interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

// Search state
interface SearchState {
  query: string;
  results: Photo[];
  isSearching: boolean;
}

// App state
interface AppState {
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Database schema
interface PhotosDB extends DBSchema {
  photos: {
    key: number;
    value: Photo;
    indexes: { "by-title": string };
  };
  favorites: {
    key: number;
    value: Favorite;
    indexes: { "by-photoId": number };
  };
}
```

---

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14+)
- IndexedDB: Supported in all modern browsers

---

## Deployment

The application is a static React app that can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

Build command:
```bash
pnpm run build
```

---

## Future Enhancements

1. **Advanced Filtering**: Filter by album, date range, etc.
2. **Sorting**: Sort by ID, title, date added
3. **Collections**: Group photos into custom collections
4. **Export**: Export favorites as ZIP or JSON
5. **Sync**: Cloud sync for favorites across devices
6. **Offline Mode**: Full offline support with service workers
7. **Image Optimization**: WebP conversion, compression
8. **Advanced Search**: Full-text search with stemming

---

## License

MIT License - Feel free to use this code in your projects!

---

## Support

For issues or questions, refer to:
- [IndexedDB Documentation](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [idb Library](https://github.com/jakearchibald/idb)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
