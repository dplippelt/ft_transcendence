import React, { useMemo, useState } from "react";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import { BottomButtons } from "../../components/ButtonContainers";
import ColumnButton, { BackButton, JoinButton, RefreshButton } from "../../components/Buttons";
import { RoutePath, SortBy } from "../../utils/utils";
import styles from "./LobbiesBrowser.module.scss";
import { useLobbies, type LobbyData } from "../../contexts/LobbiesContext";
import { ErrorType } from "../../utils/errors";
import Popup from "../../components/Popup";
import ErrorPopup from "../../components/ErrorPopup";
import { useError } from "../../contexts/ErrorContext";

type Lobby = [string, LobbyData];

interface ILobbies
{
	lobbiesArr: Lobby[];
}

interface IColumnTitles
{
	sortBy: SortBy;
	setSortBy: React.Dispatch<React.SetStateAction<SortBy>>;
}

function ColumnTitles( { sortBy, setSortBy } : IColumnTitles )
{
	const { refreshLobbies } = useLobbies();

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

	return (
		<div className={styles.columnTitles}>
			<ColumnButton label="Name" onClick={onSortByName} sortBy={getNameSortBy()} />
			<ColumnButton label="Players" onClick={onSortByPlayers} sortBy={getPlayersSortBy()} extraStyling={styles.players} />
			<RefreshButton onClick={refreshLobbies} />
		</div>
	);
}

function Lobbies( { lobbiesArr } : ILobbies )
{
	return (
		<div className={styles.lobbies}>
			{ lobbiesArr.map(([lobbyID, { lobbyName, guestID }]) =>
				<div className={styles.lobby} key={lobbyID}>
					<div className={styles.lobbyName}>{lobbyName}</div>
					<div className={styles.players}>{guestID ? "2/2" : "1/2"}</div>
					<JoinButton lobbyID={lobbyID} />
				</div>
			)}
		</div>
	);
}

function BrowserWindow()
{
	const { lobbies } = useLobbies();
	const [ sortBy, setSortBy ] = useState<SortBy>(SortBy.noSort);
	const lobbiesArr = useMemo(sortLobbies, [sortBy, lobbies]);

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
		if (a === null && b !== null) return -1;
		if (a !== null && b === null) return 1;
		return 0;
	}

	function sortByPlayersRev(
		[, { guestID: a }]: Lobby,
		[, { guestID: b }]: Lobby )
	{
		if (a === null && b !== null) return 1;
		if (a !== null && b === null) return -1;
		return 0;
	}

	function sortLobbies()
	{
		switch ( sortBy )
		{
			case SortBy.name:
				return Object.entries(lobbies).sort(sortByLobbyName);
			case SortBy.nameRev:
				return Object.entries(lobbies).sort(sortByLobbyNameRev);
			case SortBy.players:
				return Object.entries(lobbies).sort(sortByPlayers);
			case SortBy.playersRev:
				return Object.entries(lobbies).sort(sortByPlayersRev);
			default:
				return Object.entries(lobbies);
		}
	}

	return (
		<div className={styles.browserWindow}>
			<ColumnTitles sortBy={sortBy} setSortBy={setSortBy} />
			<Lobbies lobbiesArr={lobbiesArr} />
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

// TODO: if not logged in redirect to landing page
export default function LobbiesBrowser()
{
	const { error } = useError();

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Lobbies Browser" />
				<BrowserWindow />
				<Buttons />
				<SideBar />
				{ error !== ErrorType.none && <Popup> <ErrorPopup /> </Popup> }
			</Page>
		</>
	);
}
