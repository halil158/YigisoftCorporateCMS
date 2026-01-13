using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Data.Configurations;

public class NavigationEntityConfiguration : IEntityTypeConfiguration<NavigationEntity>
{
    public void Configure(EntityTypeBuilder<NavigationEntity> entity)
    {
        entity.ToTable("navigation");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        entity.Property(e => e.Key)
            .HasColumnName("key")
            .IsRequired();

        entity.HasIndex(e => e.Key)
            .IsUnique();

        entity.Property(e => e.Data)
            .HasColumnName("data")
            .HasColumnType("jsonb")
            .HasDefaultValue("[]")
            .IsRequired();

        entity.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
    }
}
