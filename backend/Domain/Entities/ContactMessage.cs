namespace PortfolioApi.Domain.Entities;

public sealed class ContactMessage
{
    public long Id { get; }
    public string Name { get; }
    public string Email { get; }
    public string? Subject { get; }
    public string Message { get; }
    public DateTime CreatedAtUtc { get; }
    public ContactMessageStatus Status { get; private set; }

    public ContactMessage(string name, string email, string message, string? subject = null)
    {
        Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Email = email ?? throw new ArgumentNullException(nameof(email));
        Message = message ?? throw new ArgumentNullException(nameof(message));
        Subject = subject;
        CreatedAtUtc = DateTime.UtcNow;
        Status = ContactMessageStatus.Received;
    }

    public void MarkAsSent() => Status = ContactMessageStatus.Sent;
    public void MarkAsFailed() => Status = ContactMessageStatus.Failed;
}

public enum ContactMessageStatus
{
    Received,
    Sent,
    Failed
}
