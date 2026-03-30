import { useState, useEffect } from 'react';
import { Gamepad2, Search, X, Maximize2, ExternalLink, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gamesData from './games.json';

export default function App() {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setGames(gamesData);
  }, []);

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setSelectedGame(null)}
          >
            <div className="p-2 bg-orange-500 rounded-lg group-hover:rotate-12 transition-transform">
              <Gamepad2 className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter">UNBLOCKED<span className="text-orange-500">HUB</span></h1>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden sm:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-white/60 hover:text-white transition-colors">Request Game</button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!selectedGame ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Featured Games</h2>
                <p className="text-white/50">Hand-picked unblocked favorites for you.</p>
              </div>

              {filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredGames.map((game) => (
                    <motion.div
                      key={game.id}
                      layoutId={game.id}
                      onClick={() => setSelectedGame(game)}
                      className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all hover:shadow-2xl hover:shadow-orange-500/10"
                      whileHover={{ y: -4 }}
                    >
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={game.thumbnail}
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1 group-hover:text-orange-500 transition-colors">{game.title}</h3>
                        <p className="text-sm text-white/60 line-clamp-2">{game.description}</p>
                      </div>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-orange-500 p-2 rounded-full shadow-lg">
                          <ExternalLink className="w-4 h-4 text-black" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-block p-4 bg-white/5 rounded-full mb-4">
                    <Search className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-xl font-medium">No games found</h3>
                  <p className="text-white/40">Try searching for something else.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-[calc(100vh-12rem)]'}`}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <button
                  onClick={() => setSelectedGame(null)}
                  className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  Back to Hub
                </button>
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold hidden sm:block">{selectedGame.title}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      title="Toggle Fullscreen"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedGame(null)}
                      className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-white/10 relative group">
                <iframe
                  src={selectedGame.iframeUrl}
                  className="w-full h-full border-none"
                  title={selectedGame.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {!isFullscreen && (
                <div className="mt-6 flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4">About {selectedGame.title}</h3>
                    <p className="text-white/60 leading-relaxed">
                      {selectedGame.description}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-white/60">Arcade</span>
                      <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-white/60">Classic</span>
                      <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-white/60">Unblocked</span>
                    </div>
                  </div>
                  <div className="w-full md:w-72">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <h4 className="font-bold mb-4">Controls</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Move</span>
                          <span className="font-mono bg-white/10 px-2 rounded">WASD / Arrows</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Action</span>
                          <span className="font-mono bg-white/10 px-2 rounded">Space</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Pause</span>
                          <span className="font-mono bg-white/10 px-2 rounded">ESC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500 rounded-md">
              <Gamepad2 className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold tracking-tighter">UNBLOCKEDHUB</span>
          </div>
          <div className="flex gap-8 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">DMCA</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs text-white/20">© 2026 Unblocked Games Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
