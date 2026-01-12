using Microsoft.EntityFrameworkCore.Migrations;

#nullable enable

namespace YigisoftCorporateCMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUploadsThumbnailColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "thumbnail_storage_path",
                table: "uploads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "thumbnail_url",
                table: "uploads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "width",
                table: "uploads",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "height",
                table: "uploads",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "thumbnail_storage_path", table: "uploads");
            migrationBuilder.DropColumn(name: "thumbnail_url", table: "uploads");
            migrationBuilder.DropColumn(name: "width", table: "uploads");
            migrationBuilder.DropColumn(name: "height", table: "uploads");
        }
    }
}
