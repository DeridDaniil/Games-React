import { useRef, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Info, Settings } from 'lucide-react';
import Modal from '../Modal/Modal';
import TicTacToeInfo from '../../Games/TicTacToe/TicTacToeInfo';
import TicTacToeSettings from '../../Games/TicTacToe/TicTacToeSettings';
import ChessInfo from '../../Games/Chess/ChessInfo';
import ChessSettings from '../../Games/Chess/ChessSettings';
import CheckersInfo from '../../Games/Checkers/CheckersInfo';
import CheckersSettings from '../../Games/Checkers/CheckersSettings';
import './Navigation.scss';

const tabs = ['tictactoe', 'chess', 'checkers'];

const gameConfig = {
  tictactoe: {
    label: 'Tic Tac Toe',
    info: <TicTacToeInfo />,
    settings: <TicTacToeSettings />,
  },
  chess: {
    label: 'Chess',
    info: <ChessInfo />,
    settings: <ChessSettings />,
  },
  checkers: {
    label: 'Checkers',
    info: <CheckersInfo />,
    settings: <CheckersSettings />,
  },
};

function Navigation() {
  const tabsRef = useRef([]);
  const location = useLocation();
  const activeTab = tabs.find(tab => location.pathname === `/${tab}`);
  const activeIndex = tabs.indexOf(activeTab);

  const [modal, setModal] = useState({ type: null, game: null });
  const [activeTabTop, setActiveTabTop] = useState(null);

  const openModal = (type, game) => setModal({ type, game });
  const closeModal = () => setModal({ type: null, game: null });

  useEffect(() => {
    const indicator = document.querySelector('.active-indicator');
    const idx = activeIndex >= 0 ? activeIndex : 0;
    if (indicator && tabsRef.current[idx]) {
      const activeTabEl = tabsRef.current[idx];
      indicator.style.top = `${activeTabEl.offsetTop}px`;
      indicator.style.width = `${activeTabEl.offsetWidth}px`;
      indicator.style.height = `${activeTabEl.offsetHeight}px`;
      setActiveTabTop(activeTabEl.offsetTop);
    } else {
      setActiveTabTop(null);
    }
  }, [activeIndex]);

  const config = activeTab ? gameConfig[activeTab] : null;

  return (
    <>
      <div className="nav-wrapper">
        <div className="tabs-container">
          <div className="tabs">
            {tabs.map((tab, i) => (
              <NavLink
                key={i}
                to={`/${tab}`}
                ref={(el) => (tabsRef.current[i] = el)}
                className={({ isActive }) => `tab ${isActive ? 'active' : ''} ${tab}-logo`}
              />
            ))}
            <div className="active-indicator"></div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab && activeTabTop !== null && (
            <motion.div
              key={activeTab}
              className="tab-actions"
              style={{ top: activeTabTop }}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <motion.button
                className="tab-action-btn"
                title="Info"
                onClick={() => openModal('info', activeTab)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Info size={16} />
              </motion.button>
              <motion.button
                className="tab-action-btn"
                title="Settings"
                onClick={() => openModal('settings', activeTab)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings size={16} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {config && (
        <>
          <Modal
            isOpen={modal.type === 'info' && modal.game === activeTab}
            onClose={closeModal}
            title={`${config.label} — Info`}
          >
            {config.info}
          </Modal>
          <Modal
            isOpen={modal.type === 'settings' && modal.game === activeTab}
            onClose={closeModal}
            title={`${config.label} — Settings`}
          >
            {config.settings}
          </Modal>
        </>
      )}
    </>
  );
}

export default Navigation;
