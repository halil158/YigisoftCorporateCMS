namespace YigisoftCorporateCMS.Api.Entities;

public class UserClaimEntity
{
    public Guid UserId { get; set; }
    public Guid ClaimId { get; set; }

    public UserEntity User { get; set; } = null!;
    public ClaimEntity Claim { get; set; } = null!;
}
