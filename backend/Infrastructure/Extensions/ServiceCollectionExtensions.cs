using PortfolioApi.Application.Interfaces;
using PortfolioApi.Application.UseCases;
using PortfolioApi.Domain.Interfaces;
using PortfolioApi.Infrastructure.Email;
using PortfolioApi.Infrastructure.Security;

namespace PortfolioApi.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddSingleton<IEmailTemplateRenderer, EmailTemplateRenderer>();
        services.AddSingleton<IRateLimiter>(new InMemoryRateLimiter(maxRequests: 3, window: TimeSpan.FromMinutes(15)));
        return services;
    }

    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<SendContactMessageUseCase>();
        return services;
    }
}
