namespace YigisoftCorporateCMS.Api.Dtos;

public record NavigationDto(
    string Key,
    List<NavigationItemDto> Items
);

public record NavigationItemDto(
    string Id,
    string Label,
    string Type,
    string? Slug,
    string? Url,
    int Order,
    bool IsVisible,
    bool? NewTab
);

public record NavigationUpsertRequest(
    List<NavigationItemRequest> Items
);

public record NavigationItemRequest(
    string? Id,
    string Label,
    string Type,
    string? Slug,
    string? Url,
    int Order,
    bool IsVisible,
    bool? NewTab
);
