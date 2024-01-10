import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretRight, faIndianRupeeSign } from '@fortawesome/free-solid-svg-icons';

function App() {
  const Menu = require('./data/menu.json');
  const [showMenu, setShowMenu] = useState(Object.fromEntries(Object.keys(Menu).map(category => [category, false])));

  const toggleMenu = (category) => {
    setShowMenu({ ...showMenu, [category]: !showMenu[category] });
  }

  return (
    <div className="menu-container">
      <h1 className='text-3xl text-gray-700 menu-title'>New Rajshree Sweets Menu</h1>
      {Object.keys(Menu).map((category) => (
        <React.Fragment key={category}>
          <div className="category-container">
            <div className={`bg-rose-600 hover:bg-rose-700 text-white category-title-wrapper ${showMenu[category] ? 'active' : ''}`} onClick={() => toggleMenu(category)}>
              <h1 className='text-s category-title'>{category}</h1>
              <FontAwesomeIcon icon={showMenu[category] ? faCaretDown : faCaretRight} className='caret' />
            </div>
            <div className="items-container">
              {Menu[category].map((item, index) => (
                <div key={index} className={`item-wrapper ${index % 2 === 0 ? 'alternate' : ''}`} >
                  <span className='item-title'>{item.name}</span>
                  <span className='item-rate'><FontAwesomeIcon icon={faIndianRupeeSign} /> {item.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default App;
