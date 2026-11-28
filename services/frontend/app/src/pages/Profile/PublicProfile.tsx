import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getUserProfile } from "../../api/usersApi";
import type { PublicUser } from "../../api/friendsApi";
import { ApiError } from "../../api/http";
import { useAuth, useCurrentUser } from "../../contexts/AuthContext";
import { useFriends } from "../../contexts/FriendsContext";
import { AvatarSize, RoutePath } from "../../utils/utils";
import Avatar from "../../components/Avatar";
import Background from "../../components/Background";
import { BottomButtons } from "../../components/ButtonContainers";
import { BackButton } from "../../components/Buttons";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import noAvatar from "../../assets/no_avatar.png";
import sharedStyle from "./Tab.module.scss";
import styles from "./PublicProfile.module.scss";

interface IProfileResult
{
    userID: number;
    viewerID: number;
    user?: PublicUser;
    error?: string;
}

export default function PublicProfile()
{
    const { userID } = useParams();
    const { auth } = useAuth();
    const currentUser = useCurrentUser();
    const { friends, incomingRequests, outgoingRequests } = useFriends();
    const [result, setResult] = useState<IProfileResult | null>(null);

    const parsedID = Number(userID);
    const validID = Boolean(userID && /^[1-9]\d*$/.test(userID) && Number.isSafeInteger(parsedID));

    useEffect(() =>
    {
        if ( !validID || parsedID === currentUser.id || !auth.accessToken )
            return;

        let cancelled = false;
        const accessToken = auth.accessToken;

        getUserProfile(parsedID, accessToken)
            .then(user =>
            {
                if ( cancelled )
                    return;
                setResult({ userID: parsedID, viewerID: currentUser.id, user });
            })
            .catch(err =>
            {
                if ( cancelled )
                    return;
                setResult({
                    userID: parsedID,
                    viewerID: currentUser.id,
                    error: err instanceof ApiError && err.status === 404 ? "Player not found" : "Unable to load player profile",
                });
            });

        return () => { cancelled = true; };
    }, [validID, parsedID, currentUser.id, auth.accessToken]);

    if ( validID && parsedID === currentUser.id )
        return <Navigate to={RoutePath.profile} replace />;

    const profileResult = validID && result?.userID === parsedID && result.viewerID === currentUser.id ? result : null;
    const user = profileResult?.user;

    function getFriendshipStatus(): string
    {
        if ( !user )
            return "Not friends";
        if ( friends[String(user.id)] )
            return "Friends";
        if ( incomingRequests.some(request => request.userID === String(user.id)) )
            return "Incoming friend request";
        if ( outgoingRequests.some(request => request.userID === String(user.id)) )
            return "Friend request pending";
        return "Not friends";
    }

    return (
        <>
            <Background />
            <Page>
                <MenuTitle title="Player Profile" />
                <div className={styles.profileWindow}>
                    { !validID ? <div>Invalid player ID</div>
                    : profileResult?.error ? <div role="alert">{profileResult.error}</div>
                    : !user ? <div>Loading profile...</div>
                    :
                        <div className={styles.profileInfo}>
                            <div className={sharedStyle.profileLabel}>Avatar:</div>
                            <Avatar src={user.avatar_url ?? noAvatar} fallbackSrc={noAvatar} alt={`${user.username ?? "Player"}'s avatar`} size={AvatarSize.medium} />
                            <div className={sharedStyle.profileLabel}>Username:</div>
                            <div className={sharedStyle.textInfo}>{user.username ?? "Not set"}</div>
                            <div className={sharedStyle.profileLabel}>Display name:</div>
                            <div className={sharedStyle.textInfo}>{user.display_name ?? "Not set"}</div>
                            <div className={sharedStyle.profileLabel}>Friendship:</div>
                            <div className={sharedStyle.textInfo}>{getFriendshipStatus()}</div>
                            { friends[String(user.id)] && <>
                                <div className={sharedStyle.profileLabel}>Status:</div>
                                <div className={sharedStyle.textInfo}>{friends[String(user.id)].isOnline ? "Online" : "Offline"}</div>
                              </> }
                        </div>
                    }
                </div>
                <BottomButtons>
                    <BackButton fallback={RoutePath.friends} />
                </BottomButtons>
            </Page>
        </>
    );
}
