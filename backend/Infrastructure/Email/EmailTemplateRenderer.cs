using PortfolioApi.Application.Interfaces;

namespace PortfolioApi.Infrastructure.Email;

public sealed class EmailTemplateRenderer : IEmailTemplateRenderer
{
    public string RenderContactNotification(string name, string email, string message, string? subject)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .field {{ margin: 15px 0; }}
        .label {{ font-weight: bold; color: #10b981; }}
        .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2>New Contact Form Submission</h2>
        </div>
        <div class=""content"">
            <div class=""field"">
                <span class=""label"">Name:</span><br>{name}
            </div>
            <div class=""field"">
                <span class=""label"">Email:</span><br><a href=""mailto:{email}"">{email}</a>
            </div>
            <div class=""field"">
                <span class=""label"">Subject:</span><br>{subject ?? "(No subject)"}
            </div>
            <div class=""field"">
                <span class=""label"">Message:</span><br><p>{message.Replace("\n", "<br>")}</p>
            </div>
            <div class=""footer"">
                <p>This message was sent from your portfolio contact form.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    public string RenderContactConfirmation(string name)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2>Thank You for Reaching Out!</h2>
        </div>
        <div class=""content"">
            <p>Hi {name},</p>
            <p>Thanks for contacting me! I've received your message and will get back to you as soon as possible.</p>
            <p>In the meantime, feel free to check out my:</p>
            <ul>
                <li><a href=""https://www.linkedin.com/in/yahya-el-gzouli-99536b331"">LinkedIn Profile</a></li>
                <li><a href=""https://github.com/yahyaegz"">GitHub Repository</a></li>
            </ul>
            <p>Best regards,<br>Yahya El Gzouli</p>
            <div class=""footer"">
                <p>This is an automated response. Please don't reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }
}
