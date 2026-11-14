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
    const { lobbies, switchToInvitedLobby, dismissLobbyInvite } = useLobbies();
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [joining, setJoining] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const currentLobby = Object.values(lobbies).find(lobby =>
        lobby.id !== invite.lobby_id &&
        lobby.members.some(member => member.user.id === auth.user?.id)
    );
    const currentRole = currentLobby?.members.find(member => member.user.id === auth.user?.id)?.role;
    const [error, setError] = useState<ErrorType>(ErrorType.none);
    const cannotJoin = error === ErrorType.lobbyDoesNotExist || error === ErrorType.lobbyFull;

    async function accept(confirmed = false)
    {
        if (joining)
            return;

        // Give the user a chance to cancel before any destructive request.
        // The backend also enforces this when our lobby cache is stale.
        if (!confirmed && currentLobby)
        {
            setConfirming(true);
            return;
        }

        setJoining(true);
        setError(ErrorType.none);

        try
        {
            await switchToInvitedLobby(String(invite.lobby_id), confirmed);
            navigate(`${RoutePath.mpLobby}/${invite.lobby_id}`);
        }
        catch (cause)
        {
            const mapped = mapLobbyApiError(cause);
            if (mapped === ErrorType.lobbySwitchConfirmationRequired)
            {
                // The server found an old membership unknown to this tab.
                setConfirming(true);
                return;
            }

            // Keep failed invitations visible so the error can be read.
            setConfirming(false);
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
        setConfirming(false);
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
            {confirming ? (
                <div className={styles.confirmation} role="alertdialog" aria-label="Confirm lobby switch" aria-describedby="switch-confirmation">
                    <p id="switch-confirmation">
                        {currentRole === "host"
                            ? `Joining ${invite.lobby_name} will close your current lobby (${currentLobby?.name}) for everyone.`
                            : currentRole === "guest"
                                ? `Joining ${invite.lobby_name} will leave your current lobby (${currentLobby?.name}).`
                                : `Joining ${invite.lobby_name} will leave or close your existing lobby.`}
                        {" Continue?"}
                    </p>
                    <div className={styles.actions}>
                        <MossButton label={joining ? "Switching..." : "Leave & join"} disabled={joining} onClick={() => void accept(true)} />
                        <MossButton label="Cancel" disabled={joining} onClick={() => setConfirming(false)} />
                    </div>
                </div>
            ) : (
                <>
                    {error !== ErrorType.none && <ErrorText error={error} />}
                    <div className={styles.actions}>
                        <MossButton label={joining ? "Joining..." : "Join"} disabled={joining || cannotJoin} onClick={() => void accept()} />
                        <MossButton label="Dismiss" disabled={joining} onClick={dismiss} />
                    </div>
                </>
            )}
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
