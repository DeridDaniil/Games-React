import { Routes, Route, Navigate } from "react-router-dom";
import Navigation from "../Navigation/Navigation";
import TicTacToe from "../../Games/TicTacToe/TicTacToe";
import Chess from "../../Games/Chess/Chess";
import Checkers from "../../Games/Checkers/Checkers";

import './App.scss';

function App() {
  return (
    <div className="app">
      <Navigation />
      <Routes>
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="/chess" element={<Chess />} />
        <Route path="/checkers" element={<Checkers />} />
        <Route path="*" element={<Navigate to="/tictactoe" replace />} />
      </Routes>
    </div>
  )
}

export default App
