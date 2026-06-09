import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type SettingsContextType =
{
	// define types for each setting value, setting setter, and other functions that are part of the context
	dummyBoolean: boolean,
	setDummyBoolean: React.Dispatch<React.SetStateAction<boolean>>,
	dummySlider: number,
	setDummySlider: React.Dispatch<React.SetStateAction<number>>,
	dummyDropdown: string,
	setDummyDropdown: React.Dispatch<React.SetStateAction<string>>,
	resetSettings: () => void,
}

type Settings =
{
	// define data type for each setting
	dummyBoolean: boolean,
	dummySlider: number,
	dummyDropdown: string,
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const defaultSettings: Settings =
{
	// define default settings for each setting
	dummyBoolean: true,
	dummySlider: 50,
	dummyDropdown: "default",
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
	const [dummyBoolean, setDummyBoolean] = useState<boolean>(settings.dummyBoolean);
	const [dummySlider, setDummySlider] = useState<number>(settings.dummySlider);
	const [dummyDropdown, setDummyDropdown] = useState<string>(settings.dummyDropdown)


	function resetSettings()
	{
		// set each setting to defaultSetting, e.g. setDummySetting(defaultSettings.dummySetting);
		setDummyBoolean(defaultSettings.dummyBoolean);
		setDummySlider(defaultSettings.dummySlider);
		setDummyDropdown(defaultSettings.dummyDropdown);
	}

	return (
		<SettingsContext.Provider
			value=
			{{
				dummyBoolean, setDummyBoolean,
				dummySlider, setDummySlider,
				dummyDropdown, setDummyDropdown,
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
