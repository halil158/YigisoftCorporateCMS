using System.Text.Json;
using System.Text.RegularExpressions;

namespace YigisoftCorporateCMS.Api.Validation.Settings;

/// <summary>
/// Validates settings data based on key type.
/// </summary>
public static class SettingsValidator
{
    // Valid settings keys
    public static readonly HashSet<string> ValidKeys = new()
    {
        "site.branding",
        "site.theme"
    };

    // Hex color regex: #RRGGBB or #RGB
    private static readonly Regex HexColorRegex = new(@"^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$", RegexOptions.Compiled);

    // Valid theme token names
    private static readonly HashSet<string> ValidThemeTokens = new()
    {
        "primary",
        "primaryContrast",
        "accent",
        "background",
        "surface",
        "text",
        "mutedText",
        "border"
    };

    /// <summary>
    /// Validates settings data for a given key.
    /// </summary>
    public static List<string> Validate(string key, JsonElement data, HashSet<Guid>? validMediaIds = null)
    {
        var errors = new List<string>();

        if (!ValidKeys.Contains(key))
        {
            errors.Add($"Invalid settings key '{key}'. Valid keys: {string.Join(", ", ValidKeys)}");
            return errors;
        }

        return key switch
        {
            "site.branding" => ValidateBrandingSettings(data, validMediaIds),
            "site.theme" => ValidateThemeSettings(data),
            _ => errors
        };
    }

    private static List<string> ValidateBrandingSettings(JsonElement data, HashSet<Guid>? validMediaIds)
    {
        var errors = new List<string>();

        if (data.ValueKind != JsonValueKind.Object)
        {
            errors.Add("data must be an object");
            return errors;
        }

        // siteName - optional string
        if (data.TryGetProperty("siteName", out var siteName))
        {
            if (siteName.ValueKind != JsonValueKind.String && siteName.ValueKind != JsonValueKind.Null)
            {
                errors.Add("siteName must be a string");
            }
            else if (siteName.ValueKind == JsonValueKind.String && siteName.GetString()?.Length > 100)
            {
                errors.Add("siteName must be 100 characters or less");
            }
        }

        // Media ID fields
        var mediaFields = new[] { "logoLight", "logoDark", "favicon", "appleTouchIcon", "defaultOgImage" };
        foreach (var field in mediaFields)
        {
            if (data.TryGetProperty(field, out var value))
            {
                if (value.ValueKind == JsonValueKind.Null)
                    continue;

                if (value.ValueKind != JsonValueKind.String)
                {
                    errors.Add($"{field} must be a string (GUID) or null");
                    continue;
                }

                var guidStr = value.GetString();
                if (string.IsNullOrEmpty(guidStr))
                    continue;

                if (!Guid.TryParse(guidStr, out var mediaId))
                {
                    errors.Add($"{field} must be a valid GUID");
                    continue;
                }

                // Validate media exists if we have a list of valid IDs
                if (validMediaIds != null && !validMediaIds.Contains(mediaId))
                {
                    errors.Add($"{field}: media file with ID '{mediaId}' not found");
                }
            }
        }

        return errors;
    }

    private static List<string> ValidateThemeSettings(JsonElement data)
    {
        var errors = new List<string>();

        if (data.ValueKind != JsonValueKind.Object)
        {
            errors.Add("data must be an object");
            return errors;
        }

        // mode - must be "single" for now
        if (data.TryGetProperty("mode", out var mode))
        {
            if (mode.ValueKind != JsonValueKind.String)
            {
                errors.Add("mode must be a string");
            }
            else if (mode.GetString() != "single")
            {
                errors.Add("mode must be 'single' (only mode supported currently)");
            }
        }

        // tokens - optional object with color values
        if (data.TryGetProperty("tokens", out var tokens))
        {
            if (tokens.ValueKind == JsonValueKind.Null)
                return errors;

            if (tokens.ValueKind != JsonValueKind.Object)
            {
                errors.Add("tokens must be an object");
                return errors;
            }

            foreach (var prop in tokens.EnumerateObject())
            {
                if (!ValidThemeTokens.Contains(prop.Name))
                {
                    errors.Add($"tokens.{prop.Name}: unknown token. Valid tokens: {string.Join(", ", ValidThemeTokens)}");
                    continue;
                }

                if (prop.Value.ValueKind == JsonValueKind.Null)
                    continue;

                if (prop.Value.ValueKind != JsonValueKind.String)
                {
                    errors.Add($"tokens.{prop.Name} must be a string (hex color) or null");
                    continue;
                }

                var colorValue = prop.Value.GetString();
                if (!string.IsNullOrEmpty(colorValue) && !HexColorRegex.IsMatch(colorValue))
                {
                    errors.Add($"tokens.{prop.Name}: '{colorValue}' is not a valid hex color (#RRGGBB or #RGB)");
                }
            }
        }

        return errors;
    }

    /// <summary>
    /// Checks if a hex color string is valid.
    /// </summary>
    public static bool IsValidHexColor(string? color)
    {
        return !string.IsNullOrEmpty(color) && HexColorRegex.IsMatch(color);
    }
}
