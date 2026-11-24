using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Enrollora.Api.Data;

#nullable disable

namespace Enrollora.Api.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261124120000_AddCourseFeedback")]
public partial class AddCourseFeedback : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CourseFeedback",
            columns: table => new
            {
                CourseFeedbackId = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                StudentId = table.Column<int>(type: "int", nullable: false),
                CourseId = table.Column<int>(type: "int", nullable: false),
                Rating = table.Column<int>(type: "int", nullable: false),
                Comment = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CourseFeedback", x => x.CourseFeedbackId);
                table.ForeignKey("FK_CourseFeedback_Courses_CourseId", x => x.CourseId,
                    "Courses", "CourseId", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("FK_CourseFeedback_Students_StudentId", x => x.StudentId,
                    "Students", "StudentId", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex("IX_CourseFeedback_CourseId", "CourseFeedback", "CourseId");
        migrationBuilder.CreateIndex("IX_CourseFeedback_StudentId", "CourseFeedback", "StudentId");
        migrationBuilder.CreateIndex("IX_CourseFeedback_SubmittedAt", "CourseFeedback", "SubmittedAt");
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable(name: "CourseFeedback");
}
