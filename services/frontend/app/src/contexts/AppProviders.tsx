import type React from "react";
import SettingsProvider from "./SettingsContext";
import AccountProvider from "./AccountContext";

export default function AppProviders( { children } : { children: React.ReactNode } )
{
	return (
		<AccountProvider>
			<SettingsProvider>
				{children}
			</SettingsProvider>
		</AccountProvider>
	);
}
