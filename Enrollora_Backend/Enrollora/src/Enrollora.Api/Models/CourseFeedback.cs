using System.ComponentModel.DataAnnotations;

namespace Enrollora.Api.Models;

public sealed class CourseFeedback
{
    public int CourseFeedbackId { get; set; }
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;
    [Range(1, 5)] public int Rating { get; set; }
    [MaxLength(2000)] public string Comment { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
