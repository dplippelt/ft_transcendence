import { useCallback, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Background from "../../components/Background";
import { BottomButtons } from "../../components/ButtonContainers";
import { BackButton, MossButton } from "../../components/Buttons";
import Dropdown from "../../components/Dropdown";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";
import SideBar from "../../components/SideBar";
import { useAuth } from "../../contexts/AuthContext";
import { RoutePath } from "../../utils/utils";
import { getTopicIndex, howToPlayTopics, topicPath } from "./topics";
import ImageOverlay from "./ImageOverlay";
import styles from "./HowToPlay.module.scss";

interface ITopicNav
{
  index: number;
  goTo: (index: number) => void;
}

function TopicList( { index, goTo } : ITopicNav )
{
  return (
    <Dropdown
      key={howToPlayTopics[index].id}
      extraStyling={styles.topicDropdown}
      label="Topic:"
      id="howToPlayTopic"
      options={howToPlayTopics.map(topic => ({ value: topic.id, label: topic.title }))}
      setting={howToPlayTopics[index].id}
      onChange={ (e) => goTo(getTopicIndex(e.target.value)) }
    />
  );
}

function PrevNextButtons( { index, goTo } : ITopicNav )
{
  const prev = howToPlayTopics[index - 1];
  const next = howToPlayTopics[index + 1];

  return (
    <div className={styles.navButtons}>
      <MossButton label="Prev" disabled={!prev} onClick={ () => goTo(index - 1) } />
      <MossButton label="Next" disabled={!next} onClick={ () => goTo(index + 1) } />
    </div>
  );
}

interface IZoomedImage
{
  topicId: string;
  src: string;
  alt: string;
}

function HowToPlayWindow( { index, goTo } : ITopicNav )
{
  const topic = howToPlayTopics[index];
  const [zoomed, setZoomed] = useState<IZoomedImage | null>(null);
  const closeZoom = useCallback(() => setZoomed(null), []);

  function onContentClick( e: React.MouseEvent<HTMLDivElement> )
  {
    if ( e.target instanceof HTMLImageElement )
      setZoomed({ topicId: topic.id, src: e.target.src, alt: e.target.alt });
  }

  return (
    <div className={styles.howToPlayWindow}>
      <TopicList index={index} goTo={goTo} />
      <div className={styles.topicArea}>
        <div className={styles.topicTitle}>{topic.title}</div>
        <div key={topic.id} className={styles.content} onClick={onContentClick}>{topic.content}</div>
        <PrevNextButtons index={index} goTo={goTo} />
      </div>
      { zoomed && zoomed.topicId === topic.id &&
        <ImageOverlay src={zoomed.src} alt={zoomed.alt} onClose={closeZoom} /> }
    </div>
  );
}

function Buttons( { loggedIn } : { loggedIn: boolean } )
{
  return (
    <BottomButtons>
      <BackButton fallback={ loggedIn ? RoutePath.mainMenu : RoutePath.landingPage } />
    </BottomButtons>
  );
}

export default function HowToPlay()
{
  const { topic } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const loggedIn = auth.status === "authenticated";
  const index = getTopicIndex(topic);

  if ( index === -1 )
    return <Navigate to={topicPath(0)} replace />;

  function goTo( newIndex: number )
  {
    if ( newIndex < 0 || newIndex >= howToPlayTopics.length || newIndex === index )
      return;

    // Replace instead of push: the whole manual stays one history entry,
    // so Back returns to whatever page opened it (game menu, main menu, landing page, ...)
    navigate(topicPath(newIndex), { replace: true });
  }

  return (
    <>
      <Background />
      <Page>
        <MenuTitle title="How to play" />
        <HowToPlayWindow index={index} goTo={goTo} />
        <Buttons loggedIn={loggedIn} />
        { loggedIn && <SideBar /> }
      </Page>
    </>
  );
}
