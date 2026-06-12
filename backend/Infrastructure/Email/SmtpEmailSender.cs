using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using PortfolioApi.Domain.Interfaces;

namespace PortfolioApi.Infrastructure.Email;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailSender> _logger;
    private readonly bool _isConfigured;

    public SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger)
    {
        _config = config;
        _logger = logger;
        _isConfigured = !string.IsNullOrEmpty(_config["Smtp:User"])
                     && !string.IsNullOrEmpty(_config["Smtp:Pass"]);

        if (_isConfigured)
            _logger.LogInformation("✅ SMTP email sender initialized ({Host}:{Port})", _config["Smtp:Host"], _config["Smtp:Port"]);
        else
            _logger.LogWarning("⚠️ SMTP not configured — running in demo mode");
    }

    public async Task<bool> SendAsync(string to, string subject, string htmlBody, string? replyTo = null)
    {
        if (!_isConfigured)
        {
            _logger.LogInformation("📧 [DEMO] Would send to: {To}, subject: {Subject}", to, subject);
            return true;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_config["Smtp:User"]));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            if (!string.IsNullOrEmpty(replyTo))
                message.ReplyTo.Add(MailboxAddress.Parse(replyTo));

            message.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            var host = _config["Smtp:Host"] ?? "smtp.gmail.com";
            var port = int.Parse(_config["Smtp:Port"] ?? "587");
            var security = port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;

            await client.ConnectAsync(host, port, security);
            await client.AuthenticateAsync(_config["Smtp:User"], _config["Smtp:Pass"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("✅ Email sent to {To}", to);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("⚠️ Email send failed: {Message}", ex.Message);
            return false;
        }
    }
}
