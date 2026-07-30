import type React from "react";
import styles from "./TextInput.module.scss";
import { EventBus } from "../game/EventBus";
import { GameEvent } from "../utils/utils";
import { useEffect, useRef } from "react";

interface ITextInput
{
	label: string;
	placeholder: string;
	id: string;
    setter: (value: React.SetStateAction<string>) => void;
    type?: React.HTMLInputTypeAttribute;
    maxLength?: number;
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
	onSend: () => void;
	msg: string;
	setMsg: React.Dispatch<React.SetStateAction<string>>;
}

export function TextInput( { label, placeholder, id, setter, type = "text", maxLength } : ITextInput )
{
	function handleChange( e: React.ChangeEvent<HTMLInputElement> )
	{
		setter(e.target.value);
	}

	return (
		<>
			<label htmlFor={id}>{label}</label>
			<input
				type={type}
				id={id}
                placeholder={placeholder}
                maxLength={maxLength}
                onChange={handleChange}
            />
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

export function ChatInput( { placeholder, onSend, msg, setMsg } : IChatInput )
{
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

	/* When on the game page chat input focus / unfocus toggles whether keyboard
	 * input is enabled for the game. This useEffect makes sure that clicking anywhere
	 * outside of a Side Bar that contains a ChatInput also unfocuses the textarea
	 * element. Without it, only clicking somewhere inside the Side Bar, but outside
	 * the textarea element would unfocus it. */
	useEffect(() =>
	{
		function handlePointerDown( e: PointerEvent )
		{
			if ( textAreaRef.current && !textAreaRef.current.contains(e.target as Node) )
				textAreaRef.current.blur();
		}

		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [])

	function handleChange( e: React.ChangeEvent<HTMLTextAreaElement> )
	{
		setMsg(e.target.value);
	}

	function handleKeyDown( e: React.KeyboardEvent<HTMLTextAreaElement> )
	{
		if ( e.key === "Enter" && !e.shiftKey )
		{
			e.preventDefault();
			onSend();
		}
	}

	return <textarea
				ref={textAreaRef}
				className={styles.chatInput}
				rows={2}
				placeholder={placeholder}
				value={msg}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				onFocus={ () => EventBus.emit(GameEvent.chatFocus, true) }
				onBlur={ () => EventBus.emit(GameEvent.chatFocus, false) } />;
}
