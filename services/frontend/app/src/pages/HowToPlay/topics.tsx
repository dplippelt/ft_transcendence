import type React from "react";
import Introduction from "./content/Introduction";
import { RoutePath } from "../../utils/utils";
import GameModes from "./content/GameModes";
import OperatorSelection from "./content/OperatorSelection";

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
  { id: "controls", title: "Controls", content: <p>Coming soon.</p> },
  { id: "exploring", title: "Exploring", content: <p>Coming soon.</p> },
  { id: "combat", title: "Combat", content: <p>Coming soon.</p> },
  { id: "equations", title: "Building an equation", content: <p>Coming soon.</p> },
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
