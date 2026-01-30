using System.Text.Json;

namespace YigisoftCorporateCMS.Api.Dtos;

/// <summary>
/// DTO for settings response.
/// </summary>
public record SettingsDto(
    string Key,
    JsonElement Data,
    DateTime UpdatedAt
);

/// <summary>
/// Request for upserting settings.
/// </summary>
public record SettingsUpsertRequest(
    JsonElement Data
);

/// <summary>
/// Branding settings structure.
/// </summary>
public record BrandingSettings
{
    public string? SiteName { get; init; }
    public Guid? LogoLight { get; init; }
    public Guid? LogoDark { get; init; }
    public Guid? Favicon { get; init; }
    public Guid? AppleTouchIcon { get; init; }
    public Guid? DefaultOgImage { get; init; }
}

/// <summary>
/// Theme settings structure.
/// </summary>
public record ThemeSettings
{
    public string Mode { get; init; } = "single";
    public ThemeTokens? Tokens { get; init; }
}

/// <summary>
/// Theme color tokens.
/// </summary>
public record ThemeTokens
{
    public string? Primary { get; init; }
    public string? PrimaryContrast { get; init; }
    public string? Accent { get; init; }
    public string? Background { get; init; }
    public string? Surface { get; init; }
    public string? Text { get; init; }
    public string? MutedText { get; init; }
    public string? Border { get; init; }
}
