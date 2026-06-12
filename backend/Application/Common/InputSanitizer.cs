using System.Net;
using System.Text.RegularExpressions;

namespace PortfolioApi.Application.Common;

public static partial class InputSanitizer
{
    public static string Sanitize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var noHtml = HtmlTagRegex().Replace(input, string.Empty);
        return WebUtility.HtmlEncode(noHtml).Trim();
    }

    [GeneratedRegex(@"<[^>]*>")]
    private static partial Regex HtmlTagRegex();
}
