namespace PortfolioApi.Domain.Interfaces;

public interface IEmailSender
{
    Task<bool> SendAsync(string to, string subject, string htmlBody, string? replyTo = null);
}
