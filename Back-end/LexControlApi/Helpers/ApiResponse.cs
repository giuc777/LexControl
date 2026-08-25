namespace LexControlApi.Helpers;

/// <summary>Formato estándar de respuesta del API.</summary>
public class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Error { get; init; }

    public static ApiResponse<T> Correcto(T data) => new() { Success = true, Data = data };

    public static ApiResponse<T> Fallo(string error) => new() { Success = false, Error = error };
}
