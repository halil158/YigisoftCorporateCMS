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
/// Represents a navigation entry that uses a media file.
/// </summary>
public record NavigationMediaUsage(
    string Key,
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
    Guid MediaId,
    List<PageMediaUsage> Pages,
    List<NavigationMediaUsage> Navigation,
    List<SettingsMediaUsage> Settings
)
{
    public int Total => Pages.Count + Navigation.Count + Settings.Count;
    public bool IsInUse => Total > 0;

    // Legacy properties for backward compatibility with existing code
    public List<PageMediaUsage> UsedByPages => Pages;
    public List<SettingsMediaUsage> UsedBySettings => Settings;
    public int TotalCount => Total;
}

/// <summary>
/// Error response for media in use.
/// </summary>
public record MediaInUseError(
    string Error,
    MediaUsageInfo Usage
);
