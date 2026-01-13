using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable enable

namespace YigisoftCorporateCMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNavigationTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "navigation",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    key = table.Column<string>(type: "text", nullable: false),
                    data = table.Column<string>(type: "jsonb", nullable: false, defaultValue: "[]"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_navigation", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_navigation_key",
                table: "navigation",
                column: "key",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "navigation");
        }
    }
}
