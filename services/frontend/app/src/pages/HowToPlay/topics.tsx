import type React from "react";
import Introduction from "./content/Introduction";
import { RoutePath } from "../../utils/utils";
import GameModes from "./content/GameModes";
import OperatorSelection from "./content/OperatorSelection";
import Controls from "./content/Controls";
import Exploration from "./content/Exploration";
import Combat from "./content/Combat";
import Equation from "./content/Equation";

export interface HowToPlayTopic
{
  id: string;
  title: string;
  content: React.ReactNode;
}

export const howToPlayTopics: HowToPlayTopic[] =
[
  { id: "introduction", title: "Introduction", content: <Introduction /> },
  { id: "game-modes", title: "Game modes", content: <GameModes /> },
  { id: "operators", title: "Operator selection", content: <OperatorSelection /> },
  { id: "controls", title: "Controls", content: <Controls /> },
  { id: "exploring", title: "Exploring the dungeon", content: <Exploration /> },
  { id: "combat", title: "Combat screen", content: <Combat /> },
  { id: "equations", title: "Building an equation", content: <Equation /> },
  { id: "turns", title: "Turns", content: <p>Coming soon.</p> },
  { id: "win-lose", title: "Winning and losing", content: <p>Coming soon.</p> },
];

export function getTopicIndex( id?: string ) : number
{
  return howToPlayTopics.findIndex(topic => topic.id === id);
}

export function topicPath( index: number ) : string
{
  return RoutePath.howToPlay + "/" + howToPlayTopics[index].id;
}
