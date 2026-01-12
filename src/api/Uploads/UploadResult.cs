namespace YigisoftCorporateCMS.Api.Uploads;

/// <summary>
/// Result of a successful file upload.
/// </summary>
public sealed record UploadResult(
    string Url,
    string FileName,
    string OriginalFileName,
    string StoragePath,
    string ContentType,
    long Size,
    string? ThumbnailStoragePath = null,
    string? ThumbnailUrl = null,
    int? Width = null,
    int? Height = null
);

/// <summary>
/// Result of upload validation or operation.
/// </summary>
public sealed class UploadOperationResult
{
    public bool IsSuccess { get; private init; }
    public UploadResult? Data { get; private init; }
    public List<string>? Errors { get; private init; }
    public bool IsServerError { get; private init; }

    public static UploadOperationResult Success(UploadResult data) => new()
    {
        IsSuccess = true,
        Data = data
    };

    public static UploadOperationResult ValidationError(List<string> errors) => new()
    {
        IsSuccess = false,
        Errors = errors,
        IsServerError = false
    };

    public static UploadOperationResult ServerError() => new()
    {
        IsSuccess = false,
        IsServerError = true
    };
}
