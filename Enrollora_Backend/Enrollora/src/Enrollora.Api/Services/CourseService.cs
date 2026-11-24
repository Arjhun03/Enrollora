using Enrollora.Api.DTOs;
using Enrollora.Api.Models;
using Enrollora.Api.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Enrollora.Api.Services;

public sealed class CourseService(
    IRepository<Course> courses,
    IRepository<Enrollment> enrollments,
    IRepository<CourseFeedback> feedback,
    IRepository<Student> students) : ICourseService
{

    public async Task<PagedResult<CourseResponse>> GetCoursesAsync(
        CourseQuery query, CancellationToken ct)
    {
        query.Normalize();

        var q = courses.Query().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            q = q.Where(x => x.CourseName.Contains(search));
        }

        // Students can browse only courses currently open for enrollment.
        // Administrators may pass IsActive=false to find inactive courses.
        if (!query.IsActive.HasValue)
            q = q.Where(x => x.IsActive);

        if (query.IsActive.HasValue)
            q = q.Where(x => x.IsActive == query.IsActive);

        if (query.MinFees.HasValue)
            q = q.Where(x => x.Fees >= query.MinFees);

        if (query.MaxFees.HasValue)
            q = q.Where(x => x.Fees <= query.MaxFees);

        if (query.MinCapacity.HasValue)
            q = q.Where(x => x.Capacity >= query.MinCapacity);

        if (query.MaxCapacity.HasValue)
            q = q.Where(x => x.Capacity <= query.MaxCapacity);

        // Calculate active enrollments for each course
        var joined = q.Select(course => new
        {
            Course = course,

            Enrolled = enrollments.Query().Count(e =>
                e.CourseId == course.CourseId &&
                e.Status == EnrollmentStatus.Active)
        });

        // Availability filter
        if (string.Equals(query.Availability, "available",
            StringComparison.OrdinalIgnoreCase))
        {
            joined = joined.Where(x =>
                x.Course.Capacity > x.Enrolled);
        }
        else if (string.Equals(query.Availability, "full",
            StringComparison.OrdinalIgnoreCase))
        {
            joined = joined.Where(x =>
                x.Course.Capacity <= x.Enrolled);
        }

        // Sorting
        joined = (query.SortBy?.ToLowerInvariant(), query.SortOrder) switch
        {
            ("fees", "desc") => joined.OrderByDescending(x => x.Course.Fees),
            ("fees", _) => joined.OrderBy(x => x.Course.Fees),
            ("duration", "desc") => joined.OrderByDescending(x => x.Course.Duration),
            ("duration", _) => joined.OrderBy(x => x.Course.Duration),
            ("capacity", "desc") => joined.OrderByDescending(x => x.Course.Capacity),
            ("capacity", _) => joined.OrderBy(x => x.Course.Capacity),
            ("name", "desc") => joined.OrderByDescending(x => x.Course.CourseName),
            _ => joined.OrderBy(x => x.Course.CourseName)
        };

        // Pagination
        var total = await joined.CountAsync(ct);

        var rows = await joined
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        // Mapping
        var items = rows
            .Select(x => Map(x.Course, x.Enrolled))
            .ToList();

        return new PagedResult<CourseResponse>(
            items,
            query.PageNumber,
            query.PageSize,
            total,
            (int)Math.Ceiling(total / (double)query.PageSize));
    }


    public async Task<CourseResponse> GetByIdAsync(int id, CancellationToken ct)
    {
        var course = await FindAsync(id, ct);
        var count = await enrollments.Query()
            .CountAsync(x => x.CourseId == id && x.Status == EnrollmentStatus.Active, ct);
        return Map(course, count);
    }

    public async Task<CourseResponse> CreateAsync(SaveCourseRequest request, CancellationToken ct)
    {
        var course = new Course
        {
            CourseName = request.CourseName.Trim(),
            Duration = request.Duration.Trim(),
            Fees = request.Fees,
            Capacity = request.Capacity,
            IsActive = request.IsActive
        };
        await courses.AddAsync(course, ct);
        await courses.SaveChangesAsync(ct);
        return Map(course, 0);
    }

    public async Task<CourseResponse> UpdateAsync(int id, SaveCourseRequest request, CancellationToken ct)
    {
        var course = await FindAsync(id, ct);
        var activeCount = await enrollments.Query()
            .CountAsync(x => x.CourseId == id && x.Status == EnrollmentStatus.Active, ct);

        if (request.Capacity < activeCount)
            throw new InvalidOperationException("Capacity cannot be lower than current active enrollments.");

        course.CourseName = request.CourseName.Trim();
        course.Duration = request.Duration.Trim();
        course.Fees = request.Fees;
        course.Capacity = request.Capacity;
        course.IsActive = request.IsActive;
        courses.Update(course);
        await courses.SaveChangesAsync(ct);
        return Map(course, activeCount);
    }

    public async Task DeactivateAsync(int id, CancellationToken ct)
    {
        var course = await FindAsync(id, ct);
        course.IsActive = false;
        courses.Update(course);
        await courses.SaveChangesAsync(ct);
    }

    public async Task<CourseFeedbackResponse> AddFeedbackAsync(int studentId, CreateCourseFeedbackRequest request, CancellationToken ct)
    {
        var course = await FindAsync(request.CourseId, ct);
        var student = await students.Query().FirstOrDefaultAsync(x => x.StudentId == studentId, ct)
            ?? throw new KeyNotFoundException("Student was not found.");
        var enrolled = await enrollments.Query().AnyAsync(x => x.CourseId == request.CourseId && x.StudentId == studentId, ct);
        if (!enrolled) throw new InvalidOperationException("Only students enrolled in a course can submit feedback.");
        var item = new CourseFeedback { StudentId = studentId, CourseId = request.CourseId, Rating = request.Rating, Comment = request.Comment.Trim() };
        await feedback.AddAsync(item, ct);
        await feedback.SaveChangesAsync(ct);
        return new(item.CourseFeedbackId, course.CourseId, course.CourseName, studentId, student.Name, item.Rating, item.Comment, item.SubmittedAt);
    }

    public async Task<PagedResult<CourseFeedbackResponse>> GetFeedbackAsync(int? courseId, PaginationQuery query, CancellationToken ct)
    {
        query.Normalize();
        var q = feedback.Query().Where(x => !courseId.HasValue || x.CourseId == courseId.Value);
        var total = await q.CountAsync(ct);
        var rows = await q.OrderByDescending(x => x.SubmittedAt).Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize)
            .Select(x => new CourseFeedbackResponse(x.CourseFeedbackId, x.CourseId, x.Course.CourseName, x.StudentId, x.Student.Name, x.Rating, x.Comment, x.SubmittedAt)).ToListAsync(ct);
        return new(rows, query.PageNumber, query.PageSize, total, (int)Math.Ceiling(total / (double)query.PageSize));
    }

    private async Task<Course> FindAsync(int id, CancellationToken ct) =>
        await courses.Query(true).FirstOrDefaultAsync(x => x.CourseId == id, ct)
        ?? throw new KeyNotFoundException("Course was not found.");

    private static CourseResponse Map(Course x, int enrolled) =>
        new(x.CourseId, x.CourseName, x.Duration, x.Fees, x.Capacity,
            enrolled, Math.Max(0, x.Capacity - enrolled), x.IsActive);
}
