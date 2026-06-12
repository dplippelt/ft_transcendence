## Combat Scene Description

### Layout

- The combat scene layout is similar to Slay the Spire.

**Objects**
- Card Hand
	- Located at (6/11 × screen width, 1/6 × screen height)
	- Contains:
		- Number cards
		- Operator cards (+, -, *, /, %)
		- Item cards (healing items, buffs, etc.)
- Enemy
	- Located at (9/11 × screen width, 3/6 × screen height)
	- Displays:
		- Health Points (HP)
- Player
	- Located at (3/11 × screen width, 3/6 × screen height)
	- Displays:
		- Health Points (HP)
		- Mana, which is used for extra actions (e.g., drawing an additional card)
- Deck
	- Located in the bottom-right corner
	- Displays the number of remaining cards
- Selected Cards List
	- Located in the top-right corner
	- Displays the cards currently selected by the player
- Calculation Timer
	- Located in the top-left corner
	- Limits the time available for completing a calculation

**Player Actions**
- Select cards using the mouse
- Draw an extra card from the deck
	- Available only during the player's turn
	- Triggered by clicking the deck
	- Costs 1 mana
- Press the Attack button after the calculation is completed

**Visual Effects**
- Idle animations for the player and enemy
- Attack animations for both the player and enemy
- Card movement animations when cards are selected or dragged
- Screen shake effect when:
	- The player attacks
	- The player takes damage
	- The enemy takes damage

**Implementation**
- The `Combat` class in `Combat.ts` is responsible for creating and managing all combat-related objects, actions, and effects.


**A little bit about Phaser API**
- Game Instance (from Phaser.Game class object)
	- Scene Manager
		- Animation Manager
		- Data Manager
		- Game Objects (can be instanciated from Phaser.GameObjects.Sprite() class object)
		- Tweens
		- Physics
	- Data Manager