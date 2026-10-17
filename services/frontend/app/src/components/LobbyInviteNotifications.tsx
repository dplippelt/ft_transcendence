import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useLobbies } from "../contexts/LobbiesContext";
import { ErrorType, mapLobbyApiError } from "../utils/errors";
import { RoutePath } from "../utils/utils";
import { MossButton } from "./Buttons";
import ErrorText from "./ErrorText";
import styles from "./LobbyInviteNotifications.module.scss";

// Mounted inside BrowserRouter so invitations are visible on any page,
// not only when the recipient is already browsing lobbies.
export default function LobbyInviteNotifications()
{
    const { auth } = useAuth();
    const { lobbyInvites, joinLobby, dismissLobbyInvite } = useLobbies();
    const navigate = useNavigate();
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<ErrorType>(ErrorType.none);

    if (auth.status !== "authenticated" || lobbyInvites.length === 0)
        return null;

    const invite = lobbyInvites[0];

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

            if (mapped === ErrorType.lobbyDoesNotExist || mapped === ErrorType.lobbyFull)
            {
                dismissLobbyInvite(invite.lobby_id);
                setError(ErrorType.none);
                return;
            }

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
                <MossButton label={joining ? "Joining..." : "Join"} disabled={joining} onClick={() => void accept()} />
                <MossButton label="Dismiss" disabled={joining} onClick={dismiss} />
            </div>
            {lobbyInvites.length > 1 && <small>{lobbyInvites.length - 1} more invitation(s)</small>}
        </aside>
    );
}
