namespace YigisoftCorporateCMS.Api.Dtos;

public record PageUpsertRequest(
    string Slug,
    string Title,
    string? MetaTitle,
    string? MetaDescription,
    string Sections,
    bool IsPublished
);
