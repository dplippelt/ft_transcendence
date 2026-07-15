import type React from "react";
import SettingsProvider from "./SettingsContext";
import AuthProvider from "./AuthContext";
import UserProvider from "./UserContext";
import FriendsProvider from "./FriendsContext";
import ChatHistoryProvider from "./ChatHistoryContext";
import LobbiesProvider from "./LobbiesContext";

export default function AppProviders( { children } : { children: React.ReactNode } )
{
	return (
		<AuthProvider>
			<LobbiesProvider>
				<ChatHistoryProvider>
					<FriendsProvider>
						<UserProvider>
							<SettingsProvider>
								{children}
							</SettingsProvider>
						</UserProvider>
					</FriendsProvider>
				</ChatHistoryProvider>
			</LobbiesProvider>
		</AuthProvider>
	);
}
