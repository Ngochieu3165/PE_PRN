using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/movies")]
public class MovieController : ControllerBase
{
    private readonly IMovieService _movieService;
    private readonly ILogger<MovieController> _logger;

    public MovieController(IMovieService movieService, ILogger<MovieController> logger)
    {
        _movieService = movieService;
        _logger = logger;
    }

    /// <summary>
    /// Get all movies with optional search and sort
    /// </summary>
    /// <param name="search">Search term for movie name</param>
    /// <param name="sort">Sort order: asc, desc, a-z, z-a</param>
    [HttpGet]
    public async Task<ActionResult<List<MovieResponseDto>>> GetAllMovies(
        [FromQuery] string? search = null,
        [FromQuery] string? sort = null)
    {
        try
        {
            var movies = await _movieService.GetAllMoviesAsync(search, sort);
            return Ok(movies);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting movies");
            return StatusCode(500, new { message = "Error retrieving movies", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a single movie by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<MovieResponseDto>> GetMovieById(string id)
    {
        try
        {
            var movie = await _movieService.GetMovieByIdAsync(id);
            if (movie == null)
            {
                return NotFound(new { message = "Movie not found" });
            }
            return Ok(movie);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting movie {MovieId}", id);
            return StatusCode(500, new { message = "Error retrieving movie", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new movie
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MovieResponseDto>> CreateMovie([FromForm] CreateMovieDto createMovieDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var movie = await _movieService.CreateMovieAsync(createMovieDto);
            return CreatedAtAction(nameof(GetMovieById), new { id = movie.Id }, movie);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating movie");
            return StatusCode(500, new { message = "Error creating movie", error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing movie
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<MovieResponseDto>> UpdateMovie(string id, [FromForm] UpdateMovieDto updateMovieDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var movie = await _movieService.UpdateMovieAsync(id, updateMovieDto);
            if (movie == null)
            {
                return NotFound(new { message = "Movie not found" });
            }

            return Ok(movie);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating movie {MovieId}", id);
            return StatusCode(500, new { message = "Error updating movie", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a movie
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteMovie(string id)
    {
        try
        {
            var result = await _movieService.DeleteMovieAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Movie not found" });
            }

            return Ok(new { message = "Movie deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting movie {MovieId}", id);
            return StatusCode(500, new { message = "Error deleting movie", error = ex.Message });
        }
    }
}
