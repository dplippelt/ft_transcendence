import type React from "react";
import SettingsProvider from "./SettingsContext";
import AuthProvider from "./AuthContext";
import UserProvider from "./UserContext";
import FriendsProvider from "./FriendsContext";
import ChatHistoryProvider from "./ChatHistoryContext";

export default function AppProviders( { children } : { children: React.ReactNode } )
{
	return (
		<AuthProvider>
			<FriendsProvider>
				<ChatHistoryProvider>
					<UserProvider>
						<SettingsProvider>
							{children}
						</SettingsProvider>
					</UserProvider>
				</ChatHistoryProvider>
			</FriendsProvider>
		</AuthProvider>
	);
}
