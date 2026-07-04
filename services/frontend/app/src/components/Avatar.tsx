import type { JSX } from "react";
import styles from "./Avatar.module.scss";

export enum AvatarSize
{
	smaller,
	small,
	medium,
	large,
}

const sizes: Record<AvatarSize, string> =
{
	[AvatarSize.smaller]: styles.smaller,
	[AvatarSize.small]: styles.small,
	[AvatarSize.medium]: styles.medium,
	[AvatarSize.large]: styles.large,
}

interface IAvatar
{
	src: string;
	alt: string;
	size: AvatarSize;
	onClick?: () => void;
	extraStyling?: string;
}

export default function Avatar( { src, alt, size, onClick, extraStyling="" } : IAvatar )
{
	const img: JSX.Element = <img className={`${styles.avatar} ${sizes[size]} ${extraStyling}`} src={src} alt={alt} />;

	if ( onClick )
		return <button className={styles.avatarButton} onClick={onClick}>{img}</button>

	return img;
}

