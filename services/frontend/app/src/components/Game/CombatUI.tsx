import { EnemyHPBar, PlayerHPBar, PlayerMPBar } from "./Bar";
import { AttackButton, DrawButton, ResetButton } from "./CombatButtons";
import TurnTimer from "./TurnTimer";

interface ICombatUI
{
	inCombat: boolean;
}

export default function CombatUI( { inCombat } : ICombatUI )
{
	if ( !inCombat )
		return null;

	return (
		<>
			<PlayerHPBar />
			<PlayerMPBar />
			<EnemyHPBar />
			<ResetButton />
			<DrawButton />
			<AttackButton />
			<TurnTimer />
		</>
	);
}
