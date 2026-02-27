using PortfolioApi.Application.Common;
using PortfolioApi.Application.DTOs;
using PortfolioApi.Application.Interfaces;
using PortfolioApi.Domain.Entities;
using PortfolioApi.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PortfolioApi.Application.UseCases;

public sealed class SendContactMessageUseCase
{
    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _templateRenderer;
    private readonly IConfiguration _config;
    private readonly ILogger<SendContactMessageUseCase> _logger;

    public SendContactMessageUseCase(
        IEmailSender emailSender,
        IEmailTemplateRenderer templateRenderer,
        IConfiguration config,
        ILogger<SendContactMessageUseCase> logger)
    {
        _emailSender = emailSender;
        _templateRenderer = templateRenderer;
        _config = config;
        _logger = logger;
    }

    public record Result(bool Success, string Message, ContactResultDto? Data, int StatusCode = 201);

    public async Task<Result> ExecuteAsync(ContactRequestDto request)
    {
        if (!string.IsNullOrEmpty(request.Website))
        {
            _logger.LogWarning("🤖 Bot detected (honeypot filled)");
            return new Result(true, "Message sent successfully!", new ContactResultDto { Id = 0, Status = "received" });
        }

        var name = InputSanitizer.Sanitize(request.Name);
        var email = request.Email.Trim().ToLowerInvariant();
        var subject = InputSanitizer.Sanitize(request.Subject ?? "");
        var message = InputSanitizer.Sanitize(request.Message);

        var contactMessage = new ContactMessage(name, email, message, subject);
        _logger.LogInformation("📧 Contact message {Id} received", contactMessage.Id);

        var ownerEmail = _config["ContactEmail"]
                      ?? _config["Smtp:User"]
                      ?? "yahyaegz@gmail.com";

        _ = Task.Run(async () =>
        {
            try
            {
                var notificationHtml = _templateRenderer.RenderContactNotification(name, email, message, subject);
                await _emailSender.SendAsync(ownerEmail, $"New Portfolio Contact: {subject}", notificationHtml, email);
                contactMessage.MarkAsSent();
            }
            catch (Exception ex)
            {
                contactMessage.MarkAsFailed();
                _logger.LogWarning("⚠️ Owner email failed: {Msg}", ex.Message);
            }

            try
            {
                var confirmationHtml = _templateRenderer.RenderContactConfirmation(name);
                await _emailSender.SendAsync(email, "Thank you for contacting me!", confirmationHtml);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("⚠️ Confirmation email failed: {Msg}", ex.Message);
            }
        });

        return new Result(
            true,
            "Message sent successfully! I'll get back to you soon.",
            new ContactResultDto { Id = contactMessage.Id, Status = contactMessage.Status.ToString().ToLowerInvariant() }
        );
    }
}
