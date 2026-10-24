import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useLobbies, type LobbyInvite } from "../contexts/LobbiesContext";
import { ErrorType, mapLobbyApiError } from "../utils/errors";
import { RoutePath } from "../utils/utils";
import { MossButton } from "./Buttons";
import ErrorText from "./ErrorText";
import styles from "./LobbyInviteNotifications.module.scss";

interface IInviteNotificationCard
{
    invite: LobbyInvite;
    remainingInvites: number;
}

// A keyed component keeps loading/error state scoped to this invitation.
// When A disappears and B becomes first, B starts with a clean state.
function InviteNotificationCard({ invite, remainingInvites }: IInviteNotificationCard)
{
    const { joinLobby, dismissLobbyInvite } = useLobbies();
    const navigate = useNavigate();
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const cannotJoin = error === ErrorType.lobbyDoesNotExist || error === ErrorType.lobbyFull;

    async function accept()
    {
        if (joining)
            return;

        setJoining(true);
        setError(ErrorType.none);

        try
        {
            await joinLobby(String(invite.lobby_id));
            navigate(`${RoutePath.mpLobby}/${invite.lobby_id}`);
        }
        catch (cause)
        {
            const mapped = mapLobbyApiError(cause);
            // Keep the invitation visible so the recipient can read the error.
            // Known-invalid invitations cannot be retried, but can be dismissed.
            setError(mapped);
        }
        finally
        {
            setJoining(false);
        }
    }

    function dismiss()
    {
        dismissLobbyInvite(invite.lobby_id);
        setError(ErrorType.none);
    }

    return (
        <aside className={styles.notification} role="status" aria-label="Lobby invitation">
            <strong>Lobby invitation</strong>
            <p>
                {invite.inviter.username ?? invite.inviter.display_name ?? "A friend"}
                {" invited you to "}
                <strong>{invite.lobby_name}</strong>
            </p>
            {error !== ErrorType.none && <ErrorText error={error} />}
            <div className={styles.actions}>
                <MossButton label={joining ? "Joining..." : "Join"} disabled={joining || cannotJoin} onClick={() => void accept()} />
                <MossButton label="Dismiss" disabled={joining} onClick={dismiss} />
            </div>
            {remainingInvites > 0 && <small>{remainingInvites} more invitation(s)</small>}
        </aside>
    );
}

// Mounted inside BrowserRouter so invitations are visible on any page,
// not only when the recipient is already browsing lobbies.
export default function LobbyInviteNotifications()
{
    const { auth } = useAuth();
    const { lobbyInvites } = useLobbies();

    if (auth.status !== "authenticated" || lobbyInvites.length === 0)
        return null;

    const invite = lobbyInvites[0];
    return (
        <InviteNotificationCard
            key={invite.lobby_id}
            invite={invite}
            remainingInvites={lobbyInvites.length - 1}
        />
    );
}
