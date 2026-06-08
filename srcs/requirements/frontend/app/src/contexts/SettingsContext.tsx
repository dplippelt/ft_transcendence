import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type SettingsContextType =
{
	// define types for each setting value, setting setter, and other functions that are part of the context
	dummySetting: boolean,
	setDummySetting: React.Dispatch<React.SetStateAction<boolean>>,
	resetSettings: () => void,
}

type Settings =
{
	// define data type for each setting
	dummySetting: boolean,
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const defaultSettings: Settings =
{
	// define default settings for each setting
	dummySetting: true,
};

function loadSettings()
{
	const settings = defaultSettings; // replace with getter from backend database if exists in database, else load default settings
	return settings;
}

export default function SettingsProvider( { children } : {children: ReactNode} )
{
	const [settings] = useState<Settings>(loadSettings());

	// define individual settings here, e.g. const [dummySetting, setDummySetting] = useState<boolean>(settings.dummySetting);
	const [dummySetting, setDummySetting] = useState<boolean>(settings.dummySetting);


	function resetSettings()
	{
		// set each setting to defaultSetting, e.g. setDummySetting(defaultSettings.dummySetting);
		setDummySetting(defaultSettings.dummySetting);
	}

	return (
		<SettingsContext.Provider
			value=
			{{
				dummySetting, setDummySetting,
				resetSettings,
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
