const API_BASE_URL =
	import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

// This represnts one FastAPI validation error, we only care about the message, but there are type and loc.
interface ValidationError
{
	msg?: string;
}

// FastAPI can return detail in two relevant fromats, either JSON object with a string detail, or an array of FastAPI/Pydantic validation errors.
interface BackendError
{
	detail?: string | ValidationError[];
}

// Custom error class to represent API errors with a status code and message.
export class ApiError extends Error
{
    status: number;

    constructor(status: number, message: string)
    {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

// Converts different error FastAPI error shapes into string messages for display to the user.
function getErrorMessage(error: BackendError | undefined): string
{
    if (typeof error?.detail === "string")
        return error.detail;

    if (Array.isArray(error?.detail))
    {
        const messages = error.detail
            .map(item => item.msg)
            .filter((message): message is string => Boolean(message));
        
        if (messages.length > 0)
            return messages.join(", ");
    }

    return "Request failed";
}

export async function apiRequest<T>(
    path: string,
    options: RequestInit = {}, // RequestInit is TypeScript's built-in type for fetch options, contain headers, method, body, etc.
    accessToken?: string,
): Promise<T>
{
    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type"))
        headers.set("Content-Type", "application/json");

    if (accessToken)
        headers.set("Authorization", `Bearer ${accessToken}`);

    const response = await fetch(`${API_BASE_URL}${path}`,
        {
            ...options,
            headers,
        });
    
    let responseData: T | BackendError | undefined;

    if (response.status !== 204)
    {
        responseData = await response
            .json()
            .catch(() => undefined);
    }

    if (!response.ok)
        throw new ApiError(response.status, getErrorMessage(responseData as BackendError | undefined));

    return responseData as T;
}
