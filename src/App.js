import React, { useState } from 'react';
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
      <h1 className='text-2xl font-bold menu-title mb-3'>NEW RAJSHREE SWEETS PRIVATE LIMITED</h1>
      <p className='text-xl font-bold'>S 6/109-110 ORDERLY BAZAR ROAD</p>
      <p className='text-xl font-bold'>GOLGHAR KACHAHARI</p>
      <p className='text-xl font-bold mb-5'>VARANASI - 21002</p>
      <p className='text-l'><span className='font-bold'>GSTIN:</span> 09AAHCN9500A1ZP</p>
      <p className='text-l'><span className='font-bold'>FSSAI LIC NO:</span> 12714038000517</p>
      <p className='text-l'><span className='font-bold'>Phone:</span> 0542-2504477</p>
      <p className='text-l'><span className='font-bold'>Email:</span> newrajshreesweets@yahoo.in</p>
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
                  <span className='item-rate'>
                    {item.rate && <FontAwesomeIcon icon={faIndianRupeeSign} />} {item.rate}
                  </span>
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
