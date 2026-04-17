# Photo Manager - Code Examples & Usage Guide

Complete working examples for using the Photo Manager application.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Hook Usage](#hook-usage)
3. [Database Operations](#database-operations)
4. [Component Integration](#component-integration)
5. [Advanced Patterns](#advanced-patterns)
6. [Error Handling](#error-handling)

---

## Basic Setup

### Initialize the Application

```typescript
// client/src/pages/Home.tsx
import { usePhotos } from '@/hooks/usePhotos';
import PhotoList from '@/components/PhotoList';
import SearchBar from '@/components/SearchBar';

export default function Home() {
  const {
    photos,
    currentPhoto,
    favorites,
    favoriteIds,
    appState,
    pagination,
    loadMorePhotos,
    searchPhotos,
    selectPhoto,
    deletePhotoItem,
    toggleFavorite,
    loadFavorites,
    resetSearch,
  } = usePhotos();

  // On mount, usePhotos automatically:
  // 1. Checks if photos exist in IndexedDB
  // 2. If yes: loads from cache
  // 3. If no: fetches from API and saves to DB
  // 4. Loads favorite IDs for quick lookups

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

---

## Hook Usage

### Example 1: Display Photos with Pagination

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import PhotoList from '@/components/PhotoList';

export default function PhotoGallery() {
  const {
    photos,
    favoriteIds,
    appState,
    pagination,
    selectPhoto,
    deletePhotoItem,
    toggleFavorite,
    loadMorePhotos,
  } = usePhotos();

  return (
    <div>
      {/* Loading state */}
      {appState.isLoading && <div>Loading...</div>}

      {/* Error state */}
      {appState.error && <div>Error: {appState.error}</div>}

      {/* Photo list */}
      {!appState.isLoading && (
        <>
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

          {/* Info */}
          <p>
            Showing {photos.length} of {pagination.totalCount} photos
          </p>
        </>
      )}
    </div>
  );
}
```

### Example 2: Search Implementation

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import SearchBar from '@/components/SearchBar';
import PhotoList from '@/components/PhotoList';
import { useState } from 'react';

export default function SearchPage() {
  const {
    photos,
    favoriteIds,
    searchQuery,
    searchPhotos,
    resetSearch,
    selectPhoto,
    deletePhotoItem,
    toggleFavorite,
  } = usePhotos();

  return (
    <div>
      {/* Search input */}
      <SearchBar
        onSearch={searchPhotos}
        onReset={resetSearch}
        initialQuery={searchQuery}
      />

      {/* Results */}
      {searchQuery && (
        <div>
          <h2>Search Results for "{searchQuery}"</h2>
          <p>Found {photos.length} photos</p>

          <PhotoList
            photos={photos}
            favoriteIds={favoriteIds}
            onSelectPhoto={selectPhoto}
            onDeletePhoto={deletePhotoItem}
            onToggleFavorite={toggleFavorite}
            onLoadMore={() => {}}
            hasMore={false}
            isLoading={false}
          />
        </div>
      )}
    </div>
  );
}
```

### Example 3: Favorites Management

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import { useEffect } from 'react';

export default function FavoritesPage() {
  const { favorites, loadFavorites, toggleFavorite, selectPhoto } =
    usePhotos();

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return (
    <div>
      <h1>My Favorites ({favorites.length})</h1>

      {favorites.length === 0 ? (
        <p>No favorites yet. Add some photos!</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {favorites.map((photo) => (
            <div key={photo.id}>
              <img
                src={photo.thumbnailUrl}
                alt={photo.title}
                onClick={() => selectPhoto(photo.id)}
                style={{ cursor: 'pointer' }}
              />
              <h3>{photo.title}</h3>
              <button onClick={() => toggleFavorite(photo.id)}>
                Remove from Favorites
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Database Operations

### Example 1: Direct Database Access

```typescript
import {
  getAllPhotos,
  getPhotoById,
  searchPhotosByTitle,
  deletePhoto,
  savePhotos,
} from '@/lib/db';

// Get all photos
async function getAllPhotosExample() {
  try {
    const photos = await getAllPhotos();
    console.log(`Total photos: ${photos.length}`);
    console.log('First photo:', photos[0]);
  } catch (error) {
    console.error('Failed to get photos:', error);
  }
}

// Get single photo
async function getPhotoExample() {
  try {
    const photo = await getPhotoById(1);
    if (photo) {
      console.log('Photo found:', photo.title);
    } else {
      console.log('Photo not found');
    }
  } catch (error) {
    console.error('Failed to get photo:', error);
  }
}

// Search photos
async function searchExample() {
  try {
    const results = await searchPhotosByTitle('sunset');
    console.log(`Found ${results.length} photos matching "sunset"`);

    results.forEach((photo) => {
      console.log(`- ${photo.title}`);
    });
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Delete photo
async function deletePhotoExample() {
  try {
    await deletePhoto(1);
    console.log('Photo deleted');
  } catch (error) {
    console.error('Failed to delete photo:', error);
  }
}

// Save new photos
async function savePhotosExample() {
  const newPhotos = [
    {
      id: 5001,
      albumId: 1,
      title: 'Custom Photo',
      url: 'https://example.com/photo.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
    },
  ];

  try {
    await savePhotos(newPhotos);
    console.log('Photos saved');
  } catch (error) {
    console.error('Failed to save photos:', error);
  }
}
```

### Example 2: Pagination

```typescript
import { getPhotosPaginated } from '@/lib/db';

async function paginationExample() {
  const PAGE_SIZE = 12;

  try {
    // Get first page
    const { photos: page1, total } = await getPhotosPaginated(0, PAGE_SIZE);
    console.log(`Page 1: ${page1.length} photos out of ${total} total`);

    // Get second page
    const { photos: page2 } = await getPhotosPaginated(1, PAGE_SIZE);
    console.log(`Page 2: ${page2.length} photos`);

    // Get last page
    const lastPageIndex = Math.ceil(total / PAGE_SIZE) - 1;
    const { photos: lastPage } = await getPhotosPaginated(
      lastPageIndex,
      PAGE_SIZE
    );
    console.log(`Last page: ${lastPage.length} photos`);
  } catch (error) {
    console.error('Pagination failed:', error);
  }
}
```

### Example 3: Favorites Database Operations

```typescript
import {
  addFavorite,
  removeFavorite,
  getAllFavorites,
  isFavorite,
  getFavoriteCount,
} from '@/lib/db';

// Add to favorites
async function addToFavoritesExample() {
  try {
    const favoriteId = await addFavorite(42);
    console.log(`Added to favorites with ID: ${favoriteId}`);
  } catch (error) {
    console.error('Failed to add favorite:', error);
  }
}

// Remove from favorites
async function removeFromFavoritesExample() {
  try {
    await removeFavorite(42);
    console.log('Removed from favorites');
  } catch (error) {
    console.error('Failed to remove favorite:', error);
  }
}

// Get all favorites
async function getAllFavoritesExample() {
  try {
    const favorites = await getAllFavorites();
    console.log(`You have ${favorites.length} favorite photos`);

    favorites.forEach((photo) => {
      console.log(`- ${photo.title}`);
    });
  } catch (error) {
    console.error('Failed to get favorites:', error);
  }
}

// Check if photo is favorite
async function checkFavoriteExample() {
  try {
    const isFav = await isFavorite(42);
    console.log(`Photo 42 is ${isFav ? '' : 'not '}in favorites`);
  } catch (error) {
    console.error('Failed to check favorite:', error);
  }
}

// Get favorite count
async function getFavoriteCountExample() {
  try {
    const count = await getFavoriteCount();
    console.log(`Total favorites: ${count}`);
  } catch (error) {
    console.error('Failed to get favorite count:', error);
  }
}
```

---

## Component Integration

### Example 1: Complete Photo Browser

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import SearchBar from '@/components/SearchBar';
import PhotoList from '@/components/PhotoList';
import PhotoDetail from '@/components/PhotoDetail';
import FavoritesBar from '@/components/FavoritesBar';
import { useCallback, useEffect } from 'react';

export default function PhotoBrowser() {
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

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(
    async (photoId: number) => {
      await toggleFavorite(photoId);
      await loadFavorites();
    },
    [toggleFavorite, loadFavorites]
  );

  // Handle photo deletion
  const handleDeletePhoto = useCallback(
    async (photoId: number) => {
      await deletePhotoItem(photoId);
      await loadFavorites();
    },
    [deletePhotoItem, loadFavorites]
  );

  return (
    <div className="flex h-screen">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b p-4">
          <h1 className="text-3xl font-bold mb-4">Photo Browser</h1>
          <SearchBar
            onSearch={searchPhotos}
            onReset={resetSearch}
            initialQuery={searchQuery}
            isLoading={appState.isLoading}
          />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4">
          {appState.isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading photos...</p>
            </div>
          ) : appState.error ? (
            <div className="text-red-600">Error: {appState.error}</div>
          ) : (
            <PhotoList
              photos={photos}
              favoriteIds={favoriteIds}
              onSelectPhoto={selectPhoto}
              onDeletePhoto={handleDeletePhoto}
              onToggleFavorite={handleToggleFavorite}
              onLoadMore={loadMorePhotos}
              hasMore={pagination.hasMore}
              isLoading={appState.isLoading}
            />
          )}
        </main>
      </div>

      {/* Sidebar */}
      <aside className="w-80 border-l">
        <FavoritesBar
          favorites={favorites}
          onSelectPhoto={selectPhoto}
          onRemoveFavorite={handleToggleFavorite}
        />
      </aside>

      {/* Detail Modal */}
      <PhotoDetail
        photo={currentPhoto}
        isFavorite={currentPhoto ? favoriteIds.has(currentPhoto.id) : false}
        onClose={() => selectPhoto(0)}
        onDelete={handleDeletePhoto}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
```

### Example 2: Photo Grid with Infinite Scroll

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import PhotoItem from '@/components/PhotoItem';
import { useEffect, useRef, useCallback } from 'react';

export default function InfinitePhotoGrid() {
  const {
    photos,
    favoriteIds,
    appState,
    pagination,
    selectPhoto,
    deletePhotoItem,
    toggleFavorite,
    loadMorePhotos,
  } = usePhotos();

  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore) {
          loadMorePhotos();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [pagination.hasMore, loadMorePhotos]);

  if (appState.isLoading) {
    return <div>Loading photos...</div>;
  }

  return (
    <div>
      {/* Photo grid */}
      <div className="grid grid-cols-4 gap-4">
        {photos.map((photo) => (
          <PhotoItem
            key={photo.id}
            photo={photo}
            isFavorite={favoriteIds.has(photo.id)}
            onSelect={selectPhoto}
            onDelete={deletePhotoItem}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="py-4 text-center">
        {pagination.hasMore ? (
          <p>Loading more photos...</p>
        ) : (
          <p>All photos loaded!</p>
        )}
      </div>
    </div>
  );
}
```

---

## Advanced Patterns

### Example 1: Custom Hook for Photo Management

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import { useCallback, useState } from 'react';

/**
 * Custom hook for advanced photo management
 */
export function usePhotoManager() {
  const {
    photos,
    currentPhoto,
    favorites,
    favoriteIds,
    appState,
    pagination,
    selectPhoto,
    deletePhotoItem,
    toggleFavorite,
    loadMorePhotos,
    searchPhotos,
    loadFavorites,
  } = usePhotos();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Bulk delete
  const bulkDelete = useCallback(async () => {
    for (const id of selectedIds) {
      await deletePhotoItem(id);
    }
    setSelectedIds(new Set());
  }, [selectedIds, deletePhotoItem]);

  // Bulk favorite
  const bulkFavorite = useCallback(async () => {
    for (const id of selectedIds) {
      await toggleFavorite(id);
    }
    await loadFavorites();
  }, [selectedIds, toggleFavorite, loadFavorites]);

  // Toggle selection
  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(photos.map((p) => p.id)));
  }, [photos]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    photos,
    currentPhoto,
    favorites,
    favoriteIds,
    appState,
    pagination,
    selectedIds,
    selectPhoto,
    deletePhotoItem,
    toggleFavorite,
    loadMorePhotos,
    searchPhotos,
    loadFavorites,
    bulkDelete,
    bulkFavorite,
    toggleSelection,
    selectAll,
    clearSelection,
  };
}

// Usage
export default function AdvancedPhotoManager() {
  const {
    photos,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkDelete,
    bulkFavorite,
  } = usePhotoManager();

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={selectAll}>Select All</button>
        <button onClick={clearSelection}>Clear Selection</button>
        <button onClick={bulkFavorite} disabled={selectedIds.size === 0}>
          Add {selectedIds.size} to Favorites
        </button>
        <button onClick={bulkDelete} disabled={selectedIds.size === 0}>
          Delete {selectedIds.size}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => toggleSelection(photo.id)}
            className={`cursor-pointer border-2 ${
              selectedIds.has(photo.id)
                ? 'border-blue-500'
                : 'border-transparent'
            }`}
          >
            <img src={photo.thumbnailUrl} alt={photo.title} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 2: Photo Statistics

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import { useEffect, useState } from 'react';
import { getPhotoCount, getFavoriteCount } from '@/lib/db';

export function usePhotoStats() {
  const { photos, favorites } = usePhotos();
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalFavorites: 0,
    displayedPhotos: 0,
    favoritesPercentage: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const total = await getPhotoCount();
      const favCount = await getFavoriteCount();

      setStats({
        totalPhotos: total,
        totalFavorites: favCount,
        displayedPhotos: photos.length,
        favoritesPercentage:
          total > 0 ? Math.round((favCount / total) * 100) : 0,
      });
    };

    loadStats();
  }, [photos]);

  return stats;
}

// Usage
export default function PhotoStats() {
  const stats = usePhotoStats();

  return (
    <div className="grid grid-cols-4 gap-4">
      <div>
        <h3>Total Photos</h3>
        <p className="text-2xl font-bold">{stats.totalPhotos}</p>
      </div>
      <div>
        <h3>Favorites</h3>
        <p className="text-2xl font-bold">{stats.totalFavorites}</p>
      </div>
      <div>
        <h3>Displayed</h3>
        <p className="text-2xl font-bold">{stats.displayedPhotos}</p>
      </div>
      <div>
        <h3>Favorite %</h3>
        <p className="text-2xl font-bold">{stats.favoritesPercentage}%</p>
      </div>
    </div>
  );
}
```

---

## Error Handling

### Example 1: Comprehensive Error Handling

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export default function ErrorHandlingExample() {
  const { appState, photos } = usePhotos();

  // Initialization error
  if (appState.error && !appState.isInitialized) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Failed to initialize:</strong> {appState.error}
        </AlertDescription>
      </Alert>
    );
  }

  // Operation error
  if (appState.error && appState.isInitialized) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Operation failed:</strong> {appState.error}
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state
  if (appState.isLoading && !appState.isInitialized) {
    return <div>Initializing database...</div>;
  }

  // Success state
  return (
    <div>
      <h1>Photos ({photos.length})</h1>
      {/* Display photos */}
    </div>
  );
}
```

### Example 2: Try-Catch Pattern

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import { useState } from 'react';

export default function SafePhotoOperations() {
  const { selectPhoto, toggleFavorite, deletePhotoItem } = usePhotos();
  const [error, setError] = useState<string | null>(null);

  const handleSelectPhoto = async (id: number) => {
    try {
      setError(null);
      await selectPhoto(id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to select photo';
      setError(message);
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      setError(null);
      await toggleFavorite(id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update favorite';
      setError(message);
    }
  };

  const handleDeletePhoto = async (id: number) => {
    try {
      setError(null);
      if (confirm('Are you sure?')) {
        await deletePhotoItem(id);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete photo';
      setError(message);
    }
  };

  return (
    <div>
      {error && <div className="text-red-600">Error: {error}</div>}
      {/* UI with handlers */}
    </div>
  );
}
```

---

## Performance Tips

### Example 1: Debounced Search

```typescript
import { usePhotos } from '@/hooks/usePhotos';
import { useState, useCallback, useRef } from 'react';

export default function DebouncedSearch() {
  const { searchPhotos } = usePhotos();
  const [query, setQuery] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout>();

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      // Clear previous timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Debounce search by 300ms
      debounceTimer.current = setTimeout(() => {
        searchPhotos(value);
      }, 300);
    },
    [searchPhotos]
  );

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search photos..."
    />
  );
}
```

### Example 2: Memoized Components

```typescript
import { memo } from 'react';
import { Photo } from '@/types';

// Memoized photo item to prevent unnecessary re-renders
const MemoizedPhotoItem = memo(function PhotoItem({
  photo,
  onSelect,
}: {
  photo: Photo;
  onSelect: (id: number) => void;
}) {
  return (
    <div onClick={() => onSelect(photo.id)}>
      <img src={photo.thumbnailUrl} alt={photo.title} />
      <h3>{photo.title}</h3>
    </div>
  );
});

export default MemoizedPhotoItem;
```

---

This guide covers the most common use cases and patterns. For more advanced scenarios, refer to the main DOCUMENTATION.md file.
