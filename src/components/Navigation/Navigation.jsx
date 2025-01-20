import { useState, useRef, useEffect } from 'react';
import './Navigation.scss';

function Navigation() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabsRef = useRef([]);
  const tabs = ['tictactoe', 'chess', 'checkers'];

  useEffect(() => {
    const indicator = document.querySelector('.active-indicator');
    if (indicator && tabsRef.current[activeIndex]) {
      const activeTab = tabsRef.current[activeIndex];
      indicator.style.top = `${activeTab.offsetTop}px`;
      indicator.style.height = `${activeTab.offsetHeight}px`;
    }
  }, [activeIndex]);

  return (
    <div className="tabs-container">
      <div className="tabs">
        {tabs.map((tab, i) => (
          <a
            key={i}
            href={`#${tab}`}
            ref={(el) => (tabsRef.current[i] = el)}
            className={`tab ${activeIndex === i ? 'active' : ''} ${tab}-logo`}
            onClick={() => setActiveIndex(i)}
          />
        ))}
        <div className="active-indicator"></div>
      </div>
    </div>
  )
}

export default Navigation;