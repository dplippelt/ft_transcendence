import { useNavigate } from "react-router-dom";
import type React from "react";
import styles from "./Buttons.module.scss";
import { EditWindowType } from "../pages/Profile/enums";
import { SendHorizontal } from "lucide-react";

interface IMenuButton
{
	label: string;
	onClick: () => void;
}

interface IMossButton
{
	label: string;
	onClick: () => void;
	extraStyling?: string,
	mobilePosition?: string;
}

interface IBottomButton
{
	label: string;
	onClick: () => void;
	mobilePosition?: string;
}

interface IEditButton
{
	editType: EditWindowType;
	setEditWindowType: React.Dispatch<React.SetStateAction<EditWindowType>>;
}

interface ITextButton
{
	label: string;
	onClick: () => void;
	extraStyling?: string,
}

interface ITabButton
{
	label: string;
	isSelected: boolean;
	onClick: () => void;
}

interface ISendButton
{
	onClick: () => void;
}

export function MenuButton( { label, onClick } : IMenuButton )
{
	return <button className={styles.menuButton} onClick={onClick}>{label}</button>
}

export function MossButton( { label, onClick, extraStyling="", mobilePosition="" } : IMossButton )
{
	return <button className={`${styles.mossButton} ${extraStyling} ${mobilePosition}`} onClick={onClick}>{label}</button>;
}

export function BottomButton( { label, onClick, mobilePosition="" } : IBottomButton )
{
	return <button className={`${styles.bottomButton} ${mobilePosition}`} onClick={onClick}>{label}</button>;
}

export function BackButton()
{
	const navigate = useNavigate();

	return <BottomButton label="Back" onClick={ () => navigate(-1) } mobilePosition="mobileBottom" />;
}

export function EditButton( { editType, setEditWindowType } : IEditButton )
{
	return <MossButton label="Edit" onClick={ () => setEditWindowType(editType) } extraStyling={styles.editButton}/>;
}

export function TextButton( { label, onClick, extraStyling="" } : ITextButton )
{
	return <button className={`${styles.textButton} ${extraStyling}`} onClick={onClick}>{label}</button>
}

export function TabButton( { label, isSelected, onClick } : ITabButton )
{
	return <button className={ isSelected ? styles.tabSelected : styles.tabNotSelected } onClick={onClick}>{label}</button>
}

export function SendButton( { onClick } : ISendButton )
{
	return (
		<button className={styles.sendButton} onClick={onClick}>
			<SendHorizontal />
		</button>
	);
}
