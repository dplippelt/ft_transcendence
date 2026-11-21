import equation_1 from "../../../assets/manual/Equation_Selection_1.png";
import equation_2 from "../../../assets/manual/Equation_Selection_2.png";
import attack_button from "../../../assets/manual/Attack_Button.png";
import redraw_button from "../../../assets/manual/Redraw_Button.png";
import styles from "./Equation.module.scss";

export default function Equation()
{
  return (
    <div>

      To deal damage to the enemy build an equation from your cards that results in one of the target numbers.<br/>
      <br/>
      To start building you equation pick a card from your hand to move it to the selected cards. Click it again to take it back out.<br/>
      <br/>
      <img className={styles.image} src={equation_1} alt="Picking a card 1"></img><br/>
      An equation always alternates number and operators. It always starts and ends with a number.<br/>
      You should use no more than 3 operators per equation (7 cards).<br/>
      <br/>
      <img className={styles.image} src={equation_2} alt="Creating a valid equation"></img><br/>
      <br/>
      The number of operators you choose to include in your equation determines against which target number it is compared:
      <ul className={styles.bulletList}>
        <li>1 operator: green target (2 damage)</li>
        <li>2 operators: yellow target (4 damage)</li>
        <li>3 operators: red target (8 damage)</li>
      </ul>
      <br/>
      So '20 - 26' can only hit a green target with value '-6', even if there is a target with value -6 in another color.<br/>
      <br/>
      The equations are calculated using normal math rules: mulitplication, division and modulo are calculated before plus and minus. Otherwise it goes from left to right.<br/>
      You cannot divide by zero or use modulo with 0.<br/>
      <br/>
      Press the attack button to evaluate your equation against the enemy's target numbers.<br/>
      <br/>
      <img className={styles.image} src={attack_button} alt="Attack button"></img><br/>
      If it is a hit, the enemy takes damage and your turn ends. It will also guard you against the enemy's next attack.<br/>
      If the equation is invalid or doesn't match a target nothing happens and you can keep trying until the timer runs out.<br/>
      When the timer runs out the enemy will attack you.<br/>
      <br/>
      If you are stuck you can spend 1 mana to redraw your cards and get new target numbers.<br/>
      <br/>
      <img className={styles.image} src={redraw_button} alt="Redraw button"></img><br/>

    </div>
  );
}
