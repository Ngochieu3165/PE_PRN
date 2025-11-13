using Backend.Configuration;
using Backend.DTOs;
using Backend.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Backend.Services;

public interface IMovieService
{
    Task<List<MovieResponseDto>> GetAllMoviesAsync(string? searchTerm = null, string? genre = null, string? sortOrder = null);
    Task<MovieResponseDto?> GetMovieByIdAsync(string id);
    Task<MovieResponseDto> CreateMovieAsync(CreateMovieDto createMovieDto);
    Task<MovieResponseDto?> UpdateMovieAsync(string id, UpdateMovieDto updateMovieDto);
    Task<bool> DeleteMovieAsync(string id);
}

public class MovieService : IMovieService
{
    private readonly IMongoCollection<Movie> _movies;
    private readonly IAzureStorageService _storageService;

    public MovieService(IOptions<MongoSettings> mongoSettings, IAzureStorageService storageService)
    {
        var client = new MongoClient(mongoSettings.Value.ConnectionString);
        var database = client.GetDatabase(mongoSettings.Value.Database);
        _movies = database.GetCollection<Movie>("movies");
        _storageService = storageService;
    }

    public async Task<List<MovieResponseDto>> GetAllMoviesAsync(string? searchTerm = null, string? genre = null, string? sortOrder = null)
    {
        var filterBuilder = Builders<Movie>.Filter;
        var filter = filterBuilder.Empty;

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            filter &= filterBuilder.Regex("Name", new MongoDB.Bson.BsonRegularExpression(searchTerm, "i"));
        }

        if (!string.IsNullOrWhiteSpace(genre))
        {
            filter &= filterBuilder.Eq("Genre", genre);
        }

        var query = _movies.Find(filter);

        // Apply sorting
        if (!string.IsNullOrWhiteSpace(sortOrder))
        {
            query = sortOrder.ToLower() switch
            {
                "name_asc" => query.SortBy(p => p.Name),
                "name_desc" => query.SortByDescending(p => p.Name),
                "rating_asc" => query.SortBy(p => p.Rating),
                "rating_desc" => query.SortByDescending(p => p.Rating),
                _ => query.SortByDescending(p => p.CreatedAt)
            };
        }
        else
        {
            query = query.SortByDescending(p => p.CreatedAt);
        }

        var movies = await query.ToListAsync();

        return movies.Select(m => new MovieResponseDto
        {
            Id = m.Id!,
            Name = m.Name,
            Description = m.Description,
            Genre = m.Genre,
            Rating = m.Rating,
            ImageUrl = m.ImageUrl,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt
        }).ToList();
    }

    public async Task<MovieResponseDto?> GetMovieByIdAsync(string id)
    {
        var movie = await _movies.Find(m => m.Id == id).FirstOrDefaultAsync();
        if (movie == null) return null;

        return new MovieResponseDto
        {
            Id = movie.Id!,
            Name = movie.Name,
            Description = movie.Description,
            Genre = movie.Genre,
            Rating = movie.Rating,
            ImageUrl = movie.ImageUrl,
            CreatedAt = movie.CreatedAt,
            UpdatedAt = movie.UpdatedAt
        };
    }

    public async Task<MovieResponseDto> CreateMovieAsync(CreateMovieDto createMovieDto)
    {
        // Check for duplicate name (case-insensitive)
        var existingMovie = await _movies.Find(p => p.Name.ToLower() == createMovieDto.Name.ToLower()).FirstOrDefaultAsync();
        if (existingMovie != null)
        {
            throw new InvalidOperationException($"A movie with the name '{createMovieDto.Name}' already exists.");
        }

        string? imageUrl = null;

        // Handle image upload
        if (createMovieDto.Image != null)
        {
            imageUrl = await _storageService.UploadFileAsync(createMovieDto.Image);
        }
        else if (!string.IsNullOrWhiteSpace(createMovieDto.ImageUrl))
        {
            imageUrl = createMovieDto.ImageUrl;
        }

        var movie = new Movie
        {
            Name = createMovieDto.Name,
            Description = createMovieDto.Description,
            Genre = createMovieDto.Genre,
            Rating = createMovieDto.Rating,
            ImageUrl = imageUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _movies.InsertOneAsync(movie);

        return new MovieResponseDto
        {
            Id = movie.Id!,
            Name = movie.Name,
            Description = movie.Description,
            Genre = movie.Genre,
            Rating = movie.Rating,
            ImageUrl = movie.ImageUrl,
            CreatedAt = movie.CreatedAt,
            UpdatedAt = movie.UpdatedAt
        };
    }

    public async Task<MovieResponseDto?> UpdateMovieAsync(string id, UpdateMovieDto updateMovieDto)
    {
        var existingMovie = await _movies.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (existingMovie == null) return null;

        // Check for duplicate name (case-insensitive, excluding current post)
        var duplicateMovie = await _movies.Find(p => 
            p.Id != id && 
            p.Name.ToLower() == updateMovieDto.Name.ToLower()
        ).FirstOrDefaultAsync();
        
        if (duplicateMovie != null)
        {
            throw new InvalidOperationException($"A movie with the name '{updateMovieDto.Name}' already exists.");
        }

        string? imageUrl = existingMovie.ImageUrl;

        // Handle image update
        if (updateMovieDto.Image != null)
        {
            // Delete old image if exists
            if (!string.IsNullOrEmpty(existingMovie.ImageUrl))
            {
                await _storageService.DeleteFileAsync(existingMovie.ImageUrl);
            }
            imageUrl = await _storageService.UploadFileAsync(updateMovieDto.Image);
        }
        else if (!string.IsNullOrWhiteSpace(updateMovieDto.ImageUrl) && updateMovieDto.ImageUrl != existingMovie.ImageUrl)
        {
            // Delete old image if switching to URL
            if (!string.IsNullOrEmpty(existingMovie.ImageUrl))
            {
                await _storageService.DeleteFileAsync(existingMovie.ImageUrl);
            }
            imageUrl = updateMovieDto.ImageUrl;
        }

        existingMovie.Name = updateMovieDto.Name;
        existingMovie.Description = updateMovieDto.Description;
        existingMovie.Genre = updateMovieDto.Genre;
        existingMovie.Rating = updateMovieDto.Rating;
        existingMovie.ImageUrl = imageUrl;
        existingMovie.UpdatedAt = DateTime.UtcNow;

        await _movies.ReplaceOneAsync(p => p.Id == id, existingMovie);
        return new MovieResponseDto
        {
            Id = existingMovie.Id!,
            Name = existingMovie.Name,
            Description = existingMovie.Description,
            Genre = existingMovie.Genre,
            Rating = existingMovie.Rating,
            ImageUrl = existingMovie.ImageUrl,
            CreatedAt = existingMovie.CreatedAt,
            UpdatedAt = existingMovie.UpdatedAt
        };
    }

    public async Task<bool> DeleteMovieAsync(string id)
    {
        var movie = await _movies.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (movie == null) return false;

        // Delete image if exists
        if (!string.IsNullOrEmpty(movie.ImageUrl))
        {
            await _storageService.DeleteFileAsync(movie.ImageUrl);
        }

        var result = await _movies.DeleteOneAsync(p => p.Id == id);
        return result.DeletedCount > 0;
    }
}
