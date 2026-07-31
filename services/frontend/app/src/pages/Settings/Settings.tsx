import { defaultSettings, useSettings, type ISettings } from "../../contexts/SettingsContext";
import styles from "./Settings.module.scss";
import { useRef, useState } from "react";
import type React from "react";
import { MenuTitle } from "../../components/PageTitle";
import { BottomButtons } from "../../components/ButtonContainers";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { BackButton, BottomButton } from "../../components/Buttons";
import Checkbox from "../../components/Checkbox";
import Slider from "../../components/Slider";
import Dropdown from "../../components/Dropdown";
import { MobilePosition, RoutePath } from "../../utils/utils";
import SideBar from "../../components/SideBar";
import { useLocation } from "react-router-dom";

interface ISettingsWindow
{
	settingRefs: SettingRefs;
}

interface IButtons
{
	setResetKey: React.Dispatch<React.SetStateAction<number>>;
	settingRefs: SettingRefs;
}

type SettingRefs =
{
	dummyBoolean: React.RefObject<HTMLInputElement | null>,
	dummySlider: React.RefObject<HTMLInputElement | null>,
	dummyDropdown: React.RefObject<HTMLSelectElement | null>,
}

function SettingsWindow( { settingRefs } : ISettingsWindow )
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

function Buttons( { setResetKey, settingRefs } : IButtons )
{
	const settings = useSettings();
	const location = useLocation();
	const path = location.state?.from ?? RoutePath.mainMenu;

	function saveSettingsToDB(settings: ISettings)
	{
		// add saving settings to database here
		void settings;
	}

	function resetSettings()
	{
		settings.resetSettings();
		setResetKey(prev => prev + 1);
		saveSettingsToDB(defaultSettings);
	}

	function applySettings()
	{
		const newSettings: ISettings =
		{
			dummyBoolean: settingRefs.dummyBoolean.current!.checked,
			dummySlider: Number(settingRefs.dummySlider.current!.value),
			dummyDropdown: settingRefs.dummyDropdown.current!.value,
		};

		settings.applySettings(newSettings);
		saveSettingsToDB(newSettings);
	}

	return (
		<BottomButtons>
			<BackButton path={path} />
			<BottomButton label="Reset Defaults" onClick={resetSettings} mobilePosition={MobilePosition.top} />
			<BottomButton label="Apply" onClick={applySettings} />
		</BottomButtons>
	);
}

// TODO: if not logged in redirect to landing page
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
			<Background />
			<Page>
				<MenuTitle title="Settings"/>
				<SettingsWindow key={resetKey} settingRefs={settingRefs} />
				<Buttons setResetKey={setResetKey} settingRefs={settingRefs}/>
				<SideBar />
			</Page>
		</>
	);
}
