using Microsoft.EntityFrameworkCore.Migrations;

#nullable enable

namespace YigisoftCorporateCMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class EnablePgCrypto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op: prefer not to drop extension as other tables may depend on it
        }
    }
}
