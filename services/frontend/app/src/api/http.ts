const API_BASE_URL =
	import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// This represnts one FastAPI validation error, we only care about the message, but there are type and loc.
interface ValidationError
{
	loc?: (string | number)[];
	msg?: string;
}

interface ApiErrorDetail
{
    code: string;
    message: string;
}

// FastAPI can return detail in two relevant fromats, either JSON object with a string detail, or an array of FastAPI/Pydantic validation errors.
interface BackendError
{
    detail?: string | ApiErrorDetail | ValidationError[];
}

// Custom error class to represent API errors with a status code and message.
export class ApiError extends Error
{
    status: number;
    code?: string;
    validationErrors?: ValidationError[];

    constructor(
        status: number,
        message: string,
        code?: string,
        validationErrors?: ValidationError[],
    )
    {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.validationErrors = validationErrors;
    }
}

function getApiError(error: BackendError | undefined,): { message: string; code?: string; validationErrors?: ValidationError[]; }
{
    if (typeof error?.detail === "string")
    {
        return { message: error.detail, };
    }

    if (error?.detail && !Array.isArray(error.detail) && typeof error.detail === "object")
    {
        return {
            message: error.detail.message,
            code: error.detail.code,
        };
    }

    if (Array.isArray(error?.detail))
    {
        const messages = error.detail
            .map(item => item.msg)
            .filter((message): message is string => Boolean(message));

        return { message: messages.join(", ") || "Invalid input", validationErrors: error.detail };
    }

    return { message: "Request failed", };
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
    {
        const apiError = getApiError(responseData as BackendError | undefined);
    
        throw new ApiError(
            response.status,
            apiError.message,
            apiError.code,
            apiError.validationErrors,
        );
    }

    return responseData as T;
}
