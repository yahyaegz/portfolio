namespace PortfolioApi.Presentation.Middleware;

public sealed class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";
        headers["X-XSS-Protection"] = "0";
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";
        headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';";
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        headers["Cache-Control"] = "no-store";
        headers["Pragma"] = "no-cache";
        headers.Remove("Server");
        headers.Remove("X-Powered-By");

        await _next(context);
    }
}
