import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUp,
  faAward,
  faCaretDown,
  faCheck,
  faCircleInfo,
  faClock,
  faEnvelope,
  faExternalLinkAlt,
  faFilter,
  faGlobe,
  faListUl,
  faLocationDot,
  faMagnifyingGlass,
  faPhone,
  faShareNodes,
  faShieldHeart,
  faStar,
  faStore,
  faTableCellsLarge,
  faUtensils,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import logo from './assets/logo.png';
import {
  CONTACT_PHONE,
  HAMPERS_URL,
  MAPS_URL,
  SHOP_URL,
  STORE_ADDRESS,
  STORE_EMAIL,
  WEBSITE_URL,
  WHATSAPP_NUMBER,
  buildMenuImageCandidates,
  buildWhatsAppLink,
  fetchAllMenuProducts,
  getFallbackMenu,
  normalizeApiProducts,
  sortCategories
} from './utils/menuCatalog';

const IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff8ea" />
        <stop offset="50%" stop-color="#feeec7" />
        <stop offset="100%" stop-color="#fbd995" />
      </linearGradient>
      <pattern id="motif" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="2" fill="#9f171d" opacity="0.12" />
      </pattern>
    </defs>
    <rect width="480" height="360" fill="url(#bg)" />
    <rect width="480" height="360" fill="url(#motif)" />
    <circle cx="240" cy="148" r="54" fill="#ffffff" opacity="0.9" />
    <path d="M200 185c26-28 54-28 80 0" fill="none" stroke="#9f171d" stroke-width="8" stroke-linecap="round" />
    <text x="240" y="248" font-family="'Playfair Display', Georgia, serif" font-size="22" fill="#641014" text-anchor="middle" font-weight="700">New Rajshree Sweets</text>
    <text x="240" y="274" font-family="'Karla', sans-serif" font-size="13" fill="#9f171d" text-anchor="middle" font-weight="600" letter-spacing="2">VARANASI</text>
  </svg>
`)}`;

const POPULAR_SEARCH_CHIPS = [
  'Laddoo',
  'Kaju Katli',
  'Rasgulla',
  'Gulab Jamun',
  'Kheer Kadam',
  'Samosa',
  'Namkeen',
  'Hampers'
];

function VegBadge({ title = '100% Pure Vegetarian' }) {
  return (
    <span className="veg-badge" title={title} aria-label={title}>
      <span className="veg-badge-dot" />
    </span>
  );
}

function MenuItemImage({ productName, variantId, alt, className = 'item-image' }) {
  const candidates = useMemo(
    () => buildMenuImageCandidates(productName, variantId),
    [productName, variantId]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [productName, variantId]);

  const handleImageError = (event) => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((current) => current + 1);
      return;
    }
    event.currentTarget.onerror = null;
    event.currentTarget.src = IMAGE_PLACEHOLDER;
  };

  return (
    <img
      src={candidates[candidateIndex] || IMAGE_PLACEHOLDER}
      alt={alt}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
}

function App() {
  const [categories, setCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [sourceLabel, setSourceLabel] = useState('Live menu');
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('nrspl_menu_view_mode') || 'list';
    } catch {
      return 'list';
    }
  });

  const changeViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('nrspl_menu_view_mode', mode);
    } catch {}
  };
  const [selectedItem, setSelectedItem] = useState(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const categoryBarRef = useRef(null);

  // Fetch menu products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const products = await fetchAllMenuProducts();
      const sortedCategories = sortCategories(normalizeApiProducts(products));
      setCategories(sortedCategories);
      setSourceLabel('Live menu');
    } catch (error) {
      const fallbackCategories = getFallbackMenu();
      setCategories(fallbackCategories);
      setSourceLabel('Offline menu');
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Scroll listener for "Back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 380);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard escape listener for modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedItem(null);
        setIsStoreModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Category counts and list
  const categoryNames = useMemo(() => Object.keys(categories), [categories]);

  const totalItems = useMemo(
    () => Object.values(categories).reduce((total, items) => total + items.length, 0),
    [categories]
  );

  // Filtered and sorted catalog
  const filteredCatalog = useMemo(() => {
    const search = query.trim().toLowerCase();
    const result = {};

    Object.entries(categories).forEach(([catName, items]) => {
      // Category filter
      if (activeCategory !== 'ALL' && activeCategory !== catName) {
        return;
      }

      let catItems = items;

      // Text search filter
      if (search) {
        catItems = catItems.filter((item) => {
          const inName = item.name.toLowerCase().includes(search);
          const inCat = catName.toLowerCase().includes(search);
          const inDesc = item.description && item.description.toLowerCase().includes(search);
          const inTag = item.tag && item.tag.toLowerCase().includes(search);
          const inIngredients =
            Array.isArray(item.ingredients) &&
            item.ingredients.some((ing) => ing.toLowerCase().includes(search));

          return inName || inCat || inDesc || inTag || inIngredients;
        });
      }

      // Tag filter
      if (activeTag !== 'ALL') {
        catItems = catItems.filter((item) => {
          const itemTag = String(item.tag || '').toUpperCase();
          if (activeTag === 'BESTSELLER') return itemTag.includes('BESTSELLER') || item.isFeatured;
          if (activeTag === 'NEW') return itemTag.includes('NEW');
          if (activeTag === 'HOT') return itemTag.includes('HOT');
          if (activeTag === 'HAMPERS') return item.shopHref === HAMPERS_URL || catName === 'Hampers';
          return true;
        });
      }

      // Sort items within category
      if (catItems.length > 0) {
        const sorted = [...catItems];
        if (sortBy === 'PRICE_ASC') {
          sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        } else if (sortBy === 'PRICE_DESC') {
          sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        } else if (sortBy === 'NAME_ASC') {
          sorted.sort((a, b) => a.name.localeCompare(b.name));
        }
        result[catName] = sorted;
      }
    });

    return result;
  }, [categories, activeCategory, query, activeTag, sortBy]);

  const visibleItemsCount = useMemo(
    () => Object.values(filteredCatalog).reduce((acc, items) => acc + items.length, 0),
    [filteredCatalog]
  );

  const visibleCategories = useMemo(
    () => Object.keys(filteredCatalog),
    [filteredCatalog]
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectCategory = (cat) => {
    setActiveCategory(cat);
    // Smooth scroll to catalog section
    const element = document.getElementById('catalog-section');
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    }
  };

  const handleShareItem = async (item) => {
    const shareData = {
      title: `${item.name} - New Rajshree Sweets`,
      text: `Check out ${item.name} (${item.priceLabel}) from New Rajshree Sweets Varanasi:`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // user cancelled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Clipboard error:', err);
    }
  };

  const resetFilters = () => {
    setQuery('');
    setActiveCategory('ALL');
    setActiveTag('ALL');
    setSortBy('DEFAULT');
  };

  if (loading) {
    return (
      <main className="loading-screen" aria-live="polite">
        <div className="loading-card">
          <div className="loading-logo-ring">
            <img src={logo} alt="New Rajshree Sweets" className="loading-logo-img" />
          </div>
          <h2 className="loading-title">New Rajshree Sweets</h2>
          <p className="loading-subtitle">Preparing Varanasi&apos;s fresh mithai menu...</p>
          <div className="loading-bar">
            <div className="loading-bar-inner" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      {/* 1. TOP STICKY NAVIGATION HEADER */}
      <header className="top-nav" id="top-navigation">
        <div className="nav-container">
          <a href="#top-navigation" className="nav-brand" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>
            <img src={logo} alt="New Rajshree Sweets" className="nav-logo" />
            <div className="nav-brand-text">
              <span className="brand-name">New Rajshree Sweets</span>
              <span className="brand-tagline">Varanasi Mithai House</span>
            </div>
          </a>

          <div className="nav-actions">
            <button
              type="button"
              className="nav-btn store-btn"
              onClick={() => setIsStoreModalOpen(true)}
              aria-label="View Store Info and Directions"
            >
              <FontAwesomeIcon icon={faStore} />
              <span className="nav-btn-label">Store & Hours</span>
            </button>

            <a
              href={`tel:${CONTACT_PHONE}`}
              className="nav-btn call-btn"
              aria-label={`Call New Rajshree Sweets at ${CONTACT_PHONE}`}
            >
              <FontAwesomeIcon icon={faPhone} />
              <span className="nav-btn-label">Call Shop</span>
            </a>

            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-btn whatsapp-btn"
              aria-label="Chat on WhatsApp"
            >
              <FontAwesomeIcon icon={faWhatsapp} />
              <span className="nav-btn-label">WhatsApp</span>
            </a>

            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-btn shop-primary-btn"
            >
              <span>Order Online</span>
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
          </div>
        </div>
      </header>

      {/* 2. REFINED HERITAGE HERO SECTION */}
      <section className="hero-section" aria-label="Welcome and highlights">
        <div className="hero-bg-overlay" />
        <div className="hero-inner">
          <div className="hero-badge-pill">
            <FontAwesomeIcon icon={faAward} />
            <span>Varanasi&apos;s Confectionery Heritage Since 1990+</span>
          </div>

          <h1 className="hero-heading">Handcrafted Sweets, Namkeen & Festive Hampers</h1>

          <p className="hero-lead">
            Traditional Indian mithai prepared in pure desi ghee, fresh daily chhena delicacies, and savory artisanal namkeen crafted with authentic Banarasi recipes.
          </p>

          <div className="hero-highlights-strip">
            <div className="highlight-pill">
              <VegBadge />
              <span>100% Pure Vegetarian</span>
            </div>
            <div className="highlight-pill">
              <FontAwesomeIcon icon={faShieldHeart} />
              <span>FSSAI Certified</span>
            </div>
            <div className="highlight-pill">
              <FontAwesomeIcon icon={faClock} />
              <span>Fresh Daily Batches</span>
            </div>
            <div className="highlight-pill">
              <FontAwesomeIcon icon={faStar} />
              <span>{totalItems}+ Fresh Items</span>
            </div>
          </div>

          <div className="hero-cta-group">
            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta-btn"
            >
              <span>Shop Official Store</span>
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>

            <button
              type="button"
              className="hero-secondary-btn"
              onClick={() => setIsStoreModalOpen(true)}
            >
              <FontAwesomeIcon icon={faLocationDot} />
              <span>Orderly Bazar, Varanasi (Map & Hours)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. STICKY CATEGORY PILLS BAR */}
      <nav
        className="category-sticky-bar"
        ref={categoryBarRef}
        aria-label="Category navigation"
      >
        <div className="category-scroll-container">
          <button
            type="button"
            className={`category-pill ${activeCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => selectCategory('ALL')}
            aria-pressed={activeCategory === 'ALL'}
          >
            <FontAwesomeIcon icon={faUtensils} className="pill-icon" />
            <span className="pill-text">All Items</span>
            <span className="pill-count">{totalItems}</span>
          </button>

          {categoryNames.map((cat) => {
            const count = categories[cat]?.length || 0;
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`category-pill ${isSelected ? 'active' : ''}`}
                onClick={() => selectCategory(cat)}
                aria-pressed={isSelected}
              >
                <span className="pill-text">{cat}</span>
                <span className="pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 4. MAIN CONTENT & SEARCH / FILTER CONTROLS */}
      <main className="main-content" id="catalog-section">
        {/* Search & Filter Toolbar */}
        <section className="search-filter-card" aria-label="Search and filter controls">
          <div className="search-input-wrapper">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
            <input
              type="search"
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sweets, namkeen, dry fruits, hampers..."
              aria-label="Search sweets and snacks"
            />
            {query && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setQuery('')}
                aria-label="Clear search input"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>

          {/* Popular Search Suggestions Chips */}
          <div className="popular-chips-wrap">
            <span className="chips-label">Popular:</span>
            <div className="chips-list">
              {POPULAR_SEARCH_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={`chip-btn ${query.toLowerCase() === chip.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setQuery(query.toLowerCase() === chip.toLowerCase() ? '' : chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Filter, Sort and View Controls Bar */}
          <div className="controls-row">
            {/* Tag filter pills */}
            <div className="tag-filter-group" role="group" aria-label="Filter by tags">
              <button
                type="button"
                className={`tag-btn ${activeTag === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveTag('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`tag-btn ${activeTag === 'BESTSELLER' ? 'active' : ''}`}
                onClick={() => setActiveTag('BESTSELLER')}
              >
                ⭐ Bestsellers
              </button>
              <button
                type="button"
                className={`tag-btn ${activeTag === 'NEW' ? 'active' : ''}`}
                onClick={() => setActiveTag('NEW')}
              >
                ✨ New
              </button>
              <button
                type="button"
                className={`tag-btn ${activeTag === 'HOT' ? 'active' : ''}`}
                onClick={() => setActiveTag('HOT')}
              >
                🔥 Hot
              </button>
              <button
                type="button"
                className={`tag-btn ${activeTag === 'HAMPERS' ? 'active' : ''}`}
                onClick={() => setActiveTag('HAMPERS')}
              >
                🎁 Hampers
              </button>
            </div>

            {/* Sort & View Mode Switches */}
            <div className="sort-view-group">
              <label className="sort-select-wrap">
                <span className="sr-only">Sort products by</span>
                <FontAwesomeIcon icon={faFilter} className="sort-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="DEFAULT">Recommended</option>
                  <option value="PRICE_ASC">Price: Low to High</option>
                  <option value="PRICE_DESC">Price: High to Low</option>
                  <option value="NAME_ASC">Name: A to Z</option>
                </select>
                <FontAwesomeIcon icon={faCaretDown} className="select-arrow" />
              </label>

              <div className="view-mode-switch" role="group" aria-label="Layout view mode">
                <button
                  type="button"
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => changeViewMode('list')}
                  title="Table / Rate List View (Default)"
                  aria-label="Table / Rate List View"
                  aria-pressed={viewMode === 'list'}
                >
                  <FontAwesomeIcon icon={faListUl} />
                </button>
                <button
                  type="button"
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => changeViewMode('grid')}
                  title="Grid Card View"
                  aria-label="Grid Card View"
                  aria-pressed={viewMode === 'grid'}
                >
                  <FontAwesomeIcon icon={faTableCellsLarge} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Results summary bar */}
        <div className="results-summary-strip">
          <span className="results-count">
            Showing <strong>{visibleItemsCount}</strong> items
            {activeCategory !== 'ALL' && ` in ${activeCategory}`}
            {query && ` matching "${query}"`}
            {activeTag !== 'ALL' && ` [${activeTag}]`}
          </span>

          <div className="summary-right">
            <span className="source-indicator" title="Data source">
              <span className="indicator-dot" />
              {sourceLabel}
            </span>
            {(query || activeCategory !== 'ALL' || activeTag !== 'ALL' || sortBy !== 'DEFAULT') && (
              <button
                type="button"
                className="reset-filters-btn"
                onClick={resetFilters}
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* 5. MENU PRODUCTS LIST */}
        {visibleCategories.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-wrap">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </div>
            <h3>No matching sweets or snacks found</h3>
            <p>
              We couldn&apos;t find anything matching your filter criteria. Try clearing the search term or resetting filters to view our full collection.
            </p>
            <button
              type="button"
              className="empty-reset-btn"
              onClick={resetFilters}
            >
              View Full Menu ({totalItems} items)
            </button>
          </div>
        ) : (
          visibleCategories.map((category) => {
            const items = filteredCatalog[category] || [];
            if (items.length === 0) return null;

            return (
              <section
                key={category}
                className="catalog-category-block"
                id={`cat-${category.replace(/\W+/g, '-').toLowerCase()}`}
              >
                <header className="category-header">
                  <div className="category-title-box">
                    <h2 className="category-title">{category}</h2>
                    <span className="category-item-count">{items.length} items</span>
                  </div>
                  {activeCategory !== category && (
                    <button
                      type="button"
                      className="category-focus-btn"
                      onClick={() => selectCategory(category)}
                      title={`Filter only ${category}`}
                    >
                      Focus Category
                    </button>
                  )}
                </header>

                {/* Grid View */}
                {viewMode === 'grid' ? (
                  <div className="items-grid">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        className="menu-card"
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="card-media">
                          <MenuItemImage
                            productName={item.imageName}
                            variantId={item.variantId}
                            alt={item.name}
                            className="card-image"
                          />
                          <div className="media-overlay-top">
                            <VegBadge />
                            {item.tag && (
                              <span className="card-tag-pill">{item.tag}</span>
                            )}
                          </div>
                        </div>

                        <div className="card-content">
                          <div className="card-header-row">
                            <h3 className="card-title">{item.name}</h3>
                          </div>

                          {item.description ? (
                            <p className="card-description">{item.description}</p>
                          ) : null}

                          <div className="card-badges">
                            {item.shelfLife ? (
                              <span className="meta-chip">
                                <FontAwesomeIcon icon={faClock} />
                                {item.shelfLife} days shelf life
                              </span>
                            ) : (
                              <span className="meta-chip">
                                <FontAwesomeIcon icon={faClock} />
                                Fresh Daily
                              </span>
                            )}
                            {item.quantityType && (
                              <span className="meta-chip unit-chip">
                                {item.quantityType.toLowerCase() === 'kg'
                                  ? 'per kg'
                                  : item.quantityType.toLowerCase() === 'piece'
                                  ? 'per pc'
                                  : item.quantityType}
                              </span>
                            )}
                          </div>

                          <div className="card-footer-row">
                            <div className="price-block">
                              <span className="price-val">{item.priceLabel}</span>
                              {item.quantityType && (
                                <span className="price-sub">
                                  / {item.quantityType.toLowerCase() === 'kg' ? 'kg' : item.quantityType.toLowerCase() === 'piece' ? 'pc' : item.quantityType}
                                </span>
                              )}
                            </div>

                            <div className="card-actions-group" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="action-view-btn"
                                onClick={() => setSelectedItem(item)}
                                title="Quick view details"
                                aria-label={`View details of ${item.name}`}
                              >
                                <FontAwesomeIcon icon={faCircleInfo} />
                              </button>
                              <a
                                href={item.shopHref || SHOP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-shop-btn"
                                title={`Order ${item.name} online`}
                                aria-label={`Order ${item.name} online`}
                              >
                                <span>Order</span>
                                <FontAwesomeIcon icon={faExternalLinkAlt} />
                              </a>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  /* Table / Rate List View */
                  <div className="items-table-container">
                    <div className="table-header-strip" aria-hidden="true">
                      <span className="th-item">Delicacy / Sweets</span>
                      <span className="th-shelf">Freshness &amp; Shelf Life</span>
                      <span className="th-price">Rate</span>
                      <span className="th-action">Order</span>
                    </div>

                    <div className="items-list-view">
                      {items.map((item) => (
                        <article
                          key={item.id}
                          className="list-row-item"
                          onClick={() => setSelectedItem(item)}
                        >
                          {/* Col 1: Thumbnail + Title + Veg Mark */}
                          <div className="table-col-item">
                            <div className="list-media-thumb">
                              <MenuItemImage
                                productName={item.imageName}
                                variantId={item.variantId}
                                alt={item.name}
                                className="list-thumb-img"
                              />
                            </div>

                            <div className="list-info-main">
                              <div className="list-title-row">
                                <VegBadge />
                                <h3 className="list-title">{item.name}</h3>
                                {item.tag && <span className="list-tag">{item.tag}</span>}
                              </div>
                              <div className="list-meta-mobile">
                                {item.shelfLife ? (
                                  <span>{item.shelfLife} days shelf life</span>
                                ) : (
                                  <span>Fresh Daily</span>
                                )}
                                <span> • </span>
                                <span>{item.quantityType || 'unit'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Shelf Life & Unit */}
                          <div className="table-col-shelf">
                            <span className="table-shelf-badge">
                              <FontAwesomeIcon icon={faClock} />
                              {item.shelfLife ? `${item.shelfLife} days shelf life` : 'Fresh Daily'}
                            </span>
                            <span className="table-unit-badge">
                              {item.quantityType?.toLowerCase() === 'kg'
                                ? 'Per kg'
                                : item.quantityType?.toLowerCase() === 'piece'
                                ? 'Per pc'
                                : item.quantityType || 'unit'}
                            </span>
                          </div>

                          {/* Col 3: Rate */}
                          <div className="table-col-price">
                            <strong>{item.priceLabel}</strong>
                            <small>
                              {item.quantityType?.toLowerCase() === 'kg'
                                ? '/ kg'
                                : item.quantityType?.toLowerCase() === 'piece'
                                ? '/ pc'
                                : ''}
                            </small>
                          </div>

                          {/* Col 4: Action */}
                          <div className="table-col-action" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={item.shopHref || SHOP_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="list-order-btn"
                              title={`Order ${item.name} online`}
                            >
                              <span>Order</span>
                              <FontAwesomeIcon icon={faExternalLinkAlt} />
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>

      {/* 6. RICH ITEM DETAILS MODAL / BOTTOM SHEET */}
      {selectedItem && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="item-modal-title"
        >
          <div
            className="item-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSelectedItem(null)}
              aria-label="Close modal"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <div className="modal-content-split">
              <div className="modal-media-pane">
                <MenuItemImage
                  productName={selectedItem.imageName}
                  variantId={selectedItem.variantId}
                  alt={selectedItem.name}
                  className="modal-product-img"
                />
                <div className="modal-media-badges">
                  <VegBadge />
                  {selectedItem.tag && (
                    <span className="modal-tag-pill">{selectedItem.tag}</span>
                  )}
                </div>
              </div>

              <div className="modal-info-pane">
                <div className="modal-header-top">
                  <span className="modal-category-breadcrumb">
                    {selectedItem.categoryName || 'Signature Sweets'}
                  </span>
                  <h2 id="item-modal-title" className="modal-item-title">
                    {selectedItem.name}
                  </h2>
                </div>

                <div className="modal-price-strip">
                  <span className="modal-price-big">{selectedItem.priceLabel}</span>
                  {selectedItem.quantityType && (
                    <span className="modal-price-unit">
                      per {selectedItem.quantityType.toLowerCase() === 'kg' ? 'kilogram' : selectedItem.quantityType.toLowerCase() === 'piece' ? 'piece' : selectedItem.quantityType}
                    </span>
                  )}
                </div>

                <div className="modal-attributes-list">
                  <div className="modal-attr-item">
                    <FontAwesomeIcon icon={faClock} />
                    <span>
                      {selectedItem.shelfLife
                        ? `Shelf Life: ${selectedItem.shelfLife} days`
                        : 'Freshly Prepared Daily in Varanasi'}
                    </span>
                  </div>
                  <div className="modal-attr-item">
                    <FontAwesomeIcon icon={faShieldHeart} />
                    <span>Pure Vegetarian &amp; FSSAI Standard Compliant</span>
                  </div>
                </div>

                {selectedItem.description && (
                  <div className="modal-description-box">
                    <h4>Description</h4>
                    <p>{selectedItem.description}</p>
                  </div>
                )}

                {Array.isArray(selectedItem.ingredients) && selectedItem.ingredients.length > 0 && (
                  <div className="modal-ingredients-box">
                    <h4>Included Delicacies</h4>
                    <ul>
                      {selectedItem.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="modal-action-buttons">
                  <a
                    href={selectedItem.shopHref || SHOP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-shop-btn"
                  >
                    <span>Order Online at Official Store</span>
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </a>

                  <div className="modal-secondary-actions">
                    <a
                      href={buildWhatsAppLink(selectedItem)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="modal-whatsapp-btn"
                    >
                      <FontAwesomeIcon icon={faWhatsapp} />
                      <span>Order on WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      className="modal-share-btn"
                      onClick={() => handleShareItem(selectedItem)}
                      title="Share this sweet"
                    >
                      <FontAwesomeIcon icon={copiedLink ? faCheck : faShareNodes} />
                      <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. STORE INFO & CONTACT MODAL */}
      {isStoreModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsStoreModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="store-modal-title"
        >
          <div
            className="store-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsStoreModalOpen(false)}
              aria-label="Close modal"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <div className="store-modal-header">
              <img src={logo} alt="New Rajshree Sweets" className="store-modal-logo" />
              <div>
                <h2 id="store-modal-title" className="store-modal-title">New Rajshree Sweets</h2>
                <p className="store-modal-subtitle">Orderly Bazar, Varanasi</p>
              </div>
            </div>

            <div className="store-details-grid">
              <div className="store-info-card">
                <FontAwesomeIcon icon={faLocationDot} className="store-card-icon" />
                <div>
                  <strong>Store Address</strong>
                  <p>{STORE_ADDRESS}</p>
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="directions-link"
                  >
                    Open in Google Maps <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </a>
                </div>
              </div>

              <div className="store-info-card">
                <FontAwesomeIcon icon={faClock} className="store-card-icon" />
                <div>
                  <strong>Business Hours</strong>
                  <p>Every day: 8:00 AM – 10:30 PM IST</p>
                  <span className="open-now-badge">Fresh Batches Ready</span>
                </div>
              </div>

              <div className="store-info-card">
                <FontAwesomeIcon icon={faPhone} className="store-card-icon" />
                <div>
                  <strong>Direct Calling</strong>
                  <p>{CONTACT_PHONE}</p>
                  <a href={`tel:${CONTACT_PHONE}`} className="call-action-link">
                    Call Now
                  </a>
                </div>
              </div>

              <div className="store-info-card">
                <FontAwesomeIcon icon={faWhatsapp} className="store-card-icon whatsapp-accent" />
                <div>
                  <strong>WhatsApp Orders &amp; Queries</strong>
                  <p>+91 {WHATSAPP_NUMBER.slice(2)}</p>
                  <a
                    href={buildWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-action-link"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </div>

              <div className="store-info-card full-span">
                <FontAwesomeIcon icon={faEnvelope} className="store-card-icon" />
                <div>
                  <strong>Email &amp; Website</strong>
                  <p>{STORE_EMAIL}</p>
                  <a
                    href={WEBSITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="website-action-link"
                  >
                    Visit newrajshreesweets.com <FontAwesomeIcon icon={faGlobe} />
                  </a>
                </div>
              </div>
            </div>

            <div className="compliance-strip">
              <span><strong>FSSAI:</strong> 12714038000517</span>
              <span><strong>GSTIN:</strong> 09AAHCN9500A1ZP</span>
              <span><strong>CIN:</strong> U15490UP2021PTC156096</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. FOOTER */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={logo} alt="New Rajshree Sweets" className="footer-logo" />
            <div>
              <h3 className="footer-brand-title">New Rajshree Sweets</h3>
              <p className="footer-brand-desc">
                Handcrafted pure desi ghee sweets, Varanasi chhena specialities, seasonal festive hampers &amp; fresh namkeen.
              </p>
            </div>
          </div>

          <div className="footer-quick-links">
            <a href={SHOP_URL} target="_blank" rel="noopener noreferrer">
              Online Shop <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
            <a href={HAMPERS_URL} target="_blank" rel="noopener noreferrer">
              Festive Hampers <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              Store Directions <FontAwesomeIcon icon={faLocationDot} />
            </a>
            <a href={`tel:${CONTACT_PHONE}`}>
              Call: {CONTACT_PHONE}
            </a>
          </div>

          <div className="footer-compliance">
            <span>CIN: U15490UP2021PTC156096</span>
            <span>GSTIN: 09AAHCN9500A1ZP</span>
            <span>FSSAI Lic: 12714038000517</span>
          </div>

          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} New Rajshree Sweets Pvt. Ltd. All rights reserved. Varanasi, Uttar Pradesh, India.
          </p>
        </div>
      </footer>

      {/* 9. FLOATING ACTION: BACK TO TOP */}
      {showScrollTop && (
        <button
          type="button"
          className="back-to-top-btn"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      )}

      {/* 10. MOBILE BOTTOM QUICK ACTION BAR */}
      <nav className="mobile-bottom-bar" aria-label="Mobile quick actions">
        <a href={`tel:${CONTACT_PHONE}`} className="mobile-bar-item">
          <FontAwesomeIcon icon={faPhone} />
          <span>Call</span>
        </a>
        <a
          href={buildWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="mobile-bar-item whatsapp-item"
        >
          <FontAwesomeIcon icon={faWhatsapp} />
          <span>WhatsApp</span>
        </a>
        <button
          type="button"
          className="mobile-bar-item"
          onClick={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <FontAwesomeIcon icon={faUtensils} />
          <span>Menu</span>
        </button>
        <button
          type="button"
          className="mobile-bar-item"
          onClick={() => setIsStoreModalOpen(true)}
        >
          <FontAwesomeIcon icon={faStore} />
          <span>Store</span>
        </button>
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mobile-bar-shop-btn"
        >
          <span>Shop</span>
          <FontAwesomeIcon icon={faExternalLinkAlt} />
        </a>
      </nav>
    </div>
  );
}

export default App;
