let games = [];
let filteredGames = [];
let selectedGame = null;
let searchQuery = '';
let isFullscreen = false;
let userRatings = JSON.parse(localStorage.getItem('crazyhunter_ratings') || '{}');
let favorites = JSON.parse(localStorage.getItem('crazyhunter_favorites') || '[]');
let recentGames = JSON.parse(localStorage.getItem('crazyhunter_recent') || '[]');
let personalScores = JSON.parse(localStorage.getItem('crazyhunter_scores') || '{}');
let currentTheme = localStorage.getItem('crazyhunter_theme') || 'orange';
let currentCategory = 'all';
let currentSort = 'default';

const themes = {
    orange: { primary: '#f97316', dark: '#ea580c' },
    blue: { primary: '#3b82f6', dark: '#2563eb' },
    purple: { primary: '#a855f7', dark: '#9333ea' },
    green: { primary: '#22c55e', dark: '#16a34a' }
};

const gamesGrid = document.getElementById('games-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const favoritesSection = document.getElementById('favorites-section');
const recentSection = document.getElementById('recent-section');
const recentGrid = document.getElementById('recent-grid');
const categoryFilters = document.getElementById('category-filters');
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
const gameCategoryTag = document.getElementById('game-category-tag');
const aboutTitle = document.getElementById('about-title');
const aboutDescription = document.getElementById('about-description');
const personalScoreInput = document.getElementById('personal-score-input');
const saveScoreBtn = document.getElementById('save-score-btn');
const savedScoreDisplay = document.getElementById('saved-score-display');
const currentSortLabel = document.getElementById('current-sort-label');

// Comment Elements
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');
const commentCount = document.getElementById('comment-count');
const commentStars = document.getElementById('comment-stars');
const commentRatingVal = document.getElementById('comment-rating-val');

const mainContainer = document.getElementById('main-container');

// Request Modal Elements
const requestModal = document.getElementById('request-modal');
const requestGameBtn = document.getElementById('request-game-btn');
const closeRequestModal = document.getElementById('close-request-modal');
const requestForm = document.getElementById('request-form');
const requestSuccess = document.getElementById('request-success');
const resetRequest = document.getElementById('reset-request');
const randomGameBtn = document.getElementById('random-game-btn');

async function init() {
    applyTheme(currentTheme);
    try {
        const response = await fetch('./src/games.json');
        if (!response.ok) throw new Error('Failed to fetch games');
        games = await response.json();
        filteredGames = [...games];
        renderCategories();
        renderGames();
        renderFavorites();
        renderRecent();
        renderGameOfTheDay();

        // Check for shared game in URL
        const urlParams = new URLSearchParams(window.location.search);
        const sharedGameId = urlParams.get('game');
        if (sharedGameId) {
            const sharedGame = games.find(g => g.id === sharedGameId);
            if (sharedGame) {
                setTimeout(() => openGame(sharedGame), 500);
            }
        }
    } catch (error) {
        console.error('Error loading games:', error);
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
    gamesGrid.innerHTML = '';
    
    let displayGames = [...filteredGames];
    
    // Filter by category
    if (currentCategory !== 'all') {
        displayGames = displayGames.filter(g => g.category === currentCategory);
    }

    // Sort games
    switch(currentSort) {
        case 'plays':
            displayGames.sort((a, b) => {
                const aPlays = a.plays.includes('M') ? parseFloat(a.plays) * 1000000 : parseFloat(a.plays) * 1000;
                const bPlays = b.plays.includes('M') ? parseFloat(b.plays) * 1000000 : parseFloat(b.plays) * 1000;
                return bPlays - aPlays;
            });
            break;
        case 'rating':
            displayGames.sort((a, b) => getAverageRating(b) - getAverageRating(a));
            break;
        case 'title':
            displayGames.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }

    totalGamesCount.textContent = `${displayGames.length} Game${displayGames.length !== 1 ? 's' : ''}`;
    
    if (displayGames.length === 0) {
        gamesGrid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <div class="inline-block p-4 bg-white/5 rounded-full mb-4">
                    <i data-lucide="search" class="w-8 h-8 text-white/20"></i>
                </div>
                <h3 class="text-xl font-medium">No games found</h3>
                <p class="text-white/40">Try searching for something else.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    displayGames.forEach(game => {
        const card = createGameCard(game);
        gamesGrid.appendChild(card);
    });
    
    lucide.createIcons();
}

function renderFavorites() {
    const favoriteGames = games.filter(game => favorites.includes(game.id));
    favoritesCount.textContent = `${favoriteGames.length} Game${favoriteGames.length !== 1 ? 's' : ''}`;
    
    if (favoriteGames.length === 0) {
        favoritesSection.classList.add('hidden');
        return;
    }

    favoritesSection.classList.remove('hidden');
    favoritesGrid.innerHTML = '';

    favoriteGames.forEach(game => {
        const avgRating = getAverageRating(game);
        const card = createGameCard(game, true);
        favoritesGrid.appendChild(card);
    });
    
    lucide.createIcons();
}

function renderRecent() {
    if (recentGames.length === 0) {
        recentSection.classList.add('hidden');
        return;
    }

    recentSection.classList.remove('hidden');
    recentGrid.innerHTML = '';

    // Show last 4 recent games
    const displayRecent = recentGames.slice(0, 4);
    displayRecent.forEach(gameId => {
        const game = games.find(g => g.id === gameId);
        if (game) {
            const card = createGameCard(game);
            recentGrid.appendChild(card);
        }
    });
    
    lucide.createIcons();
}

function renderCategories() {
    const categories = ['all', ...new Set(games.map(g => g.category))];
    categoryFilters.innerHTML = '';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.onclick = () => setCategory(cat);
        btn.className = `category-btn px-6 py-2.5 rounded-2xl transition-all font-bold text-sm whitespace-nowrap ${currentCategory === cat ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'}`;
        btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        categoryFilters.appendChild(btn);
    });
}

function renderGameOfTheDay() {
    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gotd = games[seed % games.length];
    
    const gotdSection = document.getElementById('game-of-the-day');
    const gotdImage = document.getElementById('gotd-image');
    const gotdTitle = document.getElementById('gotd-title');
    const gotdDesc = document.getElementById('gotd-desc');
    const gotdPlayBtn = document.getElementById('gotd-play-btn');
    
    if (gotd) {
        gotdImage.src = gotd.thumbnail;
        gotdTitle.textContent = gotd.title;
        gotdDesc.textContent = gotd.description;
        gotdSection.onclick = () => openGame(gotd);
        gotdPlayBtn.onclick = (e) => {
            e.stopPropagation();
            openGame(gotd);
        };
    }
}

window.setCategory = function(cat) {
    currentCategory = cat;
    renderCategories();
    renderGames();
};

window.setSort = function(sortType) {
    currentSort = sortType;
    const labels = {
        default: 'Sort: Default',
        plays: 'Sort: Most Played',
        rating: 'Sort: Top Rated',
        title: 'Sort: A-Z'
    };
    currentSortLabel.textContent = labels[sortType];
    renderGames();
};

function createGameCard(game, isFavoriteList = false) {
    const avgRating = getAverageRating(game);
    const isFavorite = favorites.includes(game.id);
    const isTrending = game.plays && (game.plays.includes('M') || parseInt(game.plays) > 500);
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
            ${isTrending ? `
            <div class="absolute top-2 left-12 px-2 py-1 bg-primary text-black rounded-lg flex items-center gap-1 border border-primary/20 shadow-lg shadow-primary/20">
                <i data-lucide="trending-up" class="w-3 h-3"></i>
                <span class="text-[10px] font-black uppercase">Trending</span>
            </div>
            ` : ''}
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
            <div class="flex items-center justify-between mb-1">
                <h3 class="font-bold text-lg group-hover:text-primary transition-colors">${game.title}</h3>
                <span class="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-white/40 font-bold uppercase tracking-wider">${game.category}</span>
            </div>
            <p class="text-sm text-white/60 line-clamp-2">${game.description}</p>
        </div>
        <div class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="bg-primary p-2 rounded-full shadow-lg">
                <i data-lucide="external-link" class="w-4 h-4 text-black"></i>
            </div>
        </div>
    `;
    card.onclick = () => openGame(game);
    return card;
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
    
    // Add to recent games
    recentGames = [game.id, ...recentGames.filter(id => id !== game.id)].slice(0, 10);
    localStorage.setItem('crazyhunter_recent', JSON.stringify(recentGames));
    renderRecent();

    // Fetch and render comments
    fetchComments(game.id);
    renderCommentStars(5);

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

    gameTitle.textContent = game.title;
    gameCategoryTag.textContent = game.category;
    aboutTitle.textContent = `About ${game.title}`;
    aboutDescription.textContent = game.description;

    // Load personal high score
    const savedScore = personalScores[game.id];
    if (savedScore) {
        personalScoreInput.value = savedScore;
        savedScoreDisplay.innerHTML = `Current Best: <span class="text-white font-bold">${savedScore}</span>`;
        savedScoreDisplay.classList.remove('hidden');
    } else {
        personalScoreInput.value = '';
        savedScoreDisplay.classList.add('hidden');
    }
    
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
    infoPanel.appendChild(statsContainer);
    infoPanel.appendChild(ratingContainer);
    
    document.getElementById('grid-view').classList.add('hidden');
    gamePlay.classList.remove('hidden');
    mainContainer.classList.remove('max-w-7xl');
    mainContainer.classList.add('max-w-none', 'px-0', 'sm:px-4');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
}

window.rateGame = function(gameId, rating) {
    userRatings[gameId] = rating;
    localStorage.setItem('crazyhunter_ratings', JSON.stringify(userRatings));
    
    const game = games.find(g => g.id === gameId);
    if (game) {
        openGame(game); // Refresh play view
    }
};

function closeGame() {
    selectedGame = null;
    gameIframe.src = '';
    
    // Reset loading state
    if (loadingOverlay) {
        loadingOverlay.classList.add('opacity-0', 'invisible');
        loadingOverlay.classList.remove('opacity-100', 'visible');
    }
    if (loadingBar) loadingBar.style.width = '0%';

    document.getElementById('grid-view').classList.remove('hidden');
    gamePlay.classList.add('hidden');
    mainContainer.classList.remove('max-w-none', 'px-0', 'sm:px-4');
    mainContainer.classList.add('max-w-7xl');
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
    lucide.createIcons();
});

// Comment System Functions
async function fetchComments(gameId) {
    try {
        const response = await fetch(`/api/comments/${gameId}`);
        const comments = await response.json();
        renderComments(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
    }
}

function renderComments(comments) {
    commentsList.innerHTML = '';
    commentCount.textContent = `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`;

    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="text-center py-12 bg-white/5 rounded-3xl border border-white/10">
                <div class="inline-block p-3 bg-white/5 rounded-full mb-3">
                    <i data-lucide="message-square" class="w-6 h-6 text-white/20"></i>
                </div>
                <p class="text-white/40">No comments yet. Be the first to share your thoughts!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // Sort by date descending
    comments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    comments.forEach(comment => {
        const date = new Date(comment.date).toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const commentEl = document.createElement('div');
        commentEl.className = 'bg-white/5 border border-white/10 rounded-3xl p-6 transition-all hover:bg-white/[0.07]';
        commentEl.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        ${comment.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 class="font-bold">${comment.author}</h4>
                        <p class="text-[10px] text-white/40 uppercase tracking-widest font-bold">${date}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                    <i data-lucide="star" class="w-3 h-3 text-primary fill-primary"></i>
                    <span class="text-xs font-bold">${comment.rating}</span>
                </div>
            </div>
            <p class="text-white/70 leading-relaxed">${comment.text}</p>
        `;
        commentsList.appendChild(commentEl);
    });
    
    lucide.createIcons();
}

function renderCommentStars(rating) {
    commentStars.innerHTML = '';
    commentRatingVal.value = rating;
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('button');
        star.type = 'button';
        star.onclick = () => renderCommentStars(i);
        star.className = `p-1 transition-all ${i <= rating ? 'text-primary' : 'text-white/20 hover:text-white/40'}`;
        star.innerHTML = `<i data-lucide="star" class="w-6 h-6 ${i <= rating ? 'fill-current' : ''}"></i>`;
        commentStars.appendChild(star);
    }
    lucide.createIcons();
}

async function postComment(e) {
    e.preventDefault();
    if (!selectedGame) return;

    const author = document.getElementById('comment-author').value;
    const text = document.getElementById('comment-text').value;
    const rating = parseInt(commentRatingVal.value);

    const submitBtn = commentForm.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>Posting...</span>';
    lucide.createIcons();

    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId: selectedGame.id,
                author,
                text,
                rating
            })
        });

        if (response.ok) {
            document.getElementById('comment-text').value = '';
            // Don't clear name for convenience
            await fetchComments(selectedGame.id);
        }
    } catch (error) {
        console.error('Error posting comment:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
        lucide.createIcons();
    }
}

// Modal Logic
requestGameBtn.addEventListener('click', () => {
    requestModal.classList.remove('hidden');
    requestForm.classList.remove('hidden');
    requestSuccess.classList.add('hidden');
    lucide.createIcons();
});

closeRequestModal.addEventListener('click', () => {
    requestModal.classList.add('hidden');
});

requestModal.addEventListener('click', (e) => {
    if (e.target === requestModal) requestModal.classList.add('hidden');
});

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
    lucide.createIcons();
});

resetRequest.addEventListener('click', () => {
    requestForm.reset();
    requestForm.classList.remove('hidden');
    requestSuccess.classList.add('hidden');
    lucide.createIcons();
});

randomGameBtn.addEventListener('click', () => {
    const randomGame = games[Math.floor(Math.random() * games.length)];
    openGame(randomGame);
});

saveScoreBtn.addEventListener('click', () => {
    if (selectedGame) {
        const score = personalScoreInput.value.trim();
        if (score) {
            personalScores[selectedGame.id] = score;
            localStorage.setItem('crazyhunter_scores', JSON.stringify(personalScores));
            savedScoreDisplay.innerHTML = `Current Best: <span class="text-white font-bold">${score}</span>`;
            savedScoreDisplay.classList.remove('hidden');
            
            // Visual feedback
            saveScoreBtn.classList.add('bg-green-500');
            setTimeout(() => saveScoreBtn.classList.remove('bg-green-500'), 1000);
        }
    }
});

commentForm.addEventListener('submit', postComment);

searchInput.addEventListener('input', handleSearch);
backButton.addEventListener('click', closeGame);
closeButton.addEventListener('click', closeGame);
fullscreenButton.addEventListener('click', toggleFullscreen);

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

function applyTheme(themeName) {
    const theme = themes[themeName];
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--primary-color-dark', theme.dark);
    
    const dot = document.getElementById('current-theme-dot');
    if (dot) dot.style.backgroundColor = theme.primary;
    
    renderGames();
    renderFavorites();
}

// Initialize
init();
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}
