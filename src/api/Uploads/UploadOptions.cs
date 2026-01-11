namespace YigisoftCorporateCMS.Api.Uploads;

/// <summary>
/// Configuration options for file uploads.
/// </summary>
public sealed class UploadOptions
{
    /// <summary>
    /// Maximum file size in bytes. Default: 10 MB.
    /// </summary>
    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;

    /// <summary>
    /// Allowed file extensions (lowercase, with leading dot).
    /// </summary>
    public HashSet<string> AllowedExtensions { get; set; } = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".webp", ".svg", ".pdf"
    };

    /// <summary>
    /// Base path on disk where uploads are stored. Default: /uploads
    /// </summary>
    public string BaseUploadPath { get; set; } = "/uploads";

    /// <summary>
    /// Base URL for public access to uploaded files. Default: /uploads
    /// </summary>
    public string PublicBaseUrl { get; set; } = "/uploads";
}
