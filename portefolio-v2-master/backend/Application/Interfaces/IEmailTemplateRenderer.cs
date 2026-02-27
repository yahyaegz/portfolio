namespace PortfolioApi.Application.Interfaces;

public interface IEmailTemplateRenderer
{
    string RenderContactNotification(string name, string email, string message, string? subject);
    string RenderContactConfirmation(string name);
}
