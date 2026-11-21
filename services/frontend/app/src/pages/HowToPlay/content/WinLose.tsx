export default function WinLose()
{
  return (
    <div>

      Reduce the enemy's HP to 0 during a combat encounter to win teh fight. The enemy is removed from the dungeon and you can continue exploring.<br/>
      <br/>
      Defeat every enemy on a level to unlock the door to the exit.<br/>
      Walk onto the exit staircase to finish the level. In co-op every player that is still alive needs to reach the exit to finish the level.<br/>
      <br/>
      Clear all levels to win the game. An indicator at the top of dungeon view shows you on which level you currently are.<br/>
      <br/>
      If your HP reaches 0 during a fight you lose.<br/>
      In single player this means it is game over. In co-op the remaining player can carry on by themselves.
      If they manage to reach the exit, the defeated player will be revived at the start of the next level.<br/>
      <br/>

    </div>
  );
}
