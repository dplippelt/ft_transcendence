export default function Turns()
{
  return (
    <div>

      Combat is turn based. You and the enemy take turns until one you reaches 0 HP.<br/>
      <br/>
      At the start of every round you are dealt 8 cards and get new target numbers to hit.<br/>
      You have 30 seconds to come up with an equation to attack the enemy. The timer at the top shows you how much time you have left.<br/>
      You can try to attack as many times as you like within a turn. Attacking with an incorrect equation does not end your turn.<br/>
      Your turn ends as soon as you hit a target, or until the timer runs out.<br/>
      <br/>
      If you manage to hit the enemy, you will be guarded against their next attack and take no damage.<br/>
      If the timer ran out the enemy will attack you and deal damage.<br/>
      After the enemy's turn a new round begins.<br/>
      <br/>
      Opening the game menu during combat pauses the timer in single player and local co-op mode.
      Switching to a different tab or window will automatically open the game menu and pause the game as well.<br/>
      <br/>

    </div>
  );
}
