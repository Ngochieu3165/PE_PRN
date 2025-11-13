'use client';

import { useState, useEffect } from 'react';
import { movieApi } from '@/lib/api';
import { Movie, UpdateMovieDto } from '@/types/movie';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingMovie, setViewingMovie] = useState<Movie | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    genre: '',
    rating: '',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const data = await movieApi.getAll(searchTerm, sortOrder, genreFilter);
      setMovies(data);
      setFilteredMovies(data);
      
      // Extract unique genres from all movies
      const uniqueGenres = Array.from(new Set(data.map(movie => movie.genre).filter((g): g is string => !!g)));
      setGenres(uniqueGenres);
      
      setError(null);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (err) {
      setError('Failed to load movies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [searchTerm, sortOrder, genreFilter]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMovies = filteredMovies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

  const resetForm = () => {
    setFormData({ name: '', description: '', genre: '', rating: '', imageUrl: '' });
    setImageFile(null);
    setImagePreview('');
    setFormError(null);
    setNameError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      name: movie.name,
      description: movie.description,
      genre: movie.genre || '',
      rating: movie.rating?.toString() || '',
      imageUrl: movie.imageUrl || '',
    });
    setImagePreview(movie.imageUrl || '');
    setImageFile(null);
    setFormError(null);
    setNameError('');
    setEditDialogOpen(true);
  };

  const handleOpenView = (movie: Movie) => {
    setViewingMovie(movie);
    setViewDialogOpen(true);
  };

  const checkNameDuplicate = (name: string, excludeId?: string) => {
    if (!name.trim()) {
      setNameError('');
      return false;
    }

    const isDuplicate = movies.some(movie => 
      movie.id !== excludeId && 
      movie.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    
    if (isDuplicate) {
      setNameError('A movie with this name already exists');
      return true;
    }
    
    setNameError('');
    return false;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData({ ...formData, imageUrl: '' });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      setFormError('Name and description are required');
      return;
    }

    if (checkNameDuplicate(formData.name)) {
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const createData: any = {
        name: formData.name,
        description: formData.description,
        genre: formData.genre || undefined,
        rating: formData.rating ? parseInt(formData.rating) : undefined,
      };

      if (imageFile) {
        createData.image = imageFile;
      } else if (formData.imageUrl) {
        createData.imageUrl = formData.imageUrl;
      }

      await movieApi.create(createData);
      setCreateDialogOpen(false);
      resetForm();
      fetchMovies();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create movie');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMovie) return;

    if (!formData.name || !formData.description) {
      setFormError('Name and description are required');
      return;
    }

    if (checkNameDuplicate(formData.name, editingMovie.id)) {
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const updateData: UpdateMovieDto = {
        name: formData.name,
        description: formData.description,
        genre: formData.genre || undefined,
        rating: formData.rating ? parseInt(formData.rating) : undefined,
      };

      if (imageFile) {
        updateData.image = imageFile;
      } else if (formData.imageUrl) {
        updateData.imageUrl = formData.imageUrl;
      }

      await movieApi.update(editingMovie.id, updateData);
      setEditDialogOpen(false);
      resetForm();
      setEditingMovie(null);
      fetchMovies();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update movie');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await movieApi.delete(id);
      setDeleteId(null);
      fetchMovies();
    } catch (err) {
      alert('Failed to delete movie');
      console.error(err);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl text-gray-900">
            <span className="font-bold">Movie</span> <span className="text-cyan-500">List</span>
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search, Sort, and Add in one row */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-w-[180px]"
          >
            <option value="">Filter by Genre</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-w-[160px]"
          >
            <option value="">Sort: A → Z</option>
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </select>

          <Button 
            onClick={handleOpenCreate}
            className="px-6 py-2.5 bg-transparent border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-50 font-medium"
          >
            Add Movie
          </Button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="mt-4 text-gray-600">Loading movies...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && movies.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-lg">No movies found</p>
            <Button 
              onClick={handleOpenCreate}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Add your first movie
            </Button>
          </div>
        )}

        {!loading && !error && movies.length > 0 && (
          <>
            {/* List View */}
            <div className="space-y-4 mb-8">
              {currentMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors shadow-sm"
                >
                  <div 
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() => handleOpenView(movie)}
                  >
                    {/* Image */}
                    {movie.imageUrl && (
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={movie.imageUrl}
                          alt={movie.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    {!movie.imageUrl && (
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-semibold text-gray-900 mb-1 break-words">
                            {movie.name}
                          </h2>
                          <p className="text-gray-600 text-sm line-clamp-2 break-words">
                            {movie.description}
                          </p>
                        </div>
                        <div className="text-right text-gray-500 text-xs whitespace-nowrap flex-shrink-0">
                          {new Date(movie.createdAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(movie);
                          }}
                          className="bg-transparent border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(movie.id);
                          }}
                          className="bg-transparent border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          onClick={() => handlePageChange(pageNumber)}
                          size="sm"
                          className={currentPage === pageNumber 
                            ? "bg-cyan-500 hover:bg-cyan-600 text-white" 
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}
                        >
                          {pageNumber}
                        </Button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <span key={pageNumber} className="px-2 py-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Next
                </Button>
              </div>
            )}

            {/* Results info */}
            <div className="mt-4 text-center text-sm text-slate-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredMovies.length)} of {filteredMovies.length} movies
            </div>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Confirm Delete</DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to delete this movie? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteId!)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create/Edit Dialog */}
        <Dialog 
          open={createDialogOpen || editDialogOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setCreateDialogOpen(false);
              setEditDialogOpen(false);
              setEditingMovie(null);
            }
          }}
        >
          <DialogContent className="bg-white border-gray-200 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{editingMovie ? 'Edit Movie' : 'Add New Movie'}</DialogTitle>
              <DialogDescription className="text-gray-500">
                {editingMovie ? 'Update the details of your movie.' : 'Fill in the details for the new movie.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingMovie ? handleEditSubmit : handleCreateSubmit} className="space-y-6 py-4">
              {formError && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        checkNameDuplicate(e.target.value, editingMovie?.id);
                      }}
                      onBlur={(e) => checkNameDuplicate(e.target.value, editingMovie?.id)}
                      className={`w-full px-3 py-2 bg-white border ${nameError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${nameError ? 'focus:ring-red-500' : 'focus:ring-cyan-500'}`}
                      required
                    />
                    {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                  </div>

                  <div>
                    <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">
                      Genre
                    </label>
                    <input
                      type="text"
                      id="genre"
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                      Rating (1-5)
                    </label>
                    <input
                      type="number"
                      id="rating"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      min="1"
                      max="5"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={8}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    ></textarea>
                  </div>
                </div>

                {/* Right Column: Image Upload */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Movie Image
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        {imagePreview ? (
                          <div className="relative w-full h-48 rounded-md overflow-hidden">
                            <Image
                              src={imagePreview}
                              alt="Image preview"
                              layout="fill"
                              objectFit="contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <>
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500"
                              >
                                <span>Upload a file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    {imagePreview && (
                      <Button variant="link" size="sm" className="text-red-500" onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}>
                        Remove image
                      </Button>
                    )}
                  </div>
                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Or Image URL
                    </label>
                    <input
                      type="text"
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value });
                        setImageFile(null);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setEditDialogOpen(false);
                  }}
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !!nameError}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white disabled:bg-cyan-300"
                >
                  {saving ? 'Saving...' : (editingMovie ? 'Save Changes' : 'Create Movie')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="bg-white border-gray-200 max-w-3xl">
            {viewingMovie && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900">{viewingMovie.name}</DialogTitle>
                  <DialogDescription className="text-gray-500 pt-2">
                    Created on {new Date(viewingMovie.createdAt).toLocaleDateString()}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    {viewingMovie.imageUrl ? (
                      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={viewingMovie.imageUrl}
                          alt={viewingMovie.name}
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[2/3] rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">Genre</h3>
                      <p className="text-gray-600">{viewingMovie.genre || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Rating</h3>
                      <p className="text-gray-600">{viewingMovie.rating ? `${viewingMovie.rating} / 5` : 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Description</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{viewingMovie.description}</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setViewDialogOpen(false)} className="bg-cyan-500 hover:bg-cyan-600 text-white">Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
