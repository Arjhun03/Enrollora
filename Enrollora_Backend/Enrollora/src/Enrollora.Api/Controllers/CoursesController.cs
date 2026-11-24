using Enrollora.Api.DTOs;
using Enrollora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Enrollora.Api.Controllers;

[ApiController]
[Route("api/courses")]
[Authorize(Roles = "Administrator,Student")]
public sealed class CoursesController(ICourseService service) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<CourseResponse>> GetAll(
        [FromQuery] CourseQuery query, CancellationToken ct) =>
        service.GetCoursesAsync(query, ct);

    [HttpGet("{id:int}")]
    public Task<CourseResponse> GetById(int id, CancellationToken ct) =>
        service.GetByIdAsync(id, ct);

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create(SaveCourseRequest request, CancellationToken ct)
    {
        var result = await service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.CourseId }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrator")]
    public Task<CourseResponse> Update(int id, SaveCourseRequest request, CancellationToken ct) =>
        service.UpdateAsync(id, request, ct);

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Deactivate(int id, CancellationToken ct)
    {
        await service.DeactivateAsync(id, ct);
        return Ok(new ApiMessage("Course deactivated. Historical enrollments are preserved."));
    }

    [HttpPost("feedback")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> AddFeedback(CreateCourseFeedbackRequest request, CancellationToken ct)
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await service.AddFeedbackAsync(id, request, ct);
        return Ok(result);
    }

    [HttpGet("feedback")]
    [Authorize(Roles = "Administrator")]
    public Task<PagedResult<CourseFeedbackResponse>> GetFeedback([FromQuery] int? courseId, [FromQuery] PaginationQuery query, CancellationToken ct) =>
        service.GetFeedbackAsync(courseId, query, ct);
}
