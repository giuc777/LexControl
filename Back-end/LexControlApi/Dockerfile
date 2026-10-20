# Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY LexControlApi.csproj .
RUN dotnet restore LexControlApi.csproj

COPY . .
RUN dotnet publish LexControlApi.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 10000

USER $APP_UID

# Render inyecta $PORT; fuera de Render usa 10000 por defecto.
CMD dotnet LexControlApi.dll --urls http://0.0.0.0:${PORT:-10000}
