using Microsoft.AspNetCore.Http;

namespace YigisoftCorporateCMS.Api.Uploads;

/// <summary>
/// Abstraction for file upload operations.
/// </summary>
public interface IUploadService
{
    /// <summary>
    /// Validates and saves an uploaded file.
    /// </summary>
    /// <param name="uploadId">The ID to use for this upload (used for thumbnail naming).</param>
    /// <param name="file">The uploaded file.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result containing the upload details or validation errors.</returns>
    Task<UploadOperationResult> UploadAsync(Guid uploadId, IFormFile? file, CancellationToken cancellationToken = default);
}
