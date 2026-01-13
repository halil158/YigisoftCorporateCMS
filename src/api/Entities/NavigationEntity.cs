namespace YigisoftCorporateCMS.Api.Entities;

public class NavigationEntity
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Data { get; set; } = "[]";
    public DateTime UpdatedAt { get; set; }
}
