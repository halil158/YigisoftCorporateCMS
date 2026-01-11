using YigisoftCorporateCMS.Api.Uploads;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Admin file upload endpoints.
/// </summary>
public static class AdminUploadsEndpoints
{
    public static IEndpointRouteBuilder MapAdminUploadsEndpoints(this IEndpointRouteBuilder admin)
    {
        // POST /api/admin/uploads - Upload a file
        admin.MapPost("/uploads", async (IFormFile? file, IUploadService uploadService) =>
        {
            var result = await uploadService.UploadAsync(file);

            if (result.IsSuccess && result.Data is not null)
            {
                return Results.Created(result.Data.Url, new
                {
                    url = result.Data.Url,
                    fileName = result.Data.FileName,
                    contentType = result.Data.ContentType,
                    size = result.Data.Size
                });
            }

            if (result.IsServerError)
            {
                return Results.Problem(
                    detail: "An error occurred while uploading the file",
                    statusCode: 500
                );
            }

            return Results.BadRequest(new { error = "ValidationFailed", details = result.Errors });
        }).DisableAntiforgery();

        return admin;
    }
}
