using PortfolioApi.Infrastructure.Extensions;
using PortfolioApi.Presentation.Endpoints;
using PortfolioApi.Presentation.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5174");
builder.WebHost.ConfigureKestrel(opts => opts.Limits.MaxRequestBodySize = 16 * 1024);

builder.Services.AddInfrastructure();
builder.Services.AddApplication();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var frontendUrl = builder.Configuration["FrontendUrl"] ?? "http://localhost:5173";
        policy.WithOrigins(frontendUrl, "http://localhost:5173", "http://localhost:4173")
              .WithHeaders("Content-Type", "Accept", "Origin")
              .WithMethods("GET", "POST", "OPTIONS")
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

var app = builder.Build();

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<ExceptionHandlerMiddleware>();
app.UseCors();

app.MapHealthEndpoints();
app.MapContactEndpoints();
app.MapFallback(() => Results.NotFound(new { success = false, message = "Route not found" }));

app.Run();
