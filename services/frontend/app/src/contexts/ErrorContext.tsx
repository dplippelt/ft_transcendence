import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { ErrorType } from "../utils/errors";

interface IErrorContext
{
	error: ErrorType;
	setError: React.Dispatch<React.SetStateAction<ErrorType>>;
	resetError: () => void;
}

const defaultError: ErrorType = ErrorType.none

const ErrorContext = createContext<IErrorContext | null>(null);

export default function ErrorProvider( { children } : {children: ReactNode} )
{
	const [error, setError] = useState<ErrorType>(defaultError);

	function resetError()
	{
		setError(defaultError);
	}

	return (
		<ErrorContext.Provider
			value=
			{{
				error,
				setError,
				resetError
			}}>
			{children}
		</ErrorContext.Provider>
	);
}

// import and use useError() anywhere you want to reference or change settings values.
export function useError()
{
	const context = useContext(ErrorContext);
	if ( !context )
		throw new Error("useError() must be used within a ErrorProvider");
	return context;
}
