using Microsoft.EntityFrameworkCore;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<PageEntity> Pages => Set<PageEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PageEntity>(entity =>
        {
            entity.ToTable("pages");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(e => e.Slug)
                .HasColumnName("slug")
                .IsRequired();

            entity.HasIndex(e => e.Slug)
                .IsUnique();

            entity.Property(e => e.Title)
                .HasColumnName("title")
                .IsRequired();

            entity.Property(e => e.MetaTitle)
                .HasColumnName("meta_title");

            entity.Property(e => e.MetaDescription)
                .HasColumnName("meta_description");

            entity.Property(e => e.Sections)
                .HasColumnName("sections")
                .HasColumnType("jsonb")
                .HasDefaultValue("[]")
                .IsRequired();

            entity.Property(e => e.IsPublished)
                .HasColumnName("is_published")
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("now()");

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .HasDefaultValueSql("now()");
        });
    }
}
