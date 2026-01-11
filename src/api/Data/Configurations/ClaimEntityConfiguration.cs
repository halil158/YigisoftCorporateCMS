using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Data.Configurations;

public class ClaimEntityConfiguration : IEntityTypeConfiguration<ClaimEntity>
{
    public void Configure(EntityTypeBuilder<ClaimEntity> entity)
    {
        entity.ToTable("claims");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        entity.Property(e => e.Type)
            .HasColumnName("type")
            .IsRequired();

        entity.Property(e => e.Value)
            .HasColumnName("value")
            .IsRequired();

        entity.HasIndex(e => new { e.Type, e.Value })
            .IsUnique();

        entity.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
    }
}
