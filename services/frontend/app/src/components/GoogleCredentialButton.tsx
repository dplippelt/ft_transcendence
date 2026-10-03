import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

import styles from "./GoogleCredentialButton.module.scss";

interface GoogleCredentialButtonProps
{
    onCredential: (credential: string) => void;
    onError: () => void;
}

export default function GoogleCredentialButton({
    onCredential,
    onError,
}: GoogleCredentialButtonProps)
{
    const containerRef = useRef<HTMLDivElement>(null);
    const [buttonWidth, setButtonWidth] = useState<number>(0);

    useEffect(() =>
    {
        const element = containerRef.current;

        if (!element)
            return;

        const observer = new ResizeObserver(entries =>
        {
            const width = Math.floor(entries[0].contentRect.width);

            setButtonWidth(Math.min(width, 400));
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return (
        <div
            className={styles.googleCredentialButton}
            ref={containerRef}
        >
            {buttonWidth > 0 &&
                <GoogleLogin
                    theme="filled_black"
                    shape="rectangular"
                    text="continue_with"
                    width={buttonWidth}
                    onSuccess={credentialResponse =>
                    {
                        if (!credentialResponse.credential)
                        {
                            onError();
                            return;
                        }

                        onCredential(credentialResponse.credential);
                    }}
                    onError={onError}
                />
            }
        </div>
    );
}
