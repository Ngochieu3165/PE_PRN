import { Movie, CreateMovieDto, UpdateMovieDto } from '@/types/movie';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export const movieApi = {
  async getAll(search?: string, sort?: string, genre?: string): Promise<Movie[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    if (genre) params.append('genre', genre);
    
    const url = `${API_BASE}/movies${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch movies');
    }
    
    return response.json();
  },

  async getById(id: string): Promise<Movie> {
    const response = await fetch(`${API_BASE}/movies/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch movie');
    }
    
    return response.json();
  },

  async create(data: CreateMovieDto): Promise<Movie> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    if (data.genre) formData.append('genre', data.genre);
    if (data.rating) formData.append('rating', data.rating.toString());
    
    if (data.image) {
      formData.append('image', data.image);
    } else if (data.imageUrl) {
      formData.append('imageUrl', data.imageUrl);
    }
    
    const response = await fetch(`${API_BASE}/movies`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create movie');
    }
    
    return response.json();
  },

  async update(id: string, data: UpdateMovieDto): Promise<Movie> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    if (data.genre) formData.append('genre', data.genre);
    if (data.rating) formData.append('rating', data.rating.toString());
    
    if (data.image) {
      formData.append('image', data.image);
    } else if (data.imageUrl) {
      formData.append('imageUrl', data.imageUrl);
    }
    
    const response = await fetch(`${API_BASE}/movies/${id}`, {
      method: 'PUT',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update movie');
    }
    
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/movies/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete movie');
    }
  },
};
