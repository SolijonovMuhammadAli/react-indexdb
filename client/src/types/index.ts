export interface Photo {
  id: number;
  albumId: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

export interface Favorite {
  id: number;
  photoId: number;
  addedAt: number;
}