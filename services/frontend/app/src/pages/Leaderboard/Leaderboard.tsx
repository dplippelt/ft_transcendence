import styles from "./Leaderboard.module.scss";
import { useEffect, useState } from "react";
import Dropdown from "../../components/Dropdown";
import useIsMobile from "../../hooks/useIsMobile";
import { BackButton, MossButton } from "../../components/Buttons";
import Background from "../../components/Background";
import Page from "../../components/Page";
import { BottomButtons } from "../../components/ButtonContainers";
import { MenuTitle } from "../../components/PageTitle";
import type React from "react";
import { useLocation } from "react-router-dom";
import { RoutePath } from "../../utils/utils";
import SideBar from "../../components/SideBar";
import { useAuth } from "../../contexts/AuthContext";
import { getDungeonLeaderboard, getDungeons } from "../../api/leaderboardApi";
import type { DungeonResponse, LeaderboardEntryResponse } from "../../api/leaderboardApi";

interface IDungeonPicker
{
	dungeons: DungeonResponse[];
	selectedDungeonId: number | undefined;
	setSelectedDungeonId: React.Dispatch<React.SetStateAction<number | undefined>>;
}

interface IColumnTitles
{
	dungeonName: string | undefined;
}

interface ILeaderboardEntry
{
	entry: LeaderboardEntryResponse;
	idx: number;
}

interface ILeaderboardList
{
	entries: LeaderboardEntryResponse[];
	isLoading: boolean;
	hasError: boolean;
}

interface ILeaderboardWindow
{
	dungeons: DungeonResponse[];
	selectedDungeonId: number | undefined;
	setSelectedDungeonId: React.Dispatch<React.SetStateAction<number | undefined>>;
	entries: LeaderboardEntryResponse[];
	isLoading: boolean;
	hasError: boolean;
}

function DungeonPicker( { dungeons, selectedDungeonId, setSelectedDungeonId } : IDungeonPicker )
{
	const isMobile = useIsMobile(730);

	function handleChange( e: React.ChangeEvent<HTMLSelectElement, Element> )
	{
		setSelectedDungeonId(Number(e.target.value));
	}

	if ( isMobile )
	{
		return (
			<Dropdown
				extraStyling={styles.dropDownStatsPicker}
				label="Dungeon"
				id="dungeon"
				options={dungeons.map(dungeon => ({ value: String(dungeon.id), label: dungeon.name }))}
				setting={selectedDungeonId !== undefined ? String(selectedDungeonId) : ""}
				onChange={handleChange} />
		);
	}

	return (
		<div className={styles.statsPicker}>
			{dungeons.map(dungeon =>
				<MossButton key={dungeon.id} label={dungeon.name} onClick={ () => setSelectedDungeonId(dungeon.id) } />
			)}
		</div>
	);
}

function ColumnTitles( { dungeonName } : IColumnTitles )
{
	return (
		<div className={styles.columnTitles}>
			<div>#</div>
			<div>Username</div>
			<div className={styles.score}>{dungeonName ?? "Score"}</div>
		</div>
	);
}

function LeaderboardEntry( { entry, idx } : ILeaderboardEntry )
{
	const username = entry.user.username ?? entry.user.display_name ?? "Unknown";

	return (
		<>
			<div>{`${idx + 1}. `}</div>
			<div>{username}</div>
			<div className={styles.score}>{entry.value}</div>
		</>
	);
}

function LeaderboardList( { entries, isLoading, hasError } : ILeaderboardList )
{
	if ( isLoading )
	{
		return <div className={styles.leaderboardList}>Loading...</div>;
	}

	if ( hasError )
	{
		return <div className={styles.leaderboardList}>Couldn't load the leaderboard. Please try again later.</div>;
	}

	if ( entries.length === 0 )
	{
		return <div className={styles.leaderboardList}>No scores yet.</div>;
	}

	return (
		<div className={styles.leaderboardList}>
			{entries.map((entry, idx) =>
				<LeaderboardEntry key={entry.user.id} entry={entry} idx={idx} />
			)}
		</div>
	);
}

function LeaderboardWindow( { dungeons, selectedDungeonId, setSelectedDungeonId, entries, isLoading, hasError } : ILeaderboardWindow )
{
	const selectedDungeon = dungeons.find(dungeon => dungeon.id === selectedDungeonId);

	return (
		<div className={styles.leaderboardWindow}>
			<DungeonPicker dungeons={dungeons} selectedDungeonId={selectedDungeonId} setSelectedDungeonId={setSelectedDungeonId} />
			<ColumnTitles dungeonName={selectedDungeon?.name} />
			<LeaderboardList entries={entries} isLoading={isLoading} hasError={hasError} />
		</div>
	);
}

function Buttons()
{
	const location = useLocation();
	const path = location.state?.from ?? RoutePath.mainMenu;

	return (
		<BottomButtons>
			<BackButton path={path} />
		</BottomButtons>
	);
}

// TODO: if not logged in redirect to landing page
export default function Leaderboard()
{
	const { auth } = useAuth();
	const [dungeons, setDungeons] = useState<DungeonResponse[]>([]);
	const [selectedDungeonId, setSelectedDungeonId] = useState<number | undefined>(undefined);
	const [entries, setEntries] = useState<LeaderboardEntryResponse[]>([]);
	const [isDungeonsLoading, setIsDungeonsLoading] = useState(true);
	const [isEntriesLoading, setIsEntriesLoading] = useState(true);
	const [dungeonsError, setDungeonsError] = useState(false);
	const [entriesError, setEntriesError] = useState(false);

	// Fetches the dungeon list whenever the session (re)starts, and resets
	// all leaderboard state when it ends, so a logged-out view never keeps
	// showing another session's data.
	useEffect(() =>
	{
		if ( !auth.accessToken )
		{
			setDungeons([]);
			setSelectedDungeonId(undefined);
			setEntries([]);
			setIsDungeonsLoading(false);
			setIsEntriesLoading(false);
			setDungeonsError(false);
			setEntriesError(false);
			return;
		}

		let isCurrent = true;
		setIsDungeonsLoading(true);
		setDungeonsError(false);

		getDungeons(auth.accessToken)
			.then(fetchedDungeons =>
			{
				if ( !isCurrent )
					return;

				setDungeons(fetchedDungeons);
				setSelectedDungeonId(prev => prev ?? fetchedDungeons[0]?.id);
			})
			.catch(() =>
			{
				if ( isCurrent )
					setDungeonsError(true);
			})
			.finally(() =>
			{
				if ( isCurrent )
					setIsDungeonsLoading(false);
			});

		return () => { isCurrent = false; };
	}, [auth.accessToken]);

	// Fetches the selected dungeon's leaderboard. `isCurrent` guards against
	// a slower, earlier request (e.g. from a dungeon the user already
	// switched away from) overwriting a newer one once it resolves.
	useEffect(() =>
	{
		if ( !auth.accessToken || selectedDungeonId === undefined )
		{
			setEntries([]);
			setIsEntriesLoading(false);
			return;
		}

		let isCurrent = true;
		setIsEntriesLoading(true);
		setEntriesError(false);

		getDungeonLeaderboard(selectedDungeonId, auth.accessToken)
			.then(fetchedEntries =>
			{
				if ( isCurrent )
					setEntries(fetchedEntries);
			})
			.catch(() =>
			{
				if ( isCurrent )
					setEntriesError(true);
			})
			.finally(() =>
			{
				if ( isCurrent )
					setIsEntriesLoading(false);
			});

		return () => { isCurrent = false; };
	}, [auth.accessToken, selectedDungeonId]);

	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="Leaderboard" />
				<LeaderboardWindow
					dungeons={dungeons}
					selectedDungeonId={selectedDungeonId}
					setSelectedDungeonId={setSelectedDungeonId}
					entries={entries}
					isLoading={isDungeonsLoading || isEntriesLoading}
					hasError={dungeonsError || entriesError} />
				<Buttons />
				<SideBar />
			</Page>
		</>
	);
}
