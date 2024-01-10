import menu from './menu.json' assert { type: 'json' };

document.addEventListener('DOMContentLoaded', async () => {
    const menuContainer = document.querySelector('.category-menu');

    const categories = Object.keys(menu);

    categories.forEach(category => {
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-container';

        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'category-title';
        categoryTitle.onclick = () => {
            console.log('clicked');
            menuItemsContainer.classList.toggle('inactive');
        }
        categoryTitle.textContent = category;

        const menuItemsContainer = document.createElement('div');
        menuItemsContainer.className = 'menu-items-container';

        const items = menu[category];
        items.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.innerHTML = `<strong>${item.name}</strong><span> ₹ ${item.rate}</span>`;

            // Add alternate card styling
            if (index % 2 === 1) {
                menuItem.classList.add('alternate');
            }

            menuItemsContainer.appendChild(menuItem);
        });

        categoryContainer.appendChild(categoryTitle);
        categoryContainer.appendChild(menuItemsContainer);
        menuContainer.appendChild(categoryContainer);
    });
});
