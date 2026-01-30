using Microsoft.EntityFrameworkCore;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<PageEntity> Pages => Set<PageEntity>();
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<ClaimEntity> Claims => Set<ClaimEntity>();
    public DbSet<UserClaimEntity> UserClaims => Set<UserClaimEntity>();
    public DbSet<UploadEntity> Uploads => Set<UploadEntity>();
    public DbSet<ContactMessageEntity> ContactMessages => Set<ContactMessageEntity>();
    public DbSet<NavigationEntity> Navigations => Set<NavigationEntity>();
    public DbSet<SettingsEntity> Settings => Set<SettingsEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
