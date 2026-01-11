using YigisoftCorporateCMS.Api.Uploads;

namespace YigisoftCorporateCMS.Api.Extensions;

/// <summary>
/// Extension methods for IServiceCollection to register application services.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers upload service and configuration.
    /// </summary>
    public static IServiceCollection AddUploads(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure upload options from configuration (if available)
        services.Configure<UploadOptions>(options =>
        {
            // Allow overrides via configuration
            var maxSize = configuration.GetValue<long?>("Uploads:MaxFileSizeBytes");
            if (maxSize.HasValue)
                options.MaxFileSizeBytes = maxSize.Value;

            var basePath = configuration.GetValue<string>("Uploads:BaseUploadPath");
            if (!string.IsNullOrEmpty(basePath))
                options.BaseUploadPath = basePath;

            var publicUrl = configuration.GetValue<string>("Uploads:PublicBaseUrl");
            if (!string.IsNullOrEmpty(publicUrl))
                options.PublicBaseUrl = publicUrl;

            var extensions = configuration.GetSection("Uploads:AllowedExtensions").Get<string[]>();
            if (extensions is { Length: > 0 })
            {
                options.AllowedExtensions = new HashSet<string>(extensions, StringComparer.OrdinalIgnoreCase);
            }
        });

        services.AddScoped<IUploadService, UploadService>();

        return services;
    }
}
