import { useNavigate } from "react-router-dom";
import styles from "./Leaderboard.module.scss";
import { useState } from "react";
import { Dropdown } from "./Inputs";
import useIsMobile from "../../hooks/useIsMobile";

// start temporary example scores for three stats
const stat_1_scores: Score[] =
[
	{ username: "Player_1", score: 5 },
	{ username: "Player_2", score: 30 },
	{ username: "Player_3 has a really long username man so long wow how much more .....!!!!", score: 999999 },
	{ username: "Player_4", score: 12 },
	{ username: "Player_5", score: 48 },
	{ username: "Player_6", score: 34 },
	{ username: "Player_7", score: 26 },
	{ username: "Player_8", score: 17 },
	{ username: "Player_9", score: 1 },
	{ username: "Player_10", score: 29 },
	{ username: "Player_11", score: 31 },
	{ username: "Player_12", score: 21 },
]

const stat_2_scores: Score[] =
[
	{ username: "Player_1", score: 20 },
	{ username: "Player_2", score: 25 },
	{ username: "Player_3 has a really long username man so long wow how much more .....!!!!", score: 15 },
	{ username: "Player_4", score: 112 },
	{ username: "Player_5", score: 8 },
	{ username: "Player_6", score: 54 },
	{ username: "Player_7", score: 26 },
	{ username: "Player_8", score: 37 },
	{ username: "Player_9", score: 18 },
	{ username: "Player_10", score: 49 },
	{ username: "Player_11", score: 21 },
	{ username: "Player_12", score: 29 },
]

const stat_3_scores: Score[] =
[
	{ username: "Player_1", score: 35 },
	{ username: "Player_2", score: 25 },
	{ username: "Player_3 has a really long username man so long wow how much more .....!!!!", score: 30 },
	{ username: "Player_4", score: 112 },
	{ username: "Player_5", score: 58 },
	{ username: "Player_6", score: 14 },
	{ username: "Player_7", score: 36 },
	{ username: "Player_8", score: 11 },
	{ username: "Player_9", score: 6 },
	{ username: "Player_10", score: 79 },
	{ username: "Player_11", score: 75 },
	{ username: "Player_12", score: 28 },
]
// end temporary example scores for three stats

enum Stat
{
	stat_1 = "Stat 1",
	stat_2 = "Stat 2",
	stat_3 = "Stat 3",
}

type Score =
{
	username: string,
	score: number,
}

type StatsPickerProps =
{
	setStat: React.Dispatch<React.SetStateAction<Stat>>,
}

type ColumnTitlesProps =
{
	stat: Stat,
}

type LeaderboardListProps =
{
	stat: Stat,
}

type LeaderboardWindowProps =
{
	stat: Stat,
	setStat: React.Dispatch<React.SetStateAction<Stat>>,
}

function PageTitle()
{
	return <div className="menuTitle">Leaderboard</div>
}

function StatsPicker( { setStat } : StatsPickerProps )
{
	const isMobile = useIsMobile();

	if ( isMobile )
	{
		return (
			<div className={styles.statsPicker}>
				<Dropdown label="Sort by" id="stat" options={[ { value: Stat.stat_1, label: "Stat 1" }, { value: Stat.stat_2, label: "Stat 2" }, { value: Stat.stat_3, label: "Stat 3" } ]} setting="stat_1" onChange={ (e) => setStat(e.target.value as Stat) } />
			</div>
		);
	}

	return (
		<div className={styles.statsPicker}>
			<button className="buttonV1" onClick={ () => setStat(Stat.stat_1) }>Stat 1</button>
			<button className="buttonV1" onClick={ () => setStat(Stat.stat_2) }>Stat 2</button>
			<button className="buttonV1" onClick={ () => setStat(Stat.stat_3) }>Stat 3</button>
		</div>
	);
}

function ColumnTitles( { stat } : ColumnTitlesProps )
{
	return (
		<div className={styles.columnTitles}>
			<div>#</div>
			<div>Username</div>
			<div className={styles.score}>{stat}</div>
		</div>
	);
}

function LeaderboardList( { stat } : LeaderboardListProps )
{
	// get scores for all users for the specified stat from DB
	// temporary mock scores getter
	function getScores() : Score[]
	{
		switch (stat)
		{
			case Stat.stat_1:
				return stat_1_scores;
			case Stat.stat_2:
				return stat_2_scores;
			case Stat.stat_3:
				return stat_3_scores;
			default:
				return Array<Score>(0);
		}
	}

	const sortedScores: Score[] = getScores().sort((a, b) => b.score - a.score).slice(0, 10);

	return (
		<div className={styles.leaderboardList}>
			{sortedScores.map((entry, idx) =>
				<>
					<div>{`${idx + 1}. `}</div>
					<div>{entry.username}</div>
					<div className={styles.score}>{entry.score}</div>
				</>
			)}
		</div>
	);
}

function LeaderboardWindow( { stat, setStat } : LeaderboardWindowProps )
{
	return (
		<div className={styles.leaderboardWindow}>
			<StatsPicker setStat={setStat} />
			<ColumnTitles stat={stat} />
			<LeaderboardList stat={stat} />
		</div>
	);
}

function Buttons()
{
	const navigate = useNavigate();

	return (
		<div className="bottomButtons">
			<button className="buttonV2 mobileBottom" onClick={ () => navigate(-1) }>Back</button>
		</div>
	);
}

export default function Leaderboard()
{
	const [stat, setStat] = useState<Stat>(Stat.stat_1);

	return (
		<>
			<div className="background" />
			<div className="page">
				<PageTitle />
				<LeaderboardWindow stat={stat} setStat={setStat} />
				<Buttons />
			</div>
		</>
	);
}
