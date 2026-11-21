import { useEffect, useState } from "react";
import { emitWhenReady, EventBus } from "../../game/EventBus";
import { GameEvent } from "../../utils/utils";
import styles from "./LevelIndicator.module.scss";

interface ILevelInfo
{
  current: number;
  total: number;
}

export default function LevelIndicator()
{
  const [levelInfo, setLevelInfo] = useState<ILevelInfo | null>(null);

  useEffect(() =>
  {
    function updateLevelInfo( current: number, total: number ) { setLevelInfo({ current, total }); }
    EventBus.addListener(GameEvent.levelInfo, updateLevelInfo);

    emitWhenReady(GameEvent.getLevelInfo);

    return () => { EventBus.removeListener(GameEvent.levelInfo, updateLevelInfo); };
  }, []);

  if ( !levelInfo )
    return null;

  return (
    <div className={styles.levelIndicator}>
      Level: {levelInfo.current}/{levelInfo.total}
    </div>
  );
}
