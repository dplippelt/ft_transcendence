import { useNavigate } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import styles from "./Settings.module.scss";

type CheckboxProps =
{
	label: string,
	id: string,
	setting: boolean,
	onChange: ( e: React.ChangeEvent<HTMLInputElement, HTMLInputElement> ) => void,
}

type SliderProps =
{
	label: string,
	min: number,
	max: number,
	setting: number,
	onChange: ( e: React.ChangeEvent<HTMLInputElement, HTMLInputElement> ) => void,
}

type DropdownProps =
{
	label: string,
	options: { value: string, label:string }[],
	setting: string,
	onChange: ( e: React.ChangeEvent<HTMLSelectElement, HTMLSelectElement> ) => void,
}

function PageTitle()
{
	return <div className="menuTitle">Settings</div>
}

function Checkbok( { label, id, setting, onChange } : CheckboxProps )
{
	return (
		<div className={styles.checkbox}>
			<label htmlFor={id}>{label}</label>
			<input
				id={id}
				type="checkbox"
				checked={setting}
				onChange={onChange}/>
		</div>
	);
}

function Slider( { label, min, max, setting, onChange } : SliderProps )
{
	return (
		<div className={styles.slider}>
			<label>{label}</label>
			<div className={styles.track}>
				<input
					type="range"
					min={min}
					max={max}
					value={setting}
					onChange={onChange}/>
				<input
					style={{marginLeft: "1rem"}}
					type="number"
					min={min}
					max={max}
					value={setting}
					onChange={onChange}/>
			</div>
		</div>
	);
}

function Dropdown( { label, options, setting, onChange } : DropdownProps )
{
	return (
		<div className={styles.dropdown}>
			<label>{label}</label>
			<select
				value={setting}
				onChange={onChange}
			>
				{ options.map((opt) =>
					<option key={opt.value} value={opt.value}>{opt.label}</option> ) }
			</select>
		</div>
	);
}

function SettingsWindow()
{
	const settings = useSettings();

	return (
		<div className={styles.settingsWindow}>
			<Checkbok label="Dummy boolean" id="dummyBoolean" setting={settings.dummyBoolean} onChange={ (e) => settings.setDummyBoolean(e.target.checked) } />
			<Slider label="Dummy slider" min={0} max={100} setting={settings.dummySlider} onChange={ (e) => settings.setDummySlider(Number(e.target.value)) } />
			<Dropdown label="Dummy dropdown" options={[ { value: "default", label: "Default setting" }, { value: "alt", label: "Alternative setting" } ]} setting={settings.dummyDropdown} onChange={ (e) => settings.setDummyDropdown(e.target.value) } />
		</div>
	);
}

function Buttons()
{
	const navigate = useNavigate();
	const settings = useSettings();

	return (
		<div className="bottomButtons">
			<button className="buttonV2 backButton" onClick={ () => navigate(-1) }>Back</button>
			<button className="buttonV2" onClick={settings.resetSettings}>Reset Defaults</button>
		</div>
	);
}

export default function Settings()
{
	return (
		<>
			<div className="background" />
			<div className="page">
				<PageTitle/>
				<SettingsWindow/>
				<Buttons/>
			</div>
		</>
	);
}
