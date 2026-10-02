import { Routes, Route, Navigate } from "react-router-dom";
import { useProfile } from "../features/profile/model/ProfileContext";
import Navigation from "./ui/Navigation/Navigation";
import TicTacToe from "../features/games/tic-tac-toe/TicTacToe";
import Chess from "../features/games/chess/Chess";
import Checkers from "../features/games/checkers/Checkers";
import ProfileCreate from "../features/profile/ui/ProfileCreate/ProfileCreate";
import ProfilePage from "../features/profile/ui/ProfilePage/ProfilePage";

import './App.scss';

function App() {
  const { hasProfile } = useProfile();

  if (!hasProfile) {
    return (
      <Routes>
        <Route path="/profile/create" element={<ProfileCreate />} />
        <Route path="*" element={<Navigate to="/profile/create" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <Navigation />
      <main className="app__main">
        <Routes>
          <Route path="/tictactoe" element={<TicTacToe />} />
          <Route path="/chess" element={<Chess />} />
          <Route path="/checkers" element={<Checkers />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Signing in re-renders this tree while the router still shows /profile/create (it applies
              the form's navigation as a transition), so this redirect must lead where the form does. */}
          <Route path="/profile/create" element={<Navigate to="/tictactoe" replace />} />
          <Route path="*" element={<Navigate to="/tictactoe" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
