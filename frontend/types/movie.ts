export interface Movie {
  id: string;
  name: string;
  description: string;
  genre?: string;
  rating?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMovieDto {
  name: string;
  description: string;
  genre?: string;
  rating?: number;
  image?: File;
  imageUrl?: string;
}

export interface UpdateMovieDto {
  name: string;
  description: string;
  genre?: string;
  rating?: number;
  image?: File;
  imageUrl?: string;
}
