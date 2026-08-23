import { EnemyHPBar, PlayerHPBar, PlayerMPBar } from "./Bar";
import { AttackButton, DrawButton, ResetButton } from "./CombatButtons";

interface ICombatUI
{
	inCombat: boolean;
}

export default function CombatUI( { inCombat } : ICombatUI )
{
	return (
		<>
			{ inCombat &&
				<>
					<PlayerHPBar />
					<PlayerMPBar />
					<EnemyHPBar />
					<ResetButton />
					<DrawButton />
					<AttackButton />
				</>
			}
		</>
	);
}
