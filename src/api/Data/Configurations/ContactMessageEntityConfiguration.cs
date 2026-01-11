using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Data.Configurations;

public class ContactMessageEntityConfiguration : IEntityTypeConfiguration<ContactMessageEntity>
{
    public void Configure(EntityTypeBuilder<ContactMessageEntity> entity)
    {
        entity.ToTable("contact_messages");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        entity.Property(e => e.PageSlug)
            .HasColumnName("page_slug")
            .IsRequired();

        entity.Property(e => e.RecipientEmail)
            .HasColumnName("recipient_email")
            .IsRequired();

        entity.Property(e => e.Fields)
            .HasColumnName("fields")
            .HasColumnType("jsonb")
            .IsRequired();

        entity.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        entity.Property(e => e.Ip)
            .HasColumnName("ip");

        entity.Property(e => e.UserAgent)
            .HasColumnName("user_agent");

        entity.Property(e => e.ProcessedAt)
            .HasColumnName("processed_at");

        // Index for listing by page
        entity.HasIndex(e => e.PageSlug);

        // Index for filtering by processed status
        entity.HasIndex(e => e.ProcessedAt);
    }
}
