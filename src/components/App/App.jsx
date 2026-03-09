import { Routes, Route, Navigate } from "react-router-dom";
import { useProfile } from "../../profile/ProfileContext";
import Navigation from "../Navigation/Navigation";
import TicTacToe from "../../Games/TicTacToe/TicTacToe";
import Chess from "../../Games/Chess/Chess";
import Checkers from "../../Games/Checkers/Checkers";
import ProfileCreate from "../../profile/pages/ProfileCreate";
import ProfilePage from "../../profile/pages/ProfilePage";

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
      <Routes>
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="/chess" element={<Chess />} />
        <Route path="/checkers" element={<Checkers />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/create" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to="/tictactoe" replace />} />
      </Routes>
    </div>
  )
}

export default App
