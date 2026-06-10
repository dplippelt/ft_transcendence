import { useNavigate } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import styles from "./Settings.module.scss";
import { useRef, useState } from "react";

type CheckboxProps =
{
	ref: React.RefObject<HTMLInputElement | null>,
	label: string,
	id: string,
	setting: boolean,
}

type SliderProps =
{
	ref: React.RefObject<HTMLInputElement | null>,
	label: string,
	id: string,
	min: number,
	max: number,
	setting: number,
}

type DropdownProps =
{
	ref: React.RefObject<HTMLSelectElement | null>,
	label: string,
	id: string,
	options: { value: string, label:string }[],
	setting: string,
}

type SettingsWindowProps =
{
	settingRefs: SettingRefs,
}

type ButtonsProps =
{
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

function Checkbok( { ref, label, id, setting } : CheckboxProps )
{
	return (
		<div className={styles.checkbox}>
			<label htmlFor={id}>{label}</label>
			<input
				ref={ref}
				id={id}
				type="checkbox"
				defaultChecked={setting}/>
		</div>
	);
}

function Slider( { ref, label, id, min, max, setting } : SliderProps )
{
	const [value, setValue] = useState<number>(setting);

	return (
		<div className={styles.slider}>
			<label htmlFor={id}>{label}</label>
			<div className={styles.track}>
				<input
					ref={ref}
					type="range"
					min={min}
					max={max}
					value={value}
					onChange={ (e) => setValue(Number(e.target.value))}/>
				<input
					id={id}
					style={{marginLeft: "1rem"}}
					type="number"
					min={min}
					max={max}
					value={value}
					onChange={ (e) => setValue(Number(e.target.value))}/>
			</div>
		</div>
	);
}

function Dropdown( { ref, label, id, options, setting } : DropdownProps )
{
	return (
		<div className={styles.dropdown}>
			<label htmlFor={id}>{label}</label>
			<select
				ref={ref}
				id={id}
				defaultValue={setting}
			>
				{ options.map((opt) =>
					<option key={opt.value} value={opt.value}>{opt.label}</option> ) }
			</select>
		</div>
	);
}

function SettingsWindow( { settingRefs } : SettingsWindowProps )
{
	const settings = useSettings();

	return (
		<div className={styles.settingsWindow}>
			<Checkbok ref={settingRefs.dummyBoolean} label="Dummy boolean" id="dummyBoolean" setting={settings.dummyBoolean} />
			<Slider ref={settingRefs.dummySlider} label="Dummy slider" id="dummySlider" min={0} max={100} setting={settings.dummySlider} />
			<Dropdown ref={settingRefs.dummyDropdown} label="Dummy dropdown" id="dummyDropdown" options={[ { value: "default", label: "Default setting" }, { value: "alt", label: "Alternative setting" } ]} setting={settings.dummyDropdown} />
		</div>
	);
}

function Buttons( { settingRefs } : ButtonsProps )
{
	const navigate = useNavigate();
	const settings = useSettings();

	function applySettings()
	{
		settings.setDummyBoolean(settingRefs.dummyBoolean.current!.checked);
		settings.setDummySlider(Number(settingRefs.dummySlider.current!.value));
		settings.setDummyDropdown(settingRefs.dummyDropdown.current!.value);

		// add saving settings to database here
	}

	return (
		<div className="bottomButtons">
			<button className="buttonV2 mobileBottom" onClick={ () => navigate(-1) }>Back</button>
			<button className="buttonV2 mobileTop" onClick={settings.resetSettings}>Reset Defaults</button>
			<button className="buttonV2" onClick={applySettings}>Apply</button>
		</div>
	);
}

export default function Settings()
{
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
				<SettingsWindow settingRefs={settingRefs} />
				<Buttons settingRefs={settingRefs}/>
			</div>
		</>
	);
}
