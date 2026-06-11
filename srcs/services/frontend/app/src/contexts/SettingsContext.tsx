import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type SettingsContextType =
{
	settings: Settings,
	setSettings: React.Dispatch<React.SetStateAction<Settings>>,
}

export type Settings =
{
	// define data type for each setting
	dummyBoolean: boolean,
	dummySlider: number,
	dummyDropdown: string,
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const defaultSettings: Settings =
{
	// define default settings for each setting
	dummyBoolean: true,
	dummySlider: 50,
	dummyDropdown: "default",
};

export default function SettingsProvider( { children } : {children: ReactNode} )
{
	const [settings, setSettings] = useState<Settings>(defaultSettings);

	// mock template for later when loading settings info from database after login (e.g. when user hits F5 to reload page)
	// at the moment when you hit F5 everything is rerendered and settings info will be set to default again.
	// turn it into a custom hook because it also needs to be called in the login / signup button handler after a succesful login/sign-up

	// useEffect(() =>
	// {
	// 	async function loadSettings()
	// 	{
	// 		const sessionToken = localStorage.getItem("sessionToken");
	// 		if (await isValidToken(sessionToken))
	// 			setSettings(await fetchDbSettings(sessionToken));
	// 	}
	// 	loadSettings();
	// }, []);

	return (
		<SettingsContext.Provider
			value=
			{{
				settings, setSettings,
			}}>
			{children}
		</SettingsContext.Provider>
	);
}

// import and use useSettings() anywhere you want to reference or change settings values.
export function useSettings()
{
	return useContext(SettingsContext)!;
}
