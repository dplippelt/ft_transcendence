import combat_overview from "../../../assets/manual/Combat_View.png";
import styles from "./Combat.module.scss";

export default function Combat()
{
  return (
    <div>

      When an enemy catches you, you will need to defeat them in combat.<br/>
      <br/>
      <img className={styles.image} src={combat_overview} alt="Combat overview"></img><br/>
      <br/>
      The combat view consists of different elements:<br/>
      <ul className={styles.numberedList}>
        <li>Your HP: your health is shown in red. When it reaches 0, you have lost and the game is over. You start with 10 at the start of every combat encounter</li>
        <li>Your MP: your mana is shown in blue. Used to draw new cards. You start with 5 at the start of every encounter</li>
        <li>Enemy HP: the enemy's health. Drop the enemy HP to 0 to defeat them.</li>
        <li>Player hand: the cards available to you for play. It consists of a mix of number and operator cards. You always have 8 cards available to you during a combat round</li>
        <li>Target numbers: the target numbers you are trying to hit to deal damage to the enemy. The colors show how many operators you need to use to calculate them and how much damage you deal:</li>
        <ul className={styles.bulletList}>
          <li>Green: 1 operator, 2 damage</li>
          <li>Yellow: 2 operators, 4 damage</li>
          <li>Red: 3 operator, 8 damage</li>
        </ul>
        <li>Selected cards: the cards you have picked to calculate one of the target numbers</li>
        <li>Turn timer: you have 30 seconds to build your equation. After 30 seconds the turn automatically switches to the enemy</li>
        <li>Redraw cards: you can spend 1 mana to redraw all cards in your hand</li>
        <li>Attack: Attack the enemy with the equation you have built. If it matches one of the targets you will deal the corresponding damage to the enemy</li>
      </ul>
      <br/>
      See the next section on Building an equation for how to calculate a target number.<br/>
      <br/>

    </div>
  );
}

// 1. Your HP: your health. When it reaches 0, the game is over. You start with 10.
// 2. Your mana: used to draw a new hand. You start with 5.
// 3. Enemy HP: the enemy's health. Bring it to 0 to win the fight.
// 4. Target numbers: the numbers you need to make with your cards. Their colour shows how many operators to use, and how much damage you deal:
//    - Green: 1 operator, 2 damage
//    - Yellow: 2 operators, 4 damage
//    - Red: 3 operators, 8 damage
// 5. Your hand: 8 cards, with numbers and operators.
// 6. Selected cards: the cards you've picked for your equation.
// 7. Turn timer: you have 30 seconds to build your equation.
// 8. Attack: submits your equation.
// 9. Draw: swaps your whole hand for a new one. Costs 1 mana.

// See Building an equation for how to make a target number.
