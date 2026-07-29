import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import guestAvatar from "../assets/guest_avatar_test.jpg";
import { useAuth } from "./AuthContext";
import { useFriends } from "./FriendsContext";
import { useChatHistory } from "./ChatHistoryContext";

interface IUserContext
{
	user: IUser;
	updateUsername: ( username: string ) => void;
	resetUser: () => void;
	updateAvatar: ( newAvatar: string ) => void;
}

export interface IUser
{
	// define data type for each User value
	userID: string;
	username: string;
	avatar: string;
}

const UserContext = createContext<IUserContext | null>(null);

export const defaultUser: IUser =
{
	// define default User values
	userID: "Guest",
	username: "Guest",
	avatar: guestAvatar,
};

export default function UserProvider( { children } : {children: ReactNode} )
{
	const { auth } = useAuth();
	const { resetFriends } = useFriends();
	const { updateUsername: updateUsernameInChatHistory, resetChatHistory } = useChatHistory();

	const authUser: IUser = auth.user
		? {
			userID: String(auth.user.id),
			username: auth.user.username ?? auth.user.display_name ?? "Guest",
			avatar: auth.user.avatar_url ?? guestAvatar,
		}
		: defaultUser;

	// Local-only overlay on top of the real logged-in user, for edits that
	// aren't persisted to the backend yet (see updateUsername/updateAvatar
	// below). Dropped whenever the authenticated user changes so a new
	// login doesn't inherit the previous account's unsaved edits.
	const [overrides, setOverrides] = useState<Partial<IUser>>({});

	useEffect(() =>
	{
		setOverrides({});
	}, [authUser.userID]);

	const user: IUser = { ...authUser, ...overrides };

	function updateUsername( newUsername: string )
	{
		const oldUsername = user.username;
		updateUsernameInChatHistory(oldUsername, newUsername);
		// TODO: persist via PUT /users/{id} once profile editing is wired
		// up (FT-49) -- local-only for now.
		setOverrides(prev => ({ ...prev, username: newUsername }));
	}

	function resetUser()
	{
		setOverrides({});
		resetFriends();
		resetChatHistory();
	}

	function updateAvatar( newAvatar: string )
	{
		// TODO: persist via PUT /users/{id} once profile editing is wired
		// up (FT-49) -- local-only for now.
		setOverrides(prev => ({ ...prev, avatar: newAvatar }));
	}

	return (
		<UserContext.Provider
			value=
			{{
				user, updateUsername, resetUser, updateAvatar,
			}}>
			{children}
		</UserContext.Provider>
	);
}

// import and use useUser() anywhere you want to reference or change User values.
export function useUser()
{
	const context = useContext(UserContext);
	if ( !context )
		throw new Error("useUser() must be used within a UserProvider");
	return context;
}
