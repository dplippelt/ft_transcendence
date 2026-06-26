import type React from "react";

interface ITextInput
{
	label: string;
	placeholder: string;
	id: string;
	setter: (value: React.SetStateAction<string>) => void;
}

interface IPasswordInput
{
	label: string;
	placeholder: string;
	isNewPassword: boolean;
	id: string;
	setter: (value: React.SetStateAction<string>) => void;
}

export function TextInput( { label, placeholder, id, setter } : ITextInput )
{
	function handleChange( e: React.ChangeEvent<HTMLInputElement> )
	{
		setter(e.target.value);
	}

	return (
		<>
			<label htmlFor={id}>{label}</label>
			<input type="text" id={id} placeholder={placeholder} onChange={handleChange}/>
		</>
	);
}

export function PasswordInput( { label, placeholder, isNewPassword, id, setter } : IPasswordInput )
{
	function handleChange( e: React.ChangeEvent<HTMLInputElement> )
	{
		setter(e.target.value);
	}

	return (
		<>
			<label htmlFor={id}>{label}</label>
			<input type="password" id={id} autoComplete={ isNewPassword ? "new-password" : "current-password" } placeholder={placeholder} onChange={handleChange}/>
		</>
	);
}
