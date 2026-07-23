import React from "react";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import { BottomButtons } from "../../components/ButtonContainers";
import ColumnButton, { BackButton, JoinButton, RefreshButton } from "../../components/Buttons";
import { RoutePath, SortBy } from "../../utils/utils";
import styles from "./LobbiesBrowser.module.scss";
import { useLobbies, type LobbieData } from "../../contexts/LobbiesContext";
import { useEffect, useState } from "react";

type Lobby = [string, LobbieData];

interface ILobbies
{
	lobbiesArr: Lobby[];
}

interface IColumnTitles
{
	sortBy: SortBy;
	setSortBy: React.Dispatch<React.SetStateAction<SortBy>>;
	sortLobbies: () => void;
}

function ColumnTitles( { sortBy, setSortBy, sortLobbies } : IColumnTitles )
{
	function onSortByName()
	{
		setSortBy(prev => {
			switch ( prev )
			{
				case SortBy.name:
					return SortBy.nameRev;
				case SortBy.nameRev:
					return SortBy.noSort;
				case SortBy.noSort:
					return SortBy.name;
				default:
					return SortBy.name;
			}
		});
	}

	function onSortByPlayers()
	{
		setSortBy(prev => {
			switch ( prev )
			{
				case SortBy.players:
					return SortBy.playersRev;
				case SortBy.playersRev:
					return SortBy.noSort;
				case SortBy.noSort:
					return SortBy.players;
				default:
					return SortBy.players;
			}
		});
	}

	function getNameSortBy()
	{
		if ( sortBy === SortBy.name || sortBy === SortBy.nameRev )
			return sortBy;
		return SortBy.noSort;
	}

	function getPlayersSortBy()
	{
		if ( sortBy === SortBy.players || sortBy === SortBy.playersRev )
			return sortBy;
		return SortBy.noSort;
	}

	// TODO: change sortLobbies to refreshLobbies once added to context (backend integration)
	return (
		<div className={styles.columnTitles}>
			<ColumnButton label="Name" onClick={onSortByName} sortBy={getNameSortBy()} />
			<ColumnButton label="Players" onClick={onSortByPlayers} sortBy={getPlayersSortBy()} extraStyling={styles.players} />
			<RefreshButton onClick={sortLobbies} />
		</div>
	);
}

function Lobbies( { lobbiesArr } : ILobbies )
{
	return (
		<div className={styles.lobbies}>
			{ lobbiesArr.map(([hostID, { lobbyName, guestID }]) =>
				<div className={styles.lobby} key={hostID}>
					<div className={styles.lobbyName}>{lobbyName}</div>
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
	const [ sortBy, setSortBy ] = useState<SortBy>(SortBy.noSort);

	function sortByLobbyName(
		[, { lobbyName: lobbyName_a }]: Lobby,
		[, { lobbyName: lobbyName_b }]: Lobby, )
	{ return lobbyName_a.localeCompare(lobbyName_b); }

	function sortByLobbyNameRev(
		[, { lobbyName: lobbyName_a }]: Lobby,
		[, { lobbyName: lobbyName_b }]: Lobby, )
	{ return lobbyName_b.localeCompare(lobbyName_a); }

	function sortByPlayers(
		[, { guestID: a }]: Lobby,
		[, { guestID: b }]: Lobby )
	{
		if (a === undefined && b !== undefined) return -1;
		if (a !== undefined && b === undefined) return 1;
		return 0;
	}

	function sortByPlayersRev(
		[, { guestID: a }]: Lobby,
		[, { guestID: b }]: Lobby )
	{
		if (a === undefined && b !== undefined) return 1;
		if (a !== undefined && b === undefined) return -1;
		return 0;
	}

	// TODO: needs to fetch lobbies from database (backend integration) - add refreshLobbies method to LobbiesContext
	function sortLobbies()
	{
		switch ( sortBy )
		{
			case SortBy.name:
				setLobbiesArr(Object.entries(lobbies).sort(sortByLobbyName));
				break;
			case SortBy.nameRev:
				setLobbiesArr(Object.entries(lobbies).sort(sortByLobbyNameRev));
				break;
			case SortBy.players:
				setLobbiesArr(Object.entries(lobbies).sort(sortByPlayers));
				break;
			case SortBy.playersRev:
				setLobbiesArr(Object.entries(lobbies).sort(sortByPlayersRev));
				break;
			default:
				setLobbiesArr(Object.entries(lobbies));
		}
	}

	useEffect(sortLobbies, [sortBy, lobbies]);

	return (
		<div className={styles.browserWindow}>
			<ColumnTitles sortBy={sortBy} setSortBy={setSortBy} sortLobbies={sortLobbies} />
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
