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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
