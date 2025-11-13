using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreateMovieDto
{
    [Required(ErrorMessage = "Name is required")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    [StringLength(2000, ErrorMessage = "Description cannot be longer than 2000 characters")]
    public string Description { get; set; } = string.Empty;

    public string? Genre { get; set; }

    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int? Rating { get; set; }

    public IFormFile? Image { get; set; }

    public string? ImageUrl { get; set; }
}

public class UpdateMovieDto
{
    [Required(ErrorMessage = "Name is required")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    [StringLength(2000, ErrorMessage = "Description cannot be longer than 2000 characters")]
    public string Description { get; set; } = string.Empty;

    public string? Genre { get; set; }

    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int? Rating { get; set; }

    public IFormFile? Image { get; set; }

    public string? ImageUrl { get; set; }
}

public class MovieResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Genre { get; set; }
    public int? Rating { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
