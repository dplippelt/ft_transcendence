import type React from "react";
import type { JSX } from "react";

import styles from "./Avatar.module.scss";
import { AvatarSize } from "../utils/utils";


const sizes: Record<AvatarSize, string> =
{
	[AvatarSize.smaller]: styles.smaller,
	[AvatarSize.small]: styles.small,
	[AvatarSize.medium]: styles.medium,
	[AvatarSize.large]: styles.large,
};


interface IAvatar
{
	src: string;
	alt: string;
	size: AvatarSize;
	onClick?: () => void;
	extraStyling?: string;
	fallbackSrc?: string;
}


export default function Avatar({ src, alt, size, onClick, extraStyling = "", fallbackSrc, }: IAvatar)
{
    function handleImageError(event: React.SyntheticEvent<HTMLImageElement>,)
    {
        if (!fallbackSrc)
            return;

        const image = event.currentTarget;

        // Prevent an infinite loop if the fallback image also fails.
        image.onerror = null;
        image.src = fallbackSrc;
    }

    const image: JSX.Element = (
        <img
            className={
                `${styles.avatar} ` +
                `${sizes[size]} ` +
                extraStyling
            }
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={handleImageError}
        />
    );

    if (onClick)
    {
        return (
            <button
                className={styles.avatarButton}
                type="button"
                onClick={onClick}
            >
                {image}
            </button>
        );
    }

    return image;
}
