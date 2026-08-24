import { useState } from "react";
import type React from "react";

import styles from "./AccountTab.module.scss";
import sharedStyle from "./Tab.module.scss";

import Popup from "../../components/Popup";
import EditPopup from "./EditPopup";
import GoogleLinkButton from "./GoogleLinkButton";

import { EditButton } from "../../components/Buttons";
import { PopupType, AvatarSize, } from "../../utils/utils";

import AvatarImg from "../../components/Avatar";
import { useCurrentUser } from "../../contexts/AuthContext";
import noAvatar from "../../assets/no_avatar.png";


interface IAccountInfo
{
    setPopupType: React.Dispatch< React.SetStateAction<PopupType>>;
}


function Avatar({ setPopupType }: IAccountInfo)
{
    const user = useCurrentUser();

    return (
        <>
            <div className={sharedStyle.profileLabel}>
                Avatar:
            </div>

            <AvatarImg
                src={user.avatar_url ?? noAvatar}
                fallbackSrc={noAvatar}
                alt="User avatar"
                size={AvatarSize.medium}
            />

            <EditButton
                popupType={PopupType.editAvatar}
                setPopupType={setPopupType}
            />
        </>
    );
}


function Username({ setPopupType }: IAccountInfo)
{
    const user = useCurrentUser();

    return (
        <>
            <div className={sharedStyle.profileLabel}> Username:</div>
            <div className={sharedStyle.textInfo}> {user.username ?? "Not set"} </div>
            <EditButton
                popupType={PopupType.editUsername}
                setPopupType={setPopupType}
            />
        </>
    );
}


function DisplayName({ setPopupType }: IAccountInfo)
{
    const user = useCurrentUser();

    return (
        <>
            <div className={sharedStyle.profileLabel}>
                Display name:
            </div>

            <div className={sharedStyle.textInfo}>
                {user.display_name ?? "Not set"}
            </div>

            <EditButton
                popupType={PopupType.editDisplayName}
                setPopupType={setPopupType}
            />
        </>
    );
}


function Password({ setPopupType }: IAccountInfo)
{
    const user = useCurrentUser();
    const hasPassword = user.linked_providers.includes("password");

    return (
        <>
            <div className={sharedStyle.profileLabel}>
                Password:
            </div>

            <div className={sharedStyle.textInfo}>
                {hasPassword ? "••••••••" : "Not set"}
            </div>

            <EditButton
                popupType={PopupType.editPassword}
                setPopupType={setPopupType}
            />
        </>
    );
}


function GoogleAccount()
{
    const user = useCurrentUser();
    const isGoogleLinked = user.linked_providers.includes("google");

    return (
        <>
            <div className={sharedStyle.profileLabel}>
                Google account:
            </div>

            <div className={sharedStyle.textInfo}>
                {isGoogleLinked ? "Linked" : "Not linked"}
            </div>

            <GoogleLinkButton />
        </>
    );
}


export default function Account()
{
    const [popupType, setPopupType] = useState<PopupType>(PopupType.none);

    return (
        <div className={styles.accountInfo}>
            <Avatar setPopupType={setPopupType} />
            <Username setPopupType={setPopupType} />
            <DisplayName setPopupType={setPopupType} />
            <Password setPopupType={setPopupType} />
            <GoogleAccount />

            {popupType !== PopupType.none &&
                <Popup>
                    <EditPopup
                        popupType={popupType}
                        setPopupType={setPopupType}
                    />
                </Popup>
            }
        </div>
    );
}
