import type React from "react";
import SettingsProvider from "./SettingsContext";
import AuthProvider from "./AuthContext";
import UserProvider from "./UserContext";

export default function AppProviders( { children } : { children: React.ReactNode } )
{
	return (
		<AuthProvider>
			<UserProvider>
				<SettingsProvider>
					{children}
				</SettingsProvider>
			</UserProvider>
		</AuthProvider>
	);
}
