namespace YigisoftCorporateCMS.Api.Entities;

/// <summary>
/// Entity for storing site-wide settings as key-value pairs with JSON data.
/// </summary>
public class SettingsEntity
{
    public string Key { get; set; } = string.Empty;
    public string Data { get; set; } = "{}";
    public DateTime UpdatedAt { get; set; }
}
