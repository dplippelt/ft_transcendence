export enum MobilePosition
{
	top = "mobileTop",
	bottom = "mobileBottom",
}

export enum MobileView
{
	friends,
	chat,
}

export enum AvatarSize
{
	smaller,
	small,
	medium,
	large,
}

export enum PopupType
{
	none,
	addFriend,
	removeFriend,
	inviteFriend,
	editAvatar,
    editUsername,
    editDisplayName,
	editPassword,
	createLobby,
	localCoop,
}

export enum Tab
{
	account,
	stats,
}

export enum SortBy
{
	name,
	nameRev,
	players,
	playersRev,
	noSort,
}

export enum JoinStatus
{
	ok,
	pending,
	failed,
}

export enum RoutePath
{
	landingPage = "/",
    auth = "/auth",
    completeProfile = "/complete-profile",
	mainMenu = "/main-menu",
	multiplayer = "/multiplayer",
	mpLobby = "/multiplayer/lobby",
	mpBrowser = "/multiplayer/browser",
	friends = "/friends",
	profile = "/profile",
	leaderboard = "/leaderboard",
	howToPlay = "/how-to-play",
	settings = "/settings",
	gameDev = "/game-dev",
	game = "/game-dev", //TODO: change path to just "/game" or "/sp-game" later
	gameOver = "/game-over",
}

export enum RouteParam
{
	login = "?mode=login",
	signup = "?mode=signup",
	lobbyID = "/:lobbyID",
	gameResult = "/:gameResult",
}

export enum GameEvent
{
	gameMenu = "game-menu",
	gameVis = "game-visibility",
	chatFocus = "chat-focused",
	gameOver = "game-over",
	inCombat = "in-combat",
}

export enum CombatEvent
{
	initPlayerHP = "init-player-hp",
	updatePlayerHP = "update-player-hp",
	initEnemyHP = "init-enemy-hp",
	updateEnemyHP = "update-enemy-hp",
	initPlayerMP = "init-player-mp",
	updatePlayerMP = "update-player-mp",
	initTurnTimer = "init-turn-timer",
	attack = "attack",
	draw = "draw",
	reset = "reset",
	turnEnded = "turn-ended",
}

export enum GameResult
{
	won = "won",
	lost = "lost",
}

export const DRAFT_STORAGE_PREFIX = "draft:";
const FRIEND_DRAFT = "friend:"
const LOBBY_DRAFT = "lobby:";

export function getFriendDraftKey( userID: string, activeFriendID: string ) : string
{
	return DRAFT_STORAGE_PREFIX + FRIEND_DRAFT + userID + ":" + activeFriendID;
}

export function getLobbyDraftKey( userID: string, lobbyID: string ) : string
{
	return DRAFT_STORAGE_PREFIX + LOBBY_DRAFT + userID + ":" + lobbyID;
}

