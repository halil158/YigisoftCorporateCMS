using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Data.Configurations;

public class UserEntityConfiguration : IEntityTypeConfiguration<UserEntity>
{
    public void Configure(EntityTypeBuilder<UserEntity> entity)
    {
        entity.ToTable("users");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        entity.Property(e => e.Email)
            .HasColumnName("email")
            .IsRequired();

        entity.Property(e => e.EmailNormalized)
            .HasColumnName("email_normalized")
            .IsRequired();

        entity.HasIndex(e => e.EmailNormalized)
            .IsUnique();

        entity.Property(e => e.DisplayName)
            .HasColumnName("display_name")
            .IsRequired();

        entity.Property(e => e.PasswordHash)
            .HasColumnName("password_hash")
            .IsRequired();

        entity.Property(e => e.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        entity.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        entity.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
    }
}
