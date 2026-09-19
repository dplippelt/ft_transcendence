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
    twoFactor,
    createLobby,
    localCoop,
    operatorSelection,
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

export enum RouteParamKey
{
	mode = "mode",
	ops = "ops",
}

export enum RouteParamValue
{
	login = "login",
	signup = "signup",
}

export enum RouteParam
{
	lobbyID = "/:lobbyID",
}

export enum GameEvent
{
	gameMenu = "game-menu",
	gameVis = "game-visibility",
	chatFocus = "chat-focused",
	gameState = "game-state",
	inCombat = "in-combat",
	pause = "pause",
	blur = "blur",
}

export enum CombatEvent
{
	initPlayerHP = "init-player-hp",
	updatePlayerHP = "update-player-hp",
	initEnemyHP = "init-enemy-hp",
	updateEnemyHP = "update-enemy-hp",
	initPlayerMP = "init-player-mp",
	updatePlayerMP = "update-player-mp",
	initTurn = "init-turn",
	pauseTimer = "pause-timer",
	attack = "attack",
	draw = "draw",
	// reset = "reset",
	turnEnded = "turn-ended",
	getTurnTimerState = "turn-timer-state",
	getInitPlayerHp = "get-init-player-hp",
	getInitPlayerMp = "get-init-player-mp",
	getInitEnemyHp = "get-init-enemy-hp",
	getCurrPlayerHp = "get-curr-player-hp",
	getCurrPlayerMp = "get-curr-player-mp",
	getCurrEnemyHp = "get-curr-enemy-hp",
}

export enum GameState
{
	default = "default",
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

// Shared username/display_name fallback chain -- used anywhere a user needs
// to be shown as a single display string, so the precedence (and fallback
// text) can't silently drift between call sites.
export function getDisplayName( user: { username: string | null; display_name: string | null }, fallback = "Unknown" ) : string
{
	return user.username ?? user.display_name ?? fallback;
}

export function buildRoute( path: RoutePath, params: Partial<Record<RouteParamKey, string>> ) : string
{
	const query = new URLSearchParams(params as Record<string, string>).toString();
	const fullPath = `${path}?${query}`;
	return fullPath;
}

export enum OperatorBit
{
	none = 0,
	plus = 1 << 0,
	minus = 1 << 1,
	multiply = 1 << 2,
	modulo = 1 << 3,
	divide = 1 << 4,
}

type Bit = "0" | "1";
type OpsMaskStr = `${Bit}${Bit}${Bit}${Bit}${Bit}`;

export const DEFAULT_OPS_MASK = "00011";

export function isValidOpsMaskStr(value: string): value is OpsMaskStr
{
	return /^[01]{5}$/.test(value) && parseInt(value, 2) > 0;
}
