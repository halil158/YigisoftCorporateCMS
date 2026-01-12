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

    /// <summary>
    /// Thumbnail storage path (relative), e.g., "thumbs/{id}.webp". Null for non-images.
    /// </summary>
    public string? ThumbnailStoragePath { get; set; }

    /// <summary>
    /// Public URL for the thumbnail. Null for non-images.
    /// </summary>
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Image width in pixels. Null for non-images.
    /// </summary>
    public int? Width { get; set; }

    /// <summary>
    /// Image height in pixels. Null for non-images.
    /// </summary>
    public int? Height { get; set; }

    public UserEntity? UploadedByUser { get; set; }
}
