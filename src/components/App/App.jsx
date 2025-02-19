import Navigation from "../Navigation/Navigation";
import TicTacToe from "../../Games/TicTacToe/TicTacToe";
import Chess from "../../Games/Chess/Chess";
import Checkers from "../../Games/Checkers/Checkers";

import './App.scss';

function App() {
  return (
    <div className="app">
      <Navigation />
      {/* <TicTacToe /> */}
      {/* <Chess /> */}
      <Checkers />
    </div>
  )
}

export default App
