using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Data.Configurations;

public class UploadEntityConfiguration : IEntityTypeConfiguration<UploadEntity>
{
    public void Configure(EntityTypeBuilder<UploadEntity> entity)
    {
        entity.ToTable("uploads");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        entity.Property(e => e.StoragePath)
            .HasColumnName("storage_path")
            .IsRequired();

        entity.Property(e => e.Url)
            .HasColumnName("url")
            .IsRequired();

        entity.Property(e => e.FileName)
            .HasColumnName("file_name")
            .IsRequired();

        entity.Property(e => e.OriginalFileName)
            .HasColumnName("original_file_name")
            .IsRequired();

        entity.Property(e => e.ContentType)
            .HasColumnName("content_type")
            .IsRequired();

        entity.Property(e => e.Size)
            .HasColumnName("size")
            .IsRequired();

        entity.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        entity.Property(e => e.UploadedByUserId)
            .HasColumnName("uploaded_by_user_id");

        entity.Property(e => e.ThumbnailStoragePath)
            .HasColumnName("thumbnail_storage_path");

        entity.Property(e => e.ThumbnailUrl)
            .HasColumnName("thumbnail_url");

        entity.Property(e => e.Width)
            .HasColumnName("width");

        entity.Property(e => e.Height)
            .HasColumnName("height");

        entity.HasOne(e => e.UploadedByUser)
            .WithMany()
            .HasForeignKey(e => e.UploadedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
