# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

# Copy Central Package Management and project files for layer caching
COPY ["Directory.Packages.props", "./"]
COPY ["src/api/YigisoftCorporateCMS.Api.csproj", "./src/api/"]
COPY ["src/api/packages.lock.json", "./src/api/"]
RUN dotnet restore src/api/YigisoftCorporateCMS.Api.csproj --locked-mode

# Copy source and publish
COPY ["src/api/", "./src/api/"]
RUN dotnet publish src/api/YigisoftCorporateCMS.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "YigisoftCorporateCMS.Api.dll"]
