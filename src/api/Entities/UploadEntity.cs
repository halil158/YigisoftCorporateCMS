namespace YigisoftCorporateCMS.Api.Entities;

public class UploadEntity
{
    public Guid Id { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? UploadedByUserId { get; set; }

    public UserEntity? UploadedByUser { get; set; }
}
