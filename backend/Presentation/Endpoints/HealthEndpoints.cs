namespace PortfolioApi.Presentation.Endpoints;

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this WebApplication app)
    {
        app.MapGet("/api/health", () => Results.Ok(new
        {
            success = true,
            status = "OK",
            timestamp = DateTime.UtcNow
        }))
        .WithName("Health")
        .WithTags("Health");
    }
}
