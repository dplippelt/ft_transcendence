import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_OPS_MASK, getOperatorsMask, isValidOpsMaskStr } from "../utils/utils";
import { useAuth } from "./AuthContext";

const OPERATORS_STORAGE_KEY = "operators";

interface IOperatorsContext
{
	operators: number;
	saveOperators: ( ops: number ) => void;
	resetOperators: () => void;
}

const OperatorContext = createContext<IOperatorsContext | null>(null);

export default function OperatorsProvider( { children } : { children: ReactNode } )
{
	const { auth } = useAuth();
	const operatorsKey = `${OPERATORS_STORAGE_KEY}_${auth.user?.id ?? "guest"}`;

	const [operators, setOperators] = useState<number>(parseInt(DEFAULT_OPS_MASK, 2));

	useEffect(() =>
	{
		const rawOpsMask = localStorage.getItem(operatorsKey);
		const opsMask = rawOpsMask && isValidOpsMaskStr(rawOpsMask) ? rawOpsMask : DEFAULT_OPS_MASK;
		setOperators(parseInt(opsMask, 2));
	}, [operatorsKey])

	function saveOperators( ops: number )
	{
		setOperators(ops);
		localStorage.setItem(operatorsKey, getOperatorsMask(ops));
	}

	function resetOperators()
	{
		setOperators(parseInt(DEFAULT_OPS_MASK, 2));
		localStorage.setItem(operatorsKey, DEFAULT_OPS_MASK);
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
