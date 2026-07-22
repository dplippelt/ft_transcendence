import React from "react";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import { BottomButtons } from "../../components/ButtonContainers";
import ColumnButton, { BackButton, JoinButton } from "../../components/Buttons";
import { RoutePath } from "../../utils/utils";
import styles from "./LobbiesBrowser.module.scss";
import { useLobbies, type LobbieData } from "../../contexts/LobbiesContext";
import { useEffect, useState } from "react";

enum SortBy
{
	host,
	players,
}

type Lobby = [string, LobbieData];

interface ILobbies
{
	lobbiesArr: Lobby[];
}

interface IColumnTitles
{
	setSortBy: React.Dispatch<React.SetStateAction<SortBy>>;
}

function ColumnTitles( { setSortBy } : IColumnTitles )
{
	return (
		<div className={styles.columnTitles}>
			<ColumnButton label="Host" onClick={ () => { setSortBy(SortBy.host) } } />
			<ColumnButton label="Players" onClick={ () => { setSortBy(SortBy.players) } } extraStyling={styles.players} />
		</div>
	);
}

function Lobbies( { lobbiesArr } : ILobbies )
{
	return (
		<div className={styles.lobbies}>
			{ lobbiesArr.map(([hostID, { lobbyName, guestID }]) =>
				<div className={styles.lobby} key={hostID}>
					<div>{lobbyName}</div>
					<div className={styles.players}>{guestID ? "2/2" : "1/2"}</div>
					<JoinButton lobbyID={hostID} />
				</div>
			)}
		</div>
	);
}

function BrowserWindow()
{
	const { lobbies } = useLobbies();
	const [ lobbiesArr, setLobbiesArr ] = useState<Lobby[]>([]);
	const [ sortBy, setSortBy ] = useState<SortBy>(SortBy.host);

	function sortByLobbyName(
		[, { lobbyName: lobbyName_a }]: Lobby,
		[, { lobbyName: lobbyName_b }]: Lobby,
	)
	{
		return lobbyName_a.localeCompare(lobbyName_b);
	}

	function sortByOpenLobbiesFirst(
		[, { guestID: a }]: Lobby,
		[, { guestID: b }]: Lobby )
	{
		if (a === undefined && b !== undefined)
			return -1;
		if (a !== undefined && b === undefined)
			return 1;
		return 0;
	}

	useEffect(() =>
	{
		if ( sortBy === SortBy.host )
			setLobbiesArr(Object.entries(lobbies).sort(sortByLobbyName))
		else
			setLobbiesArr(Object.entries(lobbies).sort(sortByOpenLobbiesFirst));
	}, [sortBy]);

	return (
		<div className={styles.browserWindow}>
			<ColumnTitles setSortBy={setSortBy} />
			<Lobbies lobbiesArr={lobbiesArr}  />
		</div>
	)
}

function Buttons()
{
	return (
		<BottomButtons>
			<BackButton path={RoutePath.multiplayer} />
		</BottomButtons>
	);
}

export default function LobbiesBrowser()
{
	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Lobbies Browser" />
				<BrowserWindow />
				<Buttons />
				<SideBar />
			</Page>
		</>
	);
}
