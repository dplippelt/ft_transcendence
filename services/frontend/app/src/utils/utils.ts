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
}

export enum Tab
{
	account,
	stats,
}

export enum RoutePath
{
	landingPage = "/",
	auth = "/auth",
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

