namespace YigisoftCorporateCMS.Api.Dtos;

public record PageAdminListItemDto(
    Guid Id,
    string Slug,
    string Title,
    bool IsPublished,
    DateTime UpdatedAt
);
