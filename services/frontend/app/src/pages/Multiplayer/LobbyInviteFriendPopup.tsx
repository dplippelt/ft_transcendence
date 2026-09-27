import { PopupButtons } from "../../components/ButtonContainers";
import { MossButton } from "../../components/Buttons";
import { PopupType } from "../../utils/utils";
import React, { useState } from "react";
import { useFriends  } from "../../contexts/FriendsContext";
import Dropdown from "../../components/Dropdown";
import styles from "./LobbyInviteFriendPopup.module.scss";
import ErrorText from "../../components/ErrorText";
import { useLobbies } from "../../contexts/LobbiesContext";
import { ErrorType,mapLobbyApiError, } from "../../utils/errors";

const DEFAULT_VALUE = "None selected";

interface IInvitePopup
{
    lobbyID: string;
	setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
}

// This is just a placeholder popup component for now.
export default function InviteFriendPopup( { lobbyID, setPopupType } : IInvitePopup )
{
    const { friends } = useFriends();
    const { inviteFriend } = useLobbies();
	const [ error, setError ] = useState<ErrorType>(ErrorType.none);
	const [ selectedFriendID, setSelectedFriendID ] = useState<string | undefined>(undefined);

	function closePopup()
	{
		setPopupType(PopupType.none);
	}

	async function handleInvite()
    {
        if (!selectedFriendID)
        {
            setError(ErrorType.noFriendSelected);
            return;
        }

        try
        {
            const delivered = await inviteFriend(lobbyID, Number(selectedFriendID),);

            if (!delivered)
            {
                setError(ErrorType.lobbyInviteNotDelivered);
                return;
            }

            closePopup();
        }
        catch (error)
        {
            setError(mapLobbyApiError(error));
        }
    }

	function handleChange( e: React.ChangeEvent<HTMLSelectElement, Element> )
	{
		const friendID = e.target.value === DEFAULT_VALUE ? undefined : e.target.value;

        setSelectedFriendID(friendID);
        setError(ErrorType.none);
	}

	const friendOptions = [
		{ value: DEFAULT_VALUE, label: DEFAULT_VALUE },
		...Object.entries(friends).map(([friendID, { username }]) => ({ value: friendID, label: username, }))
	];

	return (
		<>
			{ error !== ErrorType.none && <ErrorText error={error} /> }
			<Dropdown extraStyling={styles.dropdown} label="Select friend" id="friend" options={friendOptions} setting={DEFAULT_VALUE} onChange={handleChange} />
			<PopupButtons>
				<MossButton label="Invite" onClick={handleInvite} />
				<MossButton label="Cancel" onClick={closePopup} />
			</PopupButtons>
		</>
	)
}
