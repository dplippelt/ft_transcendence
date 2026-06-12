import { defaultSettings, useSettings, type Settings } from "../contexts/SettingsContext";
import styles from "./Settings.module.scss";
import { useRef, useState } from "react";
import Checkbox from "../components/Checkbox";
import Slider from "../components/Slider";
import Dropdown from "../components/Dropdown";
import BackButton from "../components/BackButton";

type SettingsWindowProps =
{
	settingRefs: SettingRefs,
}

type ButtonsProps =
{
	setResetKey: React.Dispatch<React.SetStateAction<number>>,
	settingRefs: SettingRefs,
}

type SettingRefs =
{
	dummyBoolean: React.RefObject<HTMLInputElement | null>,
	dummySlider: React.RefObject<HTMLInputElement | null>,
	dummyDropdown: React.RefObject<HTMLSelectElement | null>,
}

function PageTitle()
{
	return <div className="menuTitle">Settings</div>
}

function SettingsWindow( { settingRefs } : SettingsWindowProps )
{
	const { settings } = useSettings();

	return (
		<div className={styles.settingsWindow}>
			<Checkbox ref={settingRefs.dummyBoolean} label="Dummy boolean" id="dummyBoolean" setting={settings.dummyBoolean} />
			<Slider ref={settingRefs.dummySlider} label="Dummy slider" id="dummySlider" min={0} max={100} setting={settings.dummySlider} />
			<Dropdown ref={settingRefs.dummyDropdown} label="Dummy dropdown" id="dummyDropdown" options={[ { value: "default", label: "Default setting" }, { value: "alt", label: "Alternative setting" } ]} setting={settings.dummyDropdown} />
		</div>
	);
}

function Buttons( { setResetKey, settingRefs } : ButtonsProps )
{
	const { setSettings } = useSettings();

	function saveSettingsToDB(settings: Settings)
	{
		// add saving settings to database here
		void settings;
	}

	function resetSettings()
	{
		setSettings(defaultSettings);
		setResetKey(prev => prev + 1);
		saveSettingsToDB(defaultSettings);
	}

	function applySettings()
	{
		const newSettings: Settings =
		{
			dummyBoolean: settingRefs.dummyBoolean.current!.checked,
			dummySlider: Number(settingRefs.dummySlider.current!.value),
			dummyDropdown: settingRefs.dummyDropdown.current!.value,
		};

		setSettings(newSettings);
		saveSettingsToDB(newSettings);
	}

	return (
		<div className="bottomButtons">
			<BackButton />
			<button className="buttonV2 mobileTop" onClick={resetSettings}>Reset Defaults</button>
			<button className="buttonV2" onClick={applySettings}>Apply</button>
		</div>
	);
}

export default function Settings()
{
	const [resetKey, setResetKey] = useState(0);
	const dummyBooleanRef = useRef<HTMLInputElement | null>(null);
	const dummySliderRef = useRef<HTMLInputElement | null>(null);
	const dummyDropdownRef = useRef<HTMLSelectElement | null>(null);

	const settingRefs: SettingRefs =
	{
		dummyBoolean: dummyBooleanRef,
		dummySlider: dummySliderRef,
		dummyDropdown: dummyDropdownRef,
	}

	return (
		<>
			<div className="background" />
			<div className="page">
				<PageTitle/>
				<SettingsWindow key={resetKey} settingRefs={settingRefs} />
				<Buttons setResetKey={setResetKey} settingRefs={settingRefs}/>
			</div>
		</>
	);
}
