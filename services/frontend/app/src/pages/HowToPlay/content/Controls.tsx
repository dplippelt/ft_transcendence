import controls_sp from "../../../assets/manual/Controls_SP.png";
import controls_coop_player1 from "../../../assets/manual/Controls_Coop_Player1.png";
import controls_coop_player2 from "../../../assets/manual/Controls_Coop_Player2.png";
import styles from "./Controls.module.scss";

export default function Controls()
{
  return (
    <div>

      Use W A S D to move around the dungeon:<br/>
      <br/>
      <ul className={styles.bulletList}>
        <li>W: up</li>
        <li>A: left</li>
        <li>S: down</li>
        <li>D: right</li>
      </ul>
      <br/>
      <img className={styles.image} src={controls_sp} alt="Single player movement with W A S D" /><br/>
      <br/>
      In local co-op Player 1 uses W A S D to move around:<br/>
      <br/>
      <img className={styles.image} src={controls_coop_player1} alt="Player 1 moving with W A S D" /><br/>
      <br/>
      Player 2 uses the arrow keys:<br/>
      <br/>
      <img className={styles.image} src={controls_coop_player2} alt="Player 2 moving with Arrow keys" /><br/>
      <br/>
    </div>
  );
}
