import { useChatHistory } from "../contexts/ChatHistoryContext";
import { useFriends } from "../contexts/FriendsContext";
import { useLobbies } from "../contexts/LobbiesContext";
import { useUser } from "../contexts/UserContext";
import { DRAFT_STORAGE_PREFIX } from "../utils/utils";

function clearStorageByPrefix( prefix: string )
{
	for ( let i = localStorage.length - 1; i >= 0; i-- )
	{
		const key = localStorage.key(i);
		if ( key?.startsWith(prefix) )
			localStorage.removeItem(key);
	}
}

export default function useSessionCleanup()
{
	const { resetUser } = useUser()
	const { resetFriends } = useFriends();
	const { resetChatHistory } = useChatHistory();
	const { resetLobbies } = useLobbies();

	function sessionCleanup()
	{
		resetUser();
		resetFriends();
		resetChatHistory();
		resetLobbies();
		clearStorageByPrefix(DRAFT_STORAGE_PREFIX);
	}

	return sessionCleanup;
}
