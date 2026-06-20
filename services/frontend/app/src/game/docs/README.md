## Combat Scene Description

### Layout

- The combat scene layout is similar to [Slay the Spire](combatimage.png).

**Objects**
- Card Hand
	- Located at [6/11 × screen width, 1/6 × screen height] (needs to check)
	- Using Container Game Object Class to combine card style and number/operator(text) together:
        - [Reference example](https://labs.phaser.io/phaser4-index.html?path=game+objects%2Fcontainer)
        - Number cards 
		- Operator cards (+, -, *, /, %)
		- Item cards (healing items, buffs, etc.)
	- Needs to handle input events for each card
	- List of Cards Objects aligned on card hand line
		- A Group object of card objects
	- Static image
	- [Reference example](https://labs.phaser.io/phaser4-index.html?path=actions)
	- CardBase: Base class for all card objects
		- Set card size and color for the background and stroke
		- Other card types, such as NumberCard, OperatorCard, and ItemCard, inherit from CardBase
		- This has a DataManager at a GameObject level
	- Implementation Order
		1. Create card objects
		2. Initialize the card hand with card objects.
		3. Handle card selection with mouse input
            - [Reference example](https://labs.phaser.io/phaser4-index.html?path=input%2Fmouse)
            - Handling Input (mouse events) and Selection
                - The CardHand container should be responsible for managing card positions including aligning the cards with a line. Ideally, CardBase only know whether it is currently hovered or not, while CardHand handles the visual response (e.g., moving the card slightly upward). However pointer events are triggered based on each card's hit area, so hover detection and the movement should be managed by the CardBase objects. The hit area, particularly its height, should be adjusted while the card is hovered. Otherwise, pointer events may repeatedly fire when the cursor is positioned near the boundary of the hit area.
                - Card selection by clicking a card should only be update the card's internal boolean. The CardHand container is responsible for arranging cards according to their current state (in hand or selected) during the update cycle.
                - Selection rules (for example, allowing only two number cards and one operator card) should be enforced by the CardHand container. Therefore, CardHand should control whether individual cards are allowed to respond to input (only click event) interactions.
		4. Align the card objects like hand card
		5. Add a new card object (drawing from deck)

- Selected Cards List
	- Located in the top-right corner
	- Displays the cards currently selected by the player
	- Static image
	- There are three slots: left operand, operator, and right operand
	- Implementation Order
		1. Display placeholders for the selected card
		2. Add selected card with size scaled properly and remove it by clicking
		3. Synchronize with the card hand when cards are selected.

- Attack Button
	- Implementation Order
		1. Display the attack button
		2. Trigger the attack action based on the selected cards.


- Deck
	- Located in the bottom-right corner
	- Displays the number of remaining cards
	- Static image
	- Implementation Order
		1. Displays the deck placeholder
		2. Generate deck for the combat
		3. Displays the number of remaining cards
		4. Implement card drawing through mouse input
		5. Add the drawn card to the player's hand.

- Player
	- Located at (3/11 × screen width, 3/6 × screen height)
	- Displays:
		- Health Points (HP)
		- Mana, which is used for extra actions (e.g., drawing an additional card)
	- Needs idle animations
	- Needs attack animations when performing attacks.
	- Static image
	- [Reference example](https://labs.phaser.io/phaser4-view.html?src=src%5Canimation%5Cmixed%20animation.js&return=phaser4-index.html%3Fpath%3Danimation)
	- inherit from the same base class as Enemy such as CombatSprite

- Enemy
	- Located at (9/11 × screen width, 3/6 × screen height)
	- Displays:
		- Health Points (HP)
	- Needs idle animations
	- Needs attack animations when performing attacks.
	- Static image
	- [Reference example](https://labs.phaser.io/phaser4-view.html?src=src%5Canimation%5Cmixed%20animation.js&return=phaser4-index.html%3Fpath%3Danimation)
	- inherit from the same base class as Enemy such as CombatSprite

- Calculation Timer
	- Located in the top-left corner
	- Limits the time available for completing a calculation
	- Displays the remaining time over a static image (e.g., a clock)
	- [Reference example](https://labs.phaser.io/phaser4-index.html?path=time)

- Turn indication
	- Displays whether it is the player's turn or the enemy's turn.
	- Text over a static image (like a bar)

- Background

### Player Actions
- Select cards using the mouse
	- [Reference example](https://labs.phaser.io/phaser4-index.html?path=input%2Fmouse)
- Draw an extra card from the deck
	- Available only during the player's turn
	- Triggered by clicking the deck
	- Costs 1 mana
- Press the Attack button after the calculation is completed

### Visual Effects
- Idle animations for the player and enemy
- Attack animations for both the player and enemy
- Card movement animations when cards are selected or dragged or when the combat starts
- Screen shake effect when:
	- The player attacks
	- The player takes damage
	- The enemy takes damage
	- [Reference example](https://labs.phaser.io/phaser4-view.html?src=src%5Ccamera%5Cshake.js&return=phaser4-index.html%3Fpath%3Dcamera)

### Conditions for the end
- Victory: the enemy's HP reaches zero.
	- Update the states of both the player and the enemy accordingly
- Game Over: the player's HP reaches zero

### Implementation
- The `Combat` class in `Combat.ts` is a Scene which is responsible for creating and managing all combat-related objects, actions, and effects.
- Game objects are implemented by extending `Phaser.GameObjects.Sprite` or other appropriate Phaser Game Object classes and added to the Scene through the Scene's GameObjectFactory.
- Player actions are implemented by handling user input events.
- Visual effects are implemented using Phaser systems such as animations, tweens, and camera effects.


### Memo about Phaser API
- Game Instance (from Phaser.Game class object)
	- Scene Manager
		- Display List
		- Animation Manager
		- Data Manager
		- Game Objects (can be instanciated from Phaser.GameObjects.Sprite() class object)
		- Tweens
		- Physics
	- Data Manager

### More
- Pass enemy data and player status (e.g., HP) between the Combat and Dungeon scenes
- Transition between the Combat and Dungeon scenes without unnecessarily recreating game objects
