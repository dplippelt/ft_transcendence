import dungeon_overview from "../../../assets/manual/DungeonExploration.png";
import styles from "./Exploration.module.scss";

export default function Exploration()
{
  return (
    <div>

      Every dungeon is randomly generated so no two runs will ever be the same.
      Your goal is to reach the exit, a staircase that leads further down the dungeon. <br/>
      <br/>
      <img className={styles.image} src={dungeon_overview} alt="Dungeon exploration overview"></img> <br/>
      <br/>
      You start at a random location within the dungeon. Walk from room to room to find the exit. <br/>
      <br/>
      Enemies roam the dungeon. When they see you, they will start to chase you. If they catch you a fight begins. <br/>
      <br/>
      The door to the exit remains locked until all enemies on a level have been defeated. <br/>
      <br/>
      To finish a level walk onto the exit staircase. This will load the next level or finish the game if it is the last level.<br/>
      <br/>

    </div>
  );
}
