import { createContext, useContext, useState, type ReactNode } from "react";
import { DEFAULT_OPS_MASK } from "../utils/utils";

interface IOperatorsContext
{
	operators: number;
  saveOperators: ( ops: number ) => void;
	resetOperators: () => void;
}

const OperatorContext = createContext<IOperatorsContext | null>(null);

export default function OperatorsProvider( { children } : { children: ReactNode } )
{
	const [operators, setOperators] = useState<number>(parseInt(DEFAULT_OPS_MASK, 2));

	function saveOperators( ops: number )
	{
		setOperators(ops);
	}

	function resetOperators()
	{
		setOperators(parseInt(DEFAULT_OPS_MASK, 2));
	}

	return (
		<OperatorContext.Provider
			value=
			{{
				operators,
        saveOperators,
				resetOperators,
			}}
		>
			{children}
		</OperatorContext.Provider>
	);
}

export function useOperators(): IOperatorsContext
{
	const context = useContext(OperatorContext);

	if (!context)
		throw new Error("useOperators() must be used within OperatorsProvider");

	return context;
}
