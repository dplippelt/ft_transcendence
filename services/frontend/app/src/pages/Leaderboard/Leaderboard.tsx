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
}

interface ILeaderboardWindow
{
	dungeons: DungeonResponse[];
	selectedDungeonId: number | undefined;
	setSelectedDungeonId: React.Dispatch<React.SetStateAction<number | undefined>>;
	entries: LeaderboardEntryResponse[];
	isLoading: boolean;
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

function LeaderboardList( { entries, isLoading } : ILeaderboardList )
{
	if ( isLoading )
	{
		return <div className={styles.leaderboardList}>Loading...</div>;
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

function LeaderboardWindow( { dungeons, selectedDungeonId, setSelectedDungeonId, entries, isLoading } : ILeaderboardWindow )
{
	const selectedDungeon = dungeons.find(dungeon => dungeon.id === selectedDungeonId);

	return (
		<div className={styles.leaderboardWindow}>
			<DungeonPicker dungeons={dungeons} selectedDungeonId={selectedDungeonId} setSelectedDungeonId={setSelectedDungeonId} />
			<ColumnTitles dungeonName={selectedDungeon?.name} />
			<LeaderboardList entries={entries} isLoading={isLoading} />
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

export default function Leaderboard()
{
	const { auth } = useAuth();
	const [dungeons, setDungeons] = useState<DungeonResponse[]>([]);
	const [selectedDungeonId, setSelectedDungeonId] = useState<number | undefined>(undefined);
	const [entries, setEntries] = useState<LeaderboardEntryResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() =>
	{
		if ( !auth.accessToken )
			return;

		getDungeons(auth.accessToken)
			.then(fetchedDungeons =>
			{
				setDungeons(fetchedDungeons);
				setSelectedDungeonId(prev => prev ?? fetchedDungeons[0]?.id);
			})
			.catch(() => {
				// Leave dungeons empty; the list simply stays empty on failure.
			});
	}, [auth.accessToken]);

	useEffect(() =>
	{
		if ( !auth.accessToken || selectedDungeonId === undefined )
		{
			setIsLoading(false);
			return;
		}

		setIsLoading(true);

		getDungeonLeaderboard(selectedDungeonId, auth.accessToken)
			.then(setEntries)
			.catch(() => setEntries([]))
			.finally(() => setIsLoading(false));
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
					isLoading={isLoading} />
				<Buttons />
				<SideBar />
			</Page>
		</>
	);
}
