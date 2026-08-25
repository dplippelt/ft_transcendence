import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage/LandingPage"
import MainMenu from "./pages/MainMenu/MainMenu"
import Settings from "./pages/Settings/Settings"
import PhaserGame from "./pages/PhaserGame/PhaserGame"
import Leaderboard from "./pages/Leaderboard/Leaderboard"
import Profile from "./pages/Profile/Profile"
import Auth from "./pages/Auth/Auth"
import Friends from "./pages/Friends/Friends"
import { RouteParam, RoutePath } from "./utils/utils"
import Multiplayer from "./pages/Multiplayer/Multiplayer"
import Lobby from "./pages/Multiplayer/Lobby"
import LobbiesBrowser from "./pages/Multiplayer/LobbiesBrowser"
import PageNotFound from "./pages/PageNotFound/PageNotFound"
import ProtectedRoute from "./components/ProtectedRoute";
import RequireUsernameRoute from "./components/RequireUsernameRoute";
import CompleteProfile from "./pages/Profile/CompleteProfile";
// import GameOver from "./pages/GameOver/GameOver"

export default function App()
{
  //  References to the PhaserGame component (game and scene are exposed)
  // const phaserRef = useRef<IRefPhaserGame | null>(null);

  // Event emitted from the PhaserGame component
  const currentScene = (scene: Phaser.Scene) => {
    console.log(`current loaded scene: ${scene.scene.key}`);
  }

  return (
    <BrowserRouter>
      <PhaserGame currentActiveScene={currentScene} />
      <Routes>
        <Route path={RoutePath.landingPage} element={ <LandingPage/> } />
        <Route path={RoutePath.auth} element={<Auth />} />
        <Route path={RoutePath.gameDev} element={null} />
        <Route element={<ProtectedRoute />}>
            <Route path={RoutePath.completeProfile} element={<CompleteProfile />} />
            <Route element={<RequireUsernameRoute />}>
                <Route path={RoutePath.mainMenu} element={ <MainMenu/> } />
                <Route path={RoutePath.multiplayer} element={ <Multiplayer/> } />
                <Route path={RoutePath.mpLobby + RouteParam.lobbyID} element={ <Lobby/> } />
                <Route path={RoutePath.mpBrowser} element={ <LobbiesBrowser/> } />
                <Route path={RoutePath.friends} element={ <Friends/> } />
                <Route path={RoutePath.profile} element={ <Profile/> } />
                <Route path={RoutePath.leaderboard} element={ <Leaderboard/> } />
                <Route path={RoutePath.settings} element={ <Settings/> } />
            </Route>
        </Route>
        <Route path="*" element={ <PageNotFound /> } />
      </Routes>
    </BrowserRouter>
  )
}
