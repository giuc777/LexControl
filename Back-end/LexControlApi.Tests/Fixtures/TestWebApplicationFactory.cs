using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace LexControlApi.Tests.Fixtures;

/// <summary>
/// Factory de pruebas que configura el servidor de pruebas con la BD real
/// y un JWT_SECRET controlado para las pruebas de integración.
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    /// <summary>JWT_SECRET usado por el servidor de pruebas (32+ chars).</summary>
    public const string JwtTestSecret = "LexControl_Tests_Secret_Key_32_Chars_2026!";

    protected override IHost CreateHost(IHostBuilder builder)
    {
        Environment.SetEnvironmentVariable("JWT_SECRET", JwtTestSecret);
        builder.UseEnvironment("Development");
        return base.CreateHost(builder);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.Sources.Clear();

            var testSettings = new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] =
                    "Server=DESKTOP-V7G3G1I\\SQLEXPRESS;Database=DBLexControl;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true",
                ["Jwt:Secret"] = JwtTestSecret,
                ["Jwt:Issuer"] = "LexControlApi",
                ["Jwt:Audience"] = "LexControlApp",
                ["Jwt:AccessTokenMinutes"] = "60",
                ["Jwt:RefreshTokenDays"] = "7",
                ["FileStorage:BasePath"] = Path.Combine(Path.GetTempPath(), "lexcontrol_test_docs")
            };

            config.AddInMemoryCollection(testSettings);
        });
    }
}
