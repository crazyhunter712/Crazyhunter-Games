let games = [];
let filteredGames = [];
let selectedGame = null;
let searchQuery = '';
let isFullscreen = false;

const gamesGrid = document.getElementById('games-grid');
const gamePlay = document.getElementById('game-play');
const searchInput = document.getElementById('search-input');
const backButton = document.getElementById('back-button');
const closeButton = document.getElementById('close-button');
const fullscreenButton = document.getElementById('fullscreen-button');
const iframeContainer = document.getElementById('iframe-container');
const gameIframe = document.getElementById('game-iframe');
const gameTitle = document.getElementById('game-title');
const gameDescription = document.getElementById('game-description');
const aboutTitle = document.getElementById('about-title');
const aboutDescription = document.getElementById('about-description');

const mainContainer = document.getElementById('main-container');

async function init() {
    try {
        const response = await fetch('./src/games.json');
        games = await response.json();
        filteredGames = [...games];
        renderGames();
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

function renderGames() {
    gamesGrid.innerHTML = '';
    
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
        lucide.createIcons();
        return;
    }

    filteredGames.forEach(game => {
        const card = document.createElement('div');
        card.className = 'group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all hover:shadow-2xl hover:shadow-orange-500/10 transform hover:-translate-y-1';
        card.innerHTML = `
            <div class="aspect-video overflow-hidden">
                <img
                    src="${game.thumbnail}"
                    alt="${game.title}"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerpolicy="no-referrer"
                />
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 group-hover:text-orange-500 transition-colors">${game.title}</h3>
                <p class="text-sm text-white/60 line-clamp-2">${game.description}</p>
            </div>
            <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="bg-orange-500 p-2 rounded-full shadow-lg">
                    <i data-lucide="external-link" class="w-4 h-4 text-black"></i>
                </div>
            </div>
        `;
        card.onclick = () => openGame(game);
        gamesGrid.appendChild(card);
    });
    
    lucide.createIcons();
}

function openGame(game) {
    selectedGame = game;
    gameIframe.src = game.iframeUrl;
    gameTitle.textContent = game.title;
    aboutTitle.textContent = `About ${game.title}`;
    aboutDescription.textContent = game.description;
    
    document.getElementById('grid-view').classList.add('hidden');
    gamePlay.classList.remove('hidden');
    mainContainer.classList.remove('max-w-7xl');
    mainContainer.classList.add('max-w-screen-2xl');
    window.scrollTo(0, 0);
}

function closeGame() {
    selectedGame = null;
    gameIframe.src = '';
    document.getElementById('grid-view').classList.remove('hidden');
    gamePlay.classList.add('hidden');
    mainContainer.classList.remove('max-w-screen-2xl');
    mainContainer.classList.add('max-w-7xl');
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
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
        iframeContainer.classList.add('fixed', 'inset-0', 'z-50', 'bg-black', 'rounded-none');
        iframeContainer.classList.remove('aspect-video', 'rounded-3xl', 'max-w-7xl', 'mx-auto');
        fullscreenButton.innerHTML = '<i data-lucide="minimize-2" class="w-5 h-5"></i>';
    } else {
        iframeContainer.classList.remove('fixed', 'inset-0', 'z-50', 'bg-black', 'rounded-none');
        iframeContainer.classList.add('aspect-video', 'rounded-3xl');
        fullscreenButton.innerHTML = '<i data-lucide="maximize-2" class="w-5 h-5"></i>';
    }
    lucide.createIcons();
}

searchInput.addEventListener('input', handleSearch);
backButton.addEventListener('click', closeGame);
closeButton.addEventListener('click', closeGame);
fullscreenButton.addEventListener('click', toggleFullscreen);

// Initialize
init();
lucide.createIcons();
