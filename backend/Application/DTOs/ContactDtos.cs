using System.ComponentModel.DataAnnotations;

namespace PortfolioApi.Application.DTOs;

public sealed class ContactRequestDto
{
    [Required(ErrorMessage = "Name is required")]
    [MinLength(2, ErrorMessage = "Name must be at least 2 characters")]
    [MaxLength(100, ErrorMessage = "Name must be less than 100 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Valid email is required")]
    [EmailAddress(ErrorMessage = "Valid email is required")]
    [MaxLength(254, ErrorMessage = "Email must be less than 254 characters")]
    public string Email { get; set; } = string.Empty;

    [MaxLength(200, ErrorMessage = "Subject must be less than 200 characters")]
    public string? Subject { get; set; }

    [Required(ErrorMessage = "Message is required")]
    [MinLength(10, ErrorMessage = "Message must be at least 10 characters")]
    [MaxLength(5000, ErrorMessage = "Message must be less than 5000 characters")]
    public string Message { get; set; } = string.Empty;

    public string? Website { get; set; }
}

public sealed class ApiResponseDto<T>
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public T? Data { get; init; }

    public static ApiResponseDto<T> Ok(string message, T? data = default) =>
        new() { Success = true, Message = message, Data = data };

    public static ApiResponseDto<T> Fail(string message) =>
        new() { Success = false, Message = message };
}

public sealed class ContactResultDto
{
    public long Id { get; init; }
    public string Status { get; init; } = "received";
}
