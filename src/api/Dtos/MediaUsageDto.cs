namespace YigisoftCorporateCMS.Api.Dtos;

/// <summary>
/// Represents a page that uses a media file.
/// </summary>
public record PageMediaUsage(
    Guid PageId,
    string Slug,
    string Title,
    string JsonPath
);

/// <summary>
/// Represents a settings entry that uses a media file.
/// </summary>
public record SettingsMediaUsage(
    string SettingsKey,
    string JsonPath
);

/// <summary>
/// Complete media usage information.
/// </summary>
public record MediaUsageInfo(
    List<PageMediaUsage> UsedByPages,
    List<SettingsMediaUsage> UsedBySettings
)
{
    public int TotalCount => UsedByPages.Count + UsedBySettings.Count;
    public bool IsInUse => TotalCount > 0;
}

/// <summary>
/// Error response for media in use.
/// </summary>
public record MediaInUseError(
    string Error,
    MediaUsageInfo Usage
);
