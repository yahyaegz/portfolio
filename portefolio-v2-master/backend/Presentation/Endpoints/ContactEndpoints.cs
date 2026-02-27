using System.ComponentModel.DataAnnotations;
using PortfolioApi.Application.DTOs;
using PortfolioApi.Application.UseCases;
using PortfolioApi.Domain.Interfaces;

namespace PortfolioApi.Presentation.Endpoints;

public static class ContactEndpoints
{
    public static void MapContactEndpoints(this WebApplication app)
    {
        app.MapPost("/api/contact", HandleContact)
           .WithName("Contact")
           .WithTags("Contact");
    }

    private static async Task<IResult> HandleContact(
        ContactRequestDto request,
        SendContactMessageUseCase useCase,
        IRateLimiter rateLimiter,
        HttpContext httpContext)
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        if (rateLimiter.IsRateLimited(ip))
        {
            return Results.Json(
                ApiResponseDto<object>.Fail("Too many requests. Please try again later."),
                statusCode: 429
            );
        }

        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(request);
        if (!Validator.TryValidateObject(request, validationContext, validationResults, true))
        {
            var firstError = validationResults.FirstOrDefault()?.ErrorMessage ?? "Validation error";
            return Results.BadRequest(ApiResponseDto<object>.Fail(firstError));
        }

        var result = await useCase.ExecuteAsync(request);

        return Results.Created(
            $"/api/contact/{result.Data?.Id}",
            ApiResponseDto<ContactResultDto>.Ok(result.Message, result.Data)
        );
    }
}
