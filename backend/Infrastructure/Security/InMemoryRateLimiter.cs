using System.Collections.Concurrent;
using PortfolioApi.Domain.Interfaces;

namespace PortfolioApi.Infrastructure.Security;

public sealed class InMemoryRateLimiter : IRateLimiter
{
    private readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _store = new();
    private readonly int _maxRequests;
    private readonly TimeSpan _window;

    public InMemoryRateLimiter(int maxRequests = 3, TimeSpan? window = null)
    {
        _maxRequests = maxRequests;
        _window = window ?? TimeSpan.FromMinutes(15);
    }

    public bool IsRateLimited(string key)
    {
        var now = DateTime.UtcNow;
        var entry = _store.GetOrAdd(key, _ => (0, now));

        if (now - entry.WindowStart > _window)
        {
            _store[key] = (1, now);
            return false;
        }

        if (entry.Count >= _maxRequests)
            return true;

        _store[key] = (entry.Count + 1, entry.WindowStart);
        return false;
    }
}

