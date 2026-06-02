import type { AppStates, Controls } from "../../App";
import styles from "./LandingPage.module.css"

type LandingPageProps =
{
	states: AppStates,
	controls: Controls,
}

type ButtonsProps =
{
	controls: Controls,
}

type ExampleProps =
{
	states: AppStates,
}

function AppTitle()
{
	return (
		<div className={styles.appTitle}>Math Crawler</div>
	);
}

function GameDescription()
{
	return (
		<div className={styles.gameDescription}>Short game description, similar to short Steam game descriptions on store pages.</div>
	)
}

function Buttons( { controls } : ButtonsProps )
{
	return (
		<div className={styles.buttons}>
			<button>Login</button>
			<button>Sign-up</button>
			<button>How to play</button>
			<button>Continue as guest</button>
			<button>Game tester</button>
			<button onClick={controls.toggleExamples}>Toggle example</button>
		</div>
	)
}

function Example( { states } : ExampleProps )
{
	return (
		<div className={styles.example}>
			{ states.example_1 ? "Example: true" : "Example: false" }
		</div>
	);
}

export default function LandingPage( { states, controls } : LandingPageProps )
{
	return (
		<div className={styles.landingPage}>
			<AppTitle/>
			<GameDescription/>
			<Buttons controls={controls}/>
			<Example states={states}/>
		</div>
	)
}
