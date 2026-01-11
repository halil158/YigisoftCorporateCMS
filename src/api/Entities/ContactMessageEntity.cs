namespace YigisoftCorporateCMS.Api.Entities;

public class ContactMessageEntity
{
    public Guid Id { get; set; }
    public string PageSlug { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string Fields { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
    public string? Ip { get; set; }
    public string? UserAgent { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
