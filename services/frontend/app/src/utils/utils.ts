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
	settings = "/settings",
	gameDev = "/game-dev",
	game = "/game-dev", //TODO: change path to just "/game" or "/sp-game" later
}

export enum RouteParam
{
	login = "?mode=login",
	signup = "?mode=signup",
	lobbyID = "/:lobbyID",
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

