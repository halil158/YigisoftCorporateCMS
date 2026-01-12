using Microsoft.Extensions.Options;
using Serilog;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace YigisoftCorporateCMS.Api.Uploads;

/// <summary>
/// Result of image processing operation.
/// </summary>
public sealed record ImageProcessingResult(
    int Width,
    int Height,
    string ThumbnailStoragePath,
    string ThumbnailUrl
);

/// <summary>
/// Service for processing uploaded images (resize, thumbnail generation).
/// </summary>
public interface IImageProcessingService
{
    /// <summary>
    /// Checks if the content type is a raster image that can be processed.
    /// </summary>
    bool IsProcessableImage(string contentType);

    /// <summary>
    /// Processes an uploaded image: auto-orients, resizes main image, generates thumbnail.
    /// </summary>
    /// <param name="uploadId">The upload ID (used for thumbnail filename).</param>
    /// <param name="mainFilePath">Path to the main uploaded file.</param>
    /// <param name="contentType">Content type of the uploaded file.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Processing result with dimensions and thumbnail info, or null if not processable.</returns>
    Task<ImageProcessingResult?> ProcessAsync(
        Guid uploadId,
        string mainFilePath,
        string contentType,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Implementation of image processing using SixLabors.ImageSharp.
/// </summary>
public sealed class ImageProcessingService : IImageProcessingService
{
    private const int MaxMainDimension = 2000;
    private const int MaxThumbnailDimension = 320;
    private const string ThumbnailsFolder = "thumbs";

    private static readonly HashSet<string> ProcessableContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    private readonly UploadOptions _options;

    public ImageProcessingService(IOptions<UploadOptions> options)
    {
        _options = options.Value;
    }

    public bool IsProcessableImage(string contentType)
    {
        return ProcessableContentTypes.Contains(contentType);
    }

    public async Task<ImageProcessingResult?> ProcessAsync(
        Guid uploadId,
        string mainFilePath,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        if (!IsProcessableImage(contentType))
        {
            return null;
        }

        try
        {
            using var image = await Image.LoadAsync(mainFilePath, cancellationToken);

            // Auto-orient based on EXIF metadata
            image.Mutate(x => x.AutoOrient());

            var originalWidth = image.Width;
            var originalHeight = image.Height;

            // Resize main image if needed (max 2000px)
            if (originalWidth > MaxMainDimension || originalHeight > MaxMainDimension)
            {
                var (newWidth, newHeight) = CalculateResizedDimensions(
                    originalWidth, originalHeight, MaxMainDimension);

                image.Mutate(x => x.Resize(newWidth, newHeight));

                // Save resized image back (keep original format)
                await image.SaveAsync(mainFilePath, cancellationToken);

                Log.Information(
                    "Resized main image from {OrigW}x{OrigH} to {NewW}x{NewH}: {Path}",
                    originalWidth, originalHeight, newWidth, newHeight, mainFilePath);
            }

            // Generate thumbnail
            var thumbnailFileName = $"{uploadId}.webp";
            var thumbnailStoragePath = $"{ThumbnailsFolder}/{thumbnailFileName}";
            var thumbnailFullPath = Path.Combine(_options.BaseUploadPath, ThumbnailsFolder, thumbnailFileName);

            // Ensure thumbs directory exists
            Directory.CreateDirectory(Path.Combine(_options.BaseUploadPath, ThumbnailsFolder));

            // Clone image for thumbnail
            using var thumbnailImage = image.Clone(ctx =>
            {
                var (thumbWidth, thumbHeight) = CalculateResizedDimensions(
                    ctx.GetCurrentSize().Width, ctx.GetCurrentSize().Height, MaxThumbnailDimension);
                ctx.Resize(thumbWidth, thumbHeight);
            });

            // Save thumbnail as WebP for optimal size
            await thumbnailImage.SaveAsync(thumbnailFullPath, new WebpEncoder
            {
                Quality = 80,
                FileFormat = WebpFileFormatType.Lossy
            }, cancellationToken);

            var thumbnailUrl = $"{_options.PublicBaseUrl}/{thumbnailStoragePath}";

            Log.Information(
                "Generated thumbnail {ThumbW}x{ThumbH}: {Path}",
                thumbnailImage.Width, thumbnailImage.Height, thumbnailFullPath);

            return new ImageProcessingResult(
                Width: image.Width,
                Height: image.Height,
                ThumbnailStoragePath: thumbnailStoragePath,
                ThumbnailUrl: thumbnailUrl
            );
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to process image: {Path}", mainFilePath);
            return null;
        }
    }

    private static (int Width, int Height) CalculateResizedDimensions(int width, int height, int maxDimension)
    {
        if (width <= maxDimension && height <= maxDimension)
        {
            return (width, height);
        }

        var ratio = (double)width / height;

        if (width > height)
        {
            return (maxDimension, (int)(maxDimension / ratio));
        }

        return ((int)(maxDimension * ratio), maxDimension);
    }
}
