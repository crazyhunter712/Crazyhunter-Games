console.log('Script loaded');
document.title = 'Crazy Hunter Hub - Loading...';
let games = [];
let filteredGames = [];
let selectedGame = null;
let searchQuery = '';
let isFullscreen = false;
let userRatings = JSON.parse(localStorage.getItem('crazyhunter_ratings') || '{}');
let favorites = JSON.parse(localStorage.getItem('crazyhunter_favorites') || '[]');
// Playtime Tracking
let currentTheme = localStorage.getItem('crazyhunter_theme') || 'orange';

const themes = {
    orange: { primary: '#f97316', dark: '#ea580c' },
    blue: { primary: '#3b82f6', dark: '#2563eb' },
    purple: { primary: '#a855f7', dark: '#9333ea' },
    green: { primary: '#22c55e', dark: '#16a34a' }
};

const gamesGrid = document.getElementById('games-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const favoritesSection = document.getElementById('favorites-section');
const favoritesCount = document.getElementById('favorites-count');
const totalGamesCount = document.getElementById('total-games-count');
const gamePlay = document.getElementById('game-play');
const searchInput = document.getElementById('search-input');
const backButton = document.getElementById('back-button');
const closeButton = document.getElementById('close-button');
const fullscreenButton = document.getElementById('fullscreen-button');
const iframeContainer = document.getElementById('iframe-container');
const gameIframe = document.getElementById('game-iframe');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingBar = document.getElementById('loading-bar');
const gameTitle = document.getElementById('game-title');
const aboutTitle = document.getElementById('about-title');
const aboutDescription = document.getElementById('about-description');

const mainContainer = document.getElementById('main-container');
const debugLog = document.getElementById('debug-log');

function logToDebug(msg) {
    if (debugLog) {
        debugLog.textContent = msg;
        console.log('DEBUG:', msg);
    }
}

// Request Modal Elements
const requestModal = document.getElementById('request-modal');
const requestGameBtn = document.getElementById('request-game-btn');
const closeRequestModal = document.getElementById('close-request-modal');
const requestForm = document.getElementById('request-form');
const requestSuccess = document.getElementById('request-success');
const resetRequest = document.getElementById('reset-request');

// Comments Elements
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');
const commentsCount = document.getElementById('comments-count');

function safeCreateIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

async function init() {
    logToDebug('Initializing app...');
    if (totalGamesCount) {
        totalGamesCount.textContent = 'Loading...';
        totalGamesCount.style.color = '#f97316';
    }
    try {
        applyTheme(currentTheme, false);
        
        // Test API
        fetch('/api/test').then(r => r.json()).then(d => console.log('API Test:', d)).catch(e => console.error('API Test Failed:', e));
        
        logToDebug('Fetching games...');
        let response = await fetch(`/api/games?t=${Date.now()}`);
        if (!response.ok) {
            logToDebug('API fetch failed, trying games.json');
            response = await fetch(`games.json?t=${Date.now()}`);
        }
        
        if (!response.ok) {
            logToDebug('games.json fetch failed, trying /games.json');
            response = await fetch(`/games.json?t=${Date.now()}`);
        }
        
        if (!response.ok) {
            logToDebug(`Fetch failed: ${response.status}`);
            throw new Error(`Failed to fetch games: ${response.status}`);
        }
        
        games = await response.json();
        logToDebug(`Loaded ${games.length} games`);
        document.title = 'Crazy Hunter Hub';
        filteredGames = [...games];
        renderGames();
        renderFavorites();
        
        // Check for shared game in URL
        const urlParams = new URLSearchParams(window.location.search);
        const sharedGameId = urlParams.get('game');
        if (sharedGameId) {
            const sharedGame = games.find(g => g.id === sharedGameId);
            if (sharedGame) {
                setTimeout(() => openGame(sharedGame), 500);
            }
        }
        safeCreateIcons();
    } catch (error) {
        console.error('Initialization error:', error);
        // Fallback game for debugging
        if (games.length === 0) {
            games = [{
                id: 'fallback-game',
                title: 'Check Connection',
                description: 'The games list failed to load. Please refresh or check your internet connection.',
                thumbnail: 'https://picsum.photos/seed/error/480/270',
                iframeUrl: '',
                baseRating: 0,
                ratingCount: 0,
                plays: '0',
                avgPlayTime: 'N/A',
                highScore: 'N/A'
            }];
            filteredGames = [...games];
        }
        renderGames();
        renderFavorites();
    }
}

function getAverageRating(game) {
    const userRating = userRatings[game.id];
    if (userRating) {
        const total = (game.baseRating * game.ratingCount) + userRating;
        return (total / (game.ratingCount + 1)).toFixed(1);
    }
    return game.baseRating.toFixed(1);
}

function renderGames() {
    if (!gamesGrid) return;
    gamesGrid.innerHTML = '';
    if (totalGamesCount) {
        totalGamesCount.textContent = `${filteredGames.length} Game${filteredGames.length !== 1 ? 's' : ''}`;
        totalGamesCount.style.color = '';
    }
    
    if (filteredGames.length === 0) {
        gamesGrid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <div class="inline-block p-4 bg-white/5 rounded-full mb-4">
                    <i data-lucide="search" class="w-8 h-8 text-white/20"></i>
                </div>
                <h3 class="text-xl font-medium">No games found</h3>
                <p class="text-white/40">Try searching for something else.</p>
            </div>
        `;
        safeCreateIcons();
        return;
    }

    filteredGames.forEach(game => {
        const avgRating = getAverageRating(game);
        const isFavorite = favorites.includes(game.id);
        const card = document.createElement('div');
        card.className = 'group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 transform hover:-translate-y-1';
        card.innerHTML = `
            <div class="aspect-video overflow-hidden relative">
                <img
                    src="${game.thumbnail}"
                    alt="${game.title}"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerpolicy="no-referrer"
                />
                <div class="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1 border border-white/10">
                    <i data-lucide="star" class="w-3 h-3 text-primary fill-primary"></i>
                    <span class="text-xs font-bold">${avgRating}</span>
                </div>
                <div class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1 border border-white/10">
                    <i data-lucide="play" class="w-3 h-3 text-white/60"></i>
                    <span class="text-[10px] font-medium text-white/80">${game.plays || '0'}</span>
                </div>
                <button 
                    onclick="event.stopPropagation(); toggleFavorite('${game.id}')"
                    class="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 hover:bg-white/10 transition-all group/heart"
                >
                    <i data-lucide="heart" class="w-4 h-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white/40 group-hover/heart:text-red-500'}"></i>
                </button>
                <button 
                    onclick="event.stopPropagation(); shareGame('${game.id}')"
                    class="absolute top-2 right-12 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 hover:bg-white/10 transition-all group/share"
                    title="Share Game"
                >
                    <i data-lucide="share-2" class="w-4 h-4 text-white/40 group-hover/share:text-primary"></i>
                </button>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 group-hover:text-primary transition-colors">${game.title}</h3>
                <p class="text-sm text-white/60 line-clamp-2">${game.description}</p>
            </div>
            <div class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="bg-primary p-2 rounded-full shadow-lg">
                    <i data-lucide="external-link" class="w-4 h-4 text-black"></i>
                </div>
            </div>
        `;
        card.onclick = () => openGame(game);
        gamesGrid.appendChild(card);
    });
    
    safeCreateIcons();
}

function renderFavorites() {
    if (!favoritesGrid) return;
    const favoriteGames = games.filter(game => favorites.includes(game.id));
    if (favoritesCount) {
        favoritesCount.textContent = `${favoriteGames.length} Game${favoriteGames.length !== 1 ? 's' : ''}`;
    }
    
    if (favoriteGames.length === 0) {
        if (favoritesSection) favoritesSection.classList.add('hidden');
        return;
    }

    if (favoritesSection) favoritesSection.classList.remove('hidden');
    favoritesGrid.innerHTML = '';

    favoriteGames.forEach(game => {
        const avgRating = getAverageRating(game);
        const card = document.createElement('div');
        card.className = 'group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 transform hover:-translate-y-1';
        card.innerHTML = `
            <div class="aspect-video overflow-hidden relative">
                <img
                    src="${game.thumbnail}"
                    alt="${game.title}"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerpolicy="no-referrer"
                />
                <div class="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1 border border-white/10">
                    <i data-lucide="star" class="w-3 h-3 text-primary fill-primary"></i>
                    <span class="text-xs font-bold">${avgRating}</span>
                </div>
                <div class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1 border border-white/10">
                    <i data-lucide="play" class="w-3 h-3 text-white/60"></i>
                    <span class="text-[10px] font-medium text-white/80">${game.plays || '0'}</span>
                </div>
                <button 
                    onclick="event.stopPropagation(); toggleFavorite('${game.id}')"
                    class="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                >
                    <i data-lucide="heart" class="w-4 h-4 text-red-500 fill-red-500"></i>
                </button>
                <button 
                    onclick="event.stopPropagation(); shareGame('${game.id}')"
                    class="absolute top-2 right-12 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 hover:bg-white/10 transition-all group/share"
                    title="Share Game"
                >
                    <i data-lucide="share-2" class="w-4 h-4 text-white/40 group-hover/share:text-primary"></i>
                </button>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 group-hover:text-primary transition-colors">${game.title}</h3>
                <p class="text-sm text-white/60 line-clamp-2">${game.description}</p>
            </div>
        `;
        card.onclick = () => openGame(game);
        favoritesGrid.appendChild(card);
    });
    
    safeCreateIcons();
}

window.toggleFavorite = function(gameId) {
    if (favorites.includes(gameId)) {
        favorites = favorites.filter(id => id !== gameId);
    } else {
        favorites.push(gameId);
    }
    localStorage.setItem('crazyhunter_favorites', JSON.stringify(favorites));
    renderGames();
    renderFavorites();
};

window.shareGame = async function(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
    const shareData = {
        title: `Play ${game.title} on Crazy Hunter Hub!`,
        text: `Check out ${game.title} - ${game.description}`,
        url: shareUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.log('Share cancelled or failed:', err);
        }
    } else {
        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert(`Link copied to clipboard: ${shareUrl}`);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert(`Share this link: ${shareUrl}`);
        }
    }
};

function openGame(game) {
    selectedGame = game;
    
    // Show loading overlay
    if (loadingOverlay) {
        loadingOverlay.classList.remove('opacity-0', 'invisible');
        loadingOverlay.classList.add('opacity-100', 'visible');
        if (loadingBar) loadingBar.style.width = '0%';
    }

    // Simulate initial progress
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 15;
            if (loadingBar) loadingBar.style.width = `${Math.min(progress, 90)}%`;
        } else {
            clearInterval(interval);
        }
    }, 200);

    gameIframe.src = game.iframeUrl;
    
    // Handle iframe load
    if (gameIframe) {
        gameIframe.onload = () => {
            clearInterval(interval);
            if (loadingBar) loadingBar.style.width = '100%';
            
            setTimeout(() => {
                if (loadingOverlay) {
                    loadingOverlay.classList.add('opacity-0', 'invisible');
                    loadingOverlay.classList.remove('opacity-100', 'visible');
                }
            }, 500);
        };
    }

    if (gameTitle) gameTitle.textContent = game.title;
    if (aboutTitle) aboutTitle.textContent = `About ${game.title}`;
    if (aboutDescription) aboutDescription.textContent = game.description;
    
    // Inject stats interface
    const statsContainer = document.createElement('div');
    statsContainer.className = 'grid grid-cols-3 gap-4 mt-6';
    statsContainer.innerHTML = `
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div class="flex justify-center mb-2">
                <i data-lucide="play-circle" class="w-5 h-5 text-primary"></i>
            </div>
            <div class="text-xl font-bold">${game.plays || '0'}</div>
            <div class="text-[10px] uppercase tracking-wider text-white/40 font-bold">Total Plays</div>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div class="flex justify-center mb-2">
                <i data-lucide="clock" class="w-5 h-5 text-primary"></i>
            </div>
            <div class="text-xl font-bold">${game.avgPlayTime || 'N/A'}</div>
            <div class="text-[10px] uppercase tracking-wider text-white/40 font-bold">Avg Time</div>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div class="flex justify-center mb-2">
                <i data-lucide="trophy" class="w-5 h-5 text-primary"></i>
            </div>
            <div class="text-xl font-bold truncate px-1">${game.highScore || 'N/A'}</div>
            <div class="text-[10px] uppercase tracking-wider text-white/40 font-bold">High Score</div>
        </div>
    `;

    // Inject rating interface
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'mt-6 p-6 bg-white/5 border border-white/10 rounded-2xl';
    
    const userRating = userRatings[game.id] || 0;
    const avgRating = getAverageRating(game);
    
    ratingContainer.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h4 class="font-bold text-lg">Rate this game</h4>
            <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <i data-lucide="star" class="w-4 h-4 text-primary fill-primary"></i>
                    <span class="font-bold text-primary">${avgRating}</span>
                </div>
                <span class="text-xs text-white/40">${game.ratingCount + (userRatings[game.id] ? 1 : 0)} ratings</span>
            </div>
        </div>
        <div class="flex gap-2">
            ${[1, 2, 3, 4, 5].map(star => `
                <button 
                    onclick="rateGame('${game.id}', ${star})"
                    class="p-2 rounded-xl transition-all ${userRating >= star ? 'bg-primary text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}"
                >
                    <i data-lucide="star" class="w-6 h-6 ${userRating >= star ? 'fill-current' : ''}"></i>
                </button>
            `).join('')}
        </div>
        <p class="mt-4 text-sm text-white/40">
            ${userRating > 0 ? `You rated this ${userRating} stars. Thanks for your feedback!` : 'Select a star to rate this game.'}
        </p>
    `;
    
    // Remove existing stats and rating container if any
    const existingStats = document.getElementById('game-stats-ui');
    if (existingStats) existingStats.remove();
    const existingRating = document.getElementById('game-rating-ui');
    if (existingRating) existingRating.remove();
    
    statsContainer.id = 'game-stats-ui';
    ratingContainer.id = 'game-rating-ui';
    
    const infoPanel = document.querySelector('#game-info .flex-1');
    if (infoPanel) {
        infoPanel.appendChild(statsContainer);
        infoPanel.appendChild(ratingContainer);
    }
    
    const gridView = document.getElementById('grid-view');
    if (gridView) gridView.classList.add('hidden');
    if (gamePlay) gamePlay.classList.remove('hidden');
    if (mainContainer) {
        mainContainer.classList.remove('max-w-7xl');
        mainContainer.classList.add('max-w-none', 'px-0', 'sm:px-4');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Load comments
    loadComments(game.id);

    safeCreateIcons();
}

async function loadComments(gameId) {
    try {
        const response = await fetch(`/api/comments/${gameId}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const comments = await response.json();
        renderComments(comments);
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

function renderComments(comments) {
    if (commentsCount) {
        commentsCount.textContent = `${comments.length} Review${comments.length !== 1 ? 's' : ''}`;
    }
    
    if (!commentsList) return;

    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <p class="text-white/40">No reviews yet. Be the first to leave one!</p>
            </div>
        `;
        return;
    }

    commentsList.innerHTML = comments.map(comment => `
        <div class="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                        ${comment.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h5 class="font-bold">${comment.author}</h5>
                        <p class="text-xs text-white/40">${new Date(comment.date).toLocaleDateString()}</p>
                    </div>
                </div>
                ${comment.rating > 0 ? `
                    <div class="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-lg border border-primary/20">
                        <i data-lucide="star" class="w-3 h-3 text-primary fill-primary"></i>
                        <span class="text-xs font-bold text-primary">${comment.rating}</span>
                    </div>
                ` : ''}
            </div>
            <p class="text-white/70 leading-relaxed">${comment.text}</p>
        </div>
    `).join('');
    
    safeCreateIcons();
}

window.rateGame = async function(gameId, rating) {
    userRatings[gameId] = rating;
    localStorage.setItem('crazyhunter_ratings', JSON.stringify(userRatings));
    
    const game = games.find(g => g.id === gameId);
    if (game) {
        openGame(game); // Refresh play view
    }
};

function closeGame() {
    selectedGame = null;
    if (gameIframe) gameIframe.src = '';
    
    // Reset loading state
    if (loadingOverlay) {
        loadingOverlay.classList.add('opacity-0', 'invisible');
        loadingOverlay.classList.remove('opacity-100', 'visible');
    }
    if (loadingBar) loadingBar.style.width = '0%';

    const gridView = document.getElementById('grid-view');
    if (gridView) gridView.classList.remove('hidden');
    if (gamePlay) gamePlay.classList.add('hidden');
    if (mainContainer) {
        mainContainer.classList.remove('max-w-none', 'px-0', 'sm:px-4');
        mainContainer.classList.add('max-w-7xl');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderGames(); // Refresh grid to show new ratings
}

function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase();
    filteredGames = games.filter(game => 
        game.title.toLowerCase().includes(searchQuery) || 
        game.description.toLowerCase().includes(searchQuery)
    );
    renderGames();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        iframeContainer.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    isFullscreen = !!document.fullscreenElement;
    if (isFullscreen) {
        iframeContainer.classList.add('rounded-none', 'border-none');
        iframeContainer.classList.remove('rounded-3xl', 'aspect-video');
        fullscreenButton.innerHTML = '<i data-lucide="minimize-2" class="w-5 h-5"></i>';
    } else {
        iframeContainer.classList.remove('rounded-none', 'border-none');
        iframeContainer.classList.add('rounded-3xl', 'aspect-video');
        fullscreenButton.innerHTML = '<i data-lucide="maximize-2" class="w-5 h-5"></i>';
    }
    safeCreateIcons();
});

// Modal Logic
if (requestGameBtn) {
    requestGameBtn.addEventListener('click', () => {
        requestModal.classList.remove('hidden');
        requestForm.classList.remove('hidden');
        requestSuccess.classList.add('hidden');
        safeCreateIcons();
    });
}

if (closeRequestModal) {
    closeRequestModal.addEventListener('click', () => {
        requestModal.classList.add('hidden');
    });
}

if (requestModal) {
    requestModal.addEventListener('click', (e) => {
        if (e.target === requestModal) requestModal.classList.add('hidden');
    });
}

if (requestForm) {
    requestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('req-title').value;
        const url = document.getElementById('req-url').value;
        
        // Save to local storage (simulating "working")
        const requests = JSON.parse(localStorage.getItem('crazyhunter_requests') || '[]');
        requests.push({ title, url, date: new Date().toISOString() });
        localStorage.setItem('crazyhunter_requests', JSON.stringify(requests));
        
        requestForm.classList.add('hidden');
        requestSuccess.classList.remove('hidden');
        safeCreateIcons();
    });
}

if (resetRequest) {
    resetRequest.addEventListener('click', () => {
        requestForm.reset();
        requestForm.classList.remove('hidden');
        requestSuccess.classList.add('hidden');
        safeCreateIcons();
    });
}

if (searchInput) searchInput.addEventListener('input', handleSearch);
if (backButton) backButton.addEventListener('click', closeGame);
if (closeButton) closeButton.addEventListener('click', closeGame);
if (fullscreenButton) fullscreenButton.addEventListener('click', toggleFullscreen);

if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedGame) return;

        const authorInput = document.getElementById('comment-author');
        const textInput = document.getElementById('comment-text');
        
        const commentData = {
            gameId: selectedGame.id,
            author: authorInput.value,
            text: textInput.value,
            rating: userRatings[selectedGame.id] || 0
        };

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentData)
            });

            if (!response.ok) throw new Error('Failed to post comment');
            
            // Refresh comments
            loadComments(selectedGame.id);
            
            // Reset form
            textInput.value = '';
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post review. Please try again.');
        }
    });
}

const openNewTabBtn = document.getElementById('open-new-tab');
if (openNewTabBtn) {
    openNewTabBtn.addEventListener('click', () => {
        if (selectedGame && selectedGame.iframeUrl) {
            window.open(selectedGame.iframeUrl, '_blank');
        }
    });
}

// Theme Logic
window.setTheme = function(themeName) {
    currentTheme = themeName;
    localStorage.setItem('crazyhunter_theme', themeName);
    applyTheme(themeName);
};

function applyTheme(themeName, shouldRender = true) {
    const theme = themes[themeName];
    if (!theme) return;
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--primary-color-dark', theme.dark);
    
    const dot = document.getElementById('current-theme-dot');
    if (dot) dot.style.backgroundColor = theme.primary;
    
    if (shouldRender) {
        renderGames();
        renderFavorites();
    }
}

// Initialize
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        init();
        safeCreateIcons();
    });
} else {
    init();
    safeCreateIcons();
}
