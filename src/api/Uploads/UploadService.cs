using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Serilog;

namespace YigisoftCorporateCMS.Api.Uploads;

/// <summary>
/// Implementation of file upload operations.
/// </summary>
public sealed class UploadService : IUploadService
{
    private readonly UploadOptions _options;
    private readonly IImageProcessingService _imageProcessing;

    public UploadService(IOptions<UploadOptions> options, IImageProcessingService imageProcessing)
    {
        _options = options.Value;
        _imageProcessing = imageProcessing;
    }

    public async Task<UploadOperationResult> UploadAsync(Guid uploadId, IFormFile? file, CancellationToken cancellationToken = default)
    {
        // Validate file is provided
        if (file is null || file.Length == 0)
        {
            return UploadOperationResult.ValidationError(
                ["File is required and must not be empty"]);
        }

        // Validate file size
        if (file.Length > _options.MaxFileSizeBytes)
        {
            return UploadOperationResult.ValidationError(
                [$"File size exceeds maximum allowed size of {_options.MaxFileSizeBytes / (1024 * 1024)} MB"]);
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;
        if (string.IsNullOrEmpty(extension) || !_options.AllowedExtensions.Contains(extension))
        {
            var allowed = string.Join(", ", _options.AllowedExtensions.Order());
            return UploadOperationResult.ValidationError(
                [$"File type '{extension}' is not allowed. Allowed types: {allowed}"]);
        }

        try
        {
            // Generate safe filename and path
            var now = DateTime.UtcNow;
            var relativePath = $"{now:yyyy}/{now:MM}";
            var directory = Path.Combine(_options.BaseUploadPath, relativePath);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var fullPath = Path.Combine(directory, fileName);

            // Ensure directory exists
            Directory.CreateDirectory(directory);

            // Save file
            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var storagePath = $"{relativePath}/{fileName}";
            var publicUrl = $"{_options.PublicBaseUrl}/{storagePath}";

            Log.Information("File uploaded: {FilePath} ({Size} bytes)", publicUrl, file.Length);

            // Process image (resize + thumbnail) if applicable
            string? thumbnailStoragePath = null;
            string? thumbnailUrl = null;
            int? width = null;
            int? height = null;

            if (_imageProcessing.IsProcessableImage(file.ContentType))
            {
                var imageResult = await _imageProcessing.ProcessAsync(
                    uploadId, fullPath, file.ContentType, cancellationToken);

                if (imageResult is not null)
                {
                    thumbnailStoragePath = imageResult.ThumbnailStoragePath;
                    thumbnailUrl = imageResult.ThumbnailUrl;
                    width = imageResult.Width;
                    height = imageResult.Height;
                }
            }

            return UploadOperationResult.Success(new UploadResult(
                Url: publicUrl,
                FileName: fileName,
                OriginalFileName: file.FileName,
                StoragePath: storagePath,
                ContentType: file.ContentType,
                Size: file.Length,
                ThumbnailStoragePath: thumbnailStoragePath,
                ThumbnailUrl: thumbnailUrl,
                Width: width,
                Height: height
            ));
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to upload file");
            return UploadOperationResult.ServerError();
        }
    }
}
