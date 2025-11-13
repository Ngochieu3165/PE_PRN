using Backend.Configuration;
using Backend.Services;
using DotNetEnv;

// Load .env file
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Configure URLs
var port = Environment.GetEnvironmentVariable("WEBSITES_PORT") ?? "5000";
builder.WebHost.UseUrls($"http://localhost:{port}");

// Override configuration with environment variables
builder.Configuration.AddEnvironmentVariables();

// Configure settings from appsettings.json and environment variables
builder.Services.Configure<MongoSettings>(options =>
{
    options.ConnectionString = builder.Configuration["Mongo__ConnectionString"] 
        ?? builder.Configuration["Mongo:ConnectionString"] 
        ?? throw new InvalidOperationException("Mongo ConnectionString not configured");
    options.Database = builder.Configuration["Mongo__Database"] 
        ?? builder.Configuration["Mongo:Database"] 
        ?? throw new InvalidOperationException("Mongo Database not configured");
});

builder.Services.Configure<AzureStorageSettings>(options =>
{
    options.AccountName = builder.Configuration["AzureStorage__AccountName"] 
        ?? builder.Configuration["AzureStorage:AccountName"] 
        ?? throw new InvalidOperationException("AzureStorage AccountName not configured");
    options.AccountKey = builder.Configuration["AzureStorage__AccountKey"] 
        ?? builder.Configuration["AzureStorage:AccountKey"] 
        ?? throw new InvalidOperationException("AzureStorage AccountKey not configured");
    options.Container = builder.Configuration["AzureStorage__Container"] 
        ?? builder.Configuration["AzureStorage:Container"] 
        ?? throw new InvalidOperationException("AzureStorage Container not configured");
});

// Register services
builder.Services.AddSingleton<IAzureStorageService>(sp =>
{
    var accountName = builder.Configuration["AzureStorage__AccountName"] ?? builder.Configuration["AzureStorage:AccountName"]!;
    var accountKey = builder.Configuration["AzureStorage__AccountKey"] ?? builder.Configuration["AzureStorage:AccountKey"]!;
    var container = builder.Configuration["AzureStorage__Container"] ?? builder.Configuration["AzureStorage:Container"]!;
    return new AzureStorageService(accountName, accountKey, container);
});

builder.Services.AddScoped<IMovieService, MovieService>();

// Add controllers
builder.Services.AddControllers();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Movie Management API v1");
    options.RoutePrefix = string.Empty; // Set Swagger UI at root
});

app.UseCors("AllowAll");

// Comment out HTTPS redirection for local development
// app.UseHttpsRedirection();

app.MapControllers();

app.Run();

