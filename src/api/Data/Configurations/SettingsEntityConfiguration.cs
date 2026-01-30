using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Data.Configurations;

public class SettingsEntityConfiguration : IEntityTypeConfiguration<SettingsEntity>
{
    public void Configure(EntityTypeBuilder<SettingsEntity> entity)
    {
        entity.ToTable("settings");

        entity.HasKey(e => e.Key);

        entity.Property(e => e.Key)
            .HasColumnName("key")
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(e => e.Data)
            .HasColumnName("data")
            .HasColumnType("jsonb")
            .HasDefaultValue("{}")
            .IsRequired();

        entity.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
    }
}
