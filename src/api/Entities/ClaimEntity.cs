namespace YigisoftCorporateCMS.Api.Entities;

public class ClaimEntity
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public ICollection<UserClaimEntity> UserClaims { get; set; } = [];
}
