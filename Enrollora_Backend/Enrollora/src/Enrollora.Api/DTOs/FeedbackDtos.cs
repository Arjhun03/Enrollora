using System.ComponentModel.DataAnnotations;

namespace Enrollora.Api.DTOs;

public sealed class CreateCourseFeedbackRequest
{
    [Range(1, int.MaxValue)] public int CourseId { get; set; }
    [Range(1, 5)] public int Rating { get; set; }
    [Required, MaxLength(2000)] public string Comment { get; set; } = string.Empty;
}

public sealed record CourseFeedbackResponse(int FeedbackId, int CourseId, string CourseName,
    int StudentId, string StudentName, int Rating, string Comment, DateTime SubmittedAt);
