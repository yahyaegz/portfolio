namespace PortfolioApi.Domain.Interfaces;

public interface IRateLimiter
{
    bool IsRateLimited(string key);
}
