import type React from "react";
import styles from "./TextInput.module.scss";
import { useState } from "react";

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

interface IChatInput
{
	placeholder: string;
	onSend: (message: string) => void;
	ref?: React.Ref<HTMLTextAreaElement>;
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
			<input
				type="text"
				id={id}
				placeholder={placeholder}
				onChange={handleChange}/>
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
			<input
				type="password"
				id={id}
				autoComplete={ isNewPassword ? "new-password" : "current-password" }
				placeholder={placeholder}
				onChange={handleChange}/>
		</>
	);
}

export function ChatInput( { placeholder, onSend, ref } : IChatInput )
{
	const [value, setValue] = useState<string>("");

	function handleChange( e: React.ChangeEvent<HTMLTextAreaElement> )
	{
		setValue(e.target.value);
	}

	function handleKeyDown( e: React.KeyboardEvent<HTMLTextAreaElement> )
	{
		if ( e.key === "Enter" && !e.shiftKey )
		{
			e.preventDefault();
			if ( value.trim().length > 0 )
			{
				onSend(value);
				setValue("");
			}
		}
	}

	return <textarea
				className={styles.chatInput}
				rows={2}
				placeholder={placeholder}
				value={value}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				ref={ref} />;
}
