using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable enable

namespace YigisoftCorporateCMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddContactMessagesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "contact_messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    page_slug = table.Column<string>(type: "text", nullable: false),
                    recipient_email = table.Column<string>(type: "text", nullable: false),
                    fields = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    ip = table.Column<string>(type: "text", nullable: true),
                    user_agent = table.Column<string>(type: "text", nullable: true),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contact_messages", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_contact_messages_page_slug",
                table: "contact_messages",
                column: "page_slug");

            migrationBuilder.CreateIndex(
                name: "IX_contact_messages_processed_at",
                table: "contact_messages",
                column: "processed_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "contact_messages");
        }
    }
}
