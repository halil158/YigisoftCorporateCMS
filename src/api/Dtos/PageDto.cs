namespace YigisoftCorporateCMS.Api.Dtos;

public record PageDto(
    Guid Id,
    string Slug,
    string Title,
    string? MetaTitle,
    string? MetaDescription,
    string Sections,
    bool IsPublished,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
