using System.Text.Json;

namespace YigisoftCorporateCMS.Api.Validation.Sections;

/// <summary>
/// Validates page sections JSON against registered type schemas.
/// Returns detailed error paths like "sections[0].data.title is required".
/// </summary>
public static class SectionsValidator
{
    /// <summary>
    /// Registry mapping section type names to their validators.
    /// </summary>
    private static readonly Dictionary<string, Func<JsonElement, string, List<string>>> TypeValidators = new()
    {
        ["hero"] = ValidateHeroSection,
        ["features"] = ValidateFeaturesSection,
        ["cta"] = ValidateCtaSection,
        ["testimonials"] = ValidateTestimonialsSection,
        ["gallery"] = ValidateGallerySection,
        ["contact-form"] = ValidateContactFormSection
    };

    /// <summary>
    /// Supported section types for documentation/error messages.
    /// </summary>
    public static IReadOnlyCollection<string> SupportedTypes => TypeValidators.Keys.ToList().AsReadOnly();

    /// <summary>
    /// Validates the sections JSON string.
    /// </summary>
    /// <param name="sectionsJson">JSON string containing sections array</param>
    /// <returns>List of validation errors (empty if valid)</returns>
    public static List<string> Validate(string sectionsJson)
    {
        var errors = new List<string>();

        using var doc = JsonDocument.Parse(sectionsJson);
        var root = doc.RootElement;

        if (root.ValueKind != JsonValueKind.Array)
        {
            errors.Add("sections must be a JSON array");
            return errors;
        }

        var index = 0;
        foreach (var section in root.EnumerateArray())
        {
            var prefix = $"sections[{index}]";
            ValidateSection(section, prefix, errors);
            index++;
        }

        return errors;
    }

    private static void ValidateSection(JsonElement section, string prefix, List<string> errors)
    {
        // Section must be an object
        if (section.ValueKind != JsonValueKind.Object)
        {
            errors.Add($"{prefix} must be an object");
            return;
        }

        // type is required
        if (!section.TryGetProperty("type", out var typeElement))
        {
            errors.Add($"{prefix}.type is required");
            return;
        }

        if (typeElement.ValueKind != JsonValueKind.String)
        {
            errors.Add($"{prefix}.type must be a string");
            return;
        }

        var type = typeElement.GetString();
        if (string.IsNullOrWhiteSpace(type))
        {
            errors.Add($"{prefix}.type must be a non-empty string");
            return;
        }

        // data is required
        if (!section.TryGetProperty("data", out var dataElement))
        {
            errors.Add($"{prefix}.data is required");
            return;
        }

        if (dataElement.ValueKind != JsonValueKind.Object)
        {
            errors.Add($"{prefix}.data must be an object");
            return;
        }

        // Validate against type-specific schema
        if (!TypeValidators.TryGetValue(type, out var validator))
        {
            var supportedTypes = string.Join(", ", SupportedTypes);
            errors.Add($"{prefix}.type '{type}' is not supported. Supported types: {supportedTypes}");
            return;
        }

        var typeErrors = validator(dataElement, $"{prefix}.data");
        errors.AddRange(typeErrors);
    }

    #region Type Validators

    /// <summary>
    /// Hero section validator.
    /// Required: title (non-empty string)
    /// Optional: subtitle, imageUrl (strings), primaryCta (object with optional text/url)
    /// </summary>
    private static List<string> ValidateHeroSection(JsonElement data, string prefix)
    {
        var errors = new List<string>();

        // title is required (non-empty string)
        if (!TryGetNonEmptyString(data, "title", out _))
        {
            errors.Add($"{prefix}.title is required");
        }

        // subtitle is optional string
        ValidateOptionalString(data, "subtitle", prefix, errors);

        // imageUrl is optional string
        ValidateOptionalString(data, "imageUrl", prefix, errors);

        // primaryCta is optional object
        if (data.TryGetProperty("primaryCta", out var ctaElement))
        {
            if (ctaElement.ValueKind != JsonValueKind.Object && ctaElement.ValueKind != JsonValueKind.Null)
            {
                errors.Add($"{prefix}.primaryCta must be an object");
            }
            else if (ctaElement.ValueKind == JsonValueKind.Object)
            {
                ValidateOptionalString(ctaElement, "text", $"{prefix}.primaryCta", errors);
                ValidateOptionalString(ctaElement, "url", $"{prefix}.primaryCta", errors);
            }
        }

        return errors;
    }

    /// <summary>
    /// Features section validator.
    /// Required: title (non-empty string), items (array with min 1 element)
    /// Each item: title (required), description (optional), icon (optional)
    /// </summary>
    private static List<string> ValidateFeaturesSection(JsonElement data, string prefix)
    {
        var errors = new List<string>();

        // title is required (non-empty string)
        if (!TryGetNonEmptyString(data, "title", out _))
        {
            errors.Add($"{prefix}.title is required");
        }

        // items is required (array with min 1 element)
        if (!data.TryGetProperty("items", out var itemsElement))
        {
            errors.Add($"{prefix}.items is required");
            return errors;
        }

        if (itemsElement.ValueKind != JsonValueKind.Array)
        {
            errors.Add($"{prefix}.items must be an array");
            return errors;
        }

        var itemCount = 0;
        foreach (var item in itemsElement.EnumerateArray())
        {
            var itemPrefix = $"{prefix}.items[{itemCount}]";

            if (item.ValueKind != JsonValueKind.Object)
            {
                errors.Add($"{itemPrefix} must be an object");
            }
            else
            {
                // title is required in each item
                if (!TryGetNonEmptyString(item, "title", out _))
                {
                    errors.Add($"{itemPrefix}.title is required");
                }

                // description is optional string
                ValidateOptionalString(item, "description", itemPrefix, errors);

                // icon is optional string
                ValidateOptionalString(item, "icon", itemPrefix, errors);
            }

            itemCount++;
        }

        if (itemCount == 0)
        {
            errors.Add($"{prefix}.items must have at least 1 element");
        }

        return errors;
    }

    /// <summary>
    /// CTA section validator.
    /// Required: title (non-empty string), buttonText (non-empty string), buttonUrl (non-empty string)
    /// </summary>
    private static List<string> ValidateCtaSection(JsonElement data, string prefix)
    {
        var errors = new List<string>();

        // title is required (non-empty string)
        if (!TryGetNonEmptyString(data, "title", out _))
        {
            errors.Add($"{prefix}.title is required");
        }

        // buttonText is required (non-empty string)
        if (!TryGetNonEmptyString(data, "buttonText", out _))
        {
            errors.Add($"{prefix}.buttonText is required");
        }

        // buttonUrl is required (non-empty string)
        if (!TryGetNonEmptyString(data, "buttonUrl", out _))
        {
            errors.Add($"{prefix}.buttonUrl is required");
        }

        return errors;
    }

    /// <summary>
    /// Testimonials section validator.
    /// Required: title (non-empty string), items (array with min 1 element)
    /// Each item: quote (required), name (required), role (optional), company (optional), avatarUrl (optional)
    /// </summary>
    private static List<string> ValidateTestimonialsSection(JsonElement data, string prefix)
    {
        var errors = new List<string>();

        // title is required (non-empty string)
        if (!TryGetNonEmptyString(data, "title", out _))
        {
            errors.Add($"{prefix}.title is required");
        }

        // items is required (array with min 1 element)
        if (!data.TryGetProperty("items", out var itemsElement))
        {
            errors.Add($"{prefix}.items is required");
            return errors;
        }

        if (itemsElement.ValueKind != JsonValueKind.Array)
        {
            errors.Add($"{prefix}.items must be an array");
            return errors;
        }

        var itemCount = 0;
        foreach (var item in itemsElement.EnumerateArray())
        {
            var itemPrefix = $"{prefix}.items[{itemCount}]";

            if (item.ValueKind != JsonValueKind.Object)
            {
                errors.Add($"{itemPrefix} must be an object");
            }
            else
            {
                // quote is required in each item
                if (!TryGetNonEmptyString(item, "quote", out _))
                {
                    errors.Add($"{itemPrefix}.quote is required");
                }

                // name is required in each item
                if (!TryGetNonEmptyString(item, "name", out _))
                {
                    errors.Add($"{itemPrefix}.name is required");
                }

                // role is optional string
                ValidateOptionalString(item, "role", itemPrefix, errors);

                // company is optional string
                ValidateOptionalString(item, "company", itemPrefix, errors);

                // avatarUrl is optional string
                ValidateOptionalString(item, "avatarUrl", itemPrefix, errors);
            }

            itemCount++;
        }

        if (itemCount == 0)
        {
            errors.Add($"{prefix}.items must have at least 1 element");
        }

        return errors;
    }

    /// <summary>
    /// Gallery section validator.
    /// Required: title (non-empty string), items (array with min 1 element)
    /// Each item: imageUrl (required), alt (optional), caption (optional)
    /// </summary>
    private static List<string> ValidateGallerySection(JsonElement data, string prefix)
    {
        var errors = new List<string>();

        // title is required (non-empty string)
        if (!TryGetNonEmptyString(data, "title", out _))
        {
            errors.Add($"{prefix}.title is required");
        }

        // items is required (array with min 1 element)
        if (!data.TryGetProperty("items", out var itemsElement))
        {
            errors.Add($"{prefix}.items is required");
            return errors;
        }

        if (itemsElement.ValueKind != JsonValueKind.Array)
        {
            errors.Add($"{prefix}.items must be an array");
            return errors;
        }

        var itemCount = 0;
        foreach (var item in itemsElement.EnumerateArray())
        {
            var itemPrefix = $"{prefix}.items[{itemCount}]";

            if (item.ValueKind != JsonValueKind.Object)
            {
                errors.Add($"{itemPrefix} must be an object");
            }
            else
            {
                // imageUrl is required in each item
                if (!TryGetNonEmptyString(item, "imageUrl", out _))
                {
                    errors.Add($"{itemPrefix}.imageUrl is required");
                }

                // alt is optional string
                ValidateOptionalString(item, "alt", itemPrefix, errors);

                // caption is optional string
                ValidateOptionalString(item, "caption", itemPrefix, errors);
            }

            itemCount++;
        }

        if (itemCount == 0)
        {
            errors.Add($"{prefix}.items must have at least 1 element");
        }

        return errors;
    }

    /// <summary>
    /// Contact form section validator.
    /// Required: title (non-empty string), recipientEmail (non-empty string with @), fields (array with min 1 element)
    /// Each field: name (required), label (required), type (required, one of: text, email, textarea, phone)
    /// Optional: description, submitText; per field: required (bool), placeholder (string)
    /// </summary>
    private static List<string> ValidateContactFormSection(JsonElement data, string prefix)
    {
        var errors = new List<string>();
        var allowedFieldTypes = new HashSet<string> { "text", "email", "textarea", "phone" };

        // title is required (non-empty string)
        if (!TryGetNonEmptyString(data, "title", out _))
        {
            errors.Add($"{prefix}.title is required");
        }

        // recipientEmail is required (non-empty string with basic validation)
        if (!TryGetNonEmptyString(data, "recipientEmail", out var email))
        {
            errors.Add($"{prefix}.recipientEmail is required");
        }
        else if (!email!.Contains('@') || email.Contains(' '))
        {
            errors.Add($"{prefix}.recipientEmail must be a valid email address");
        }

        // description is optional string
        ValidateOptionalString(data, "description", prefix, errors);

        // submitText is optional string
        ValidateOptionalString(data, "submitText", prefix, errors);

        // fields is required (array with min 1 element)
        if (!data.TryGetProperty("fields", out var fieldsElement))
        {
            errors.Add($"{prefix}.fields is required");
            return errors;
        }

        if (fieldsElement.ValueKind != JsonValueKind.Array)
        {
            errors.Add($"{prefix}.fields must be an array");
            return errors;
        }

        var fieldCount = 0;
        var fieldNames = new HashSet<string>();
        foreach (var field in fieldsElement.EnumerateArray())
        {
            var fieldPrefix = $"{prefix}.fields[{fieldCount}]";

            if (field.ValueKind != JsonValueKind.Object)
            {
                errors.Add($"{fieldPrefix} must be an object");
            }
            else
            {
                // name is required in each field
                if (!TryGetNonEmptyString(field, "name", out var fieldName))
                {
                    errors.Add($"{fieldPrefix}.name is required");
                }
                else
                {
                    // Check for duplicate field names
                    if (!fieldNames.Add(fieldName!))
                    {
                        errors.Add($"{fieldPrefix}.name '{fieldName}' is duplicate");
                    }
                }

                // label is required in each field
                if (!TryGetNonEmptyString(field, "label", out _))
                {
                    errors.Add($"{fieldPrefix}.label is required");
                }

                // type is required in each field (must be one of allowed values)
                if (!TryGetNonEmptyString(field, "type", out var fieldType))
                {
                    errors.Add($"{fieldPrefix}.type is required");
                }
                else if (!allowedFieldTypes.Contains(fieldType!))
                {
                    var allowed = string.Join(", ", allowedFieldTypes);
                    errors.Add($"{fieldPrefix}.type '{fieldType}' is not valid. Allowed types: {allowed}");
                }

                // required is optional bool
                ValidateOptionalBool(field, "required", fieldPrefix, errors);

                // placeholder is optional string
                ValidateOptionalString(field, "placeholder", fieldPrefix, errors);
            }

            fieldCount++;
        }

        if (fieldCount == 0)
        {
            errors.Add($"{prefix}.fields must have at least 1 element");
        }

        return errors;
    }

    #endregion

    #region Helper Methods

    private static bool TryGetNonEmptyString(JsonElement element, string propertyName, out string? value)
    {
        value = null;

        if (!element.TryGetProperty(propertyName, out var prop))
            return false;

        if (prop.ValueKind != JsonValueKind.String)
            return false;

        value = prop.GetString();
        return !string.IsNullOrWhiteSpace(value);
    }

    private static void ValidateOptionalString(JsonElement element, string propertyName, string prefix, List<string> errors)
    {
        if (element.TryGetProperty(propertyName, out var prop))
        {
            if (prop.ValueKind != JsonValueKind.String && prop.ValueKind != JsonValueKind.Null)
            {
                errors.Add($"{prefix}.{propertyName} must be a string");
            }
        }
    }

    private static void ValidateOptionalBool(JsonElement element, string propertyName, string prefix, List<string> errors)
    {
        if (element.TryGetProperty(propertyName, out var prop))
        {
            if (prop.ValueKind != JsonValueKind.True && prop.ValueKind != JsonValueKind.False && prop.ValueKind != JsonValueKind.Null)
            {
                errors.Add($"{prefix}.{propertyName} must be a boolean");
            }
        }
    }

    #endregion
}
