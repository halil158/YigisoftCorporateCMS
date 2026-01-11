using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Data.Configurations;

public class UserClaimEntityConfiguration : IEntityTypeConfiguration<UserClaimEntity>
{
    public void Configure(EntityTypeBuilder<UserClaimEntity> entity)
    {
        entity.ToTable("user_claims");

        entity.HasKey(e => new { e.UserId, e.ClaimId });

        entity.Property(e => e.UserId)
            .HasColumnName("user_id");

        entity.Property(e => e.ClaimId)
            .HasColumnName("claim_id");

        entity.HasIndex(e => e.UserId);
        entity.HasIndex(e => e.ClaimId);

        entity.HasOne(e => e.User)
            .WithMany(u => u.UserClaims)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.Claim)
            .WithMany(c => c.UserClaims)
            .HasForeignKey(e => e.ClaimId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
