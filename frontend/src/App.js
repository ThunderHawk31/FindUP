import React, { useState, useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, MapPin, Star, ShieldCheck, Phone, Heart,
  Clock, ChevronRight, X, Menu, LogOut,
  History, Loader2, Send, Droplets, Zap, Wrench, Paintbrush,
  Sparkles, MessageCircle, RefreshCw
} from "lucide-react";
import { Input } from "./components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./components/ui/dropdown-menu";
import { ScrollArea } from "./components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog";
import ShinyText from "./components/ShinyText";
import { supabase } from "./supabaseClient";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Specialty tag colors
const SPECIALTY_COLORS = {
  'Plombier': 'specialty-tag-blue',
  'Électricien': 'specialty-tag-orange',
  'Menuisier': 'specialty-tag-green',
  'Peintre': 'specialty-tag-purple',
  'Maçon': 'specialty-tag-gold',
  'Chauffagiste': 'specialty-tag-orange',
  'Carreleur': 'specialty-tag-blue',
  'Couvreur': 'specialty-tag-green',
  'Serrurier': 'specialty-tag-purple',
  'Vitrier': 'specialty-tag-blue',
  'default': 'specialty-tag-gold'
};

const getSpecialtyColor = (metier) => SPECIALTY_COLORS[metier] || SPECIALTY_COLORS.default;

// ==================== CONTEXT ====================
const AuthContext = React.createContext(null);

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Axios interceptor: inject stored token into every request
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('supabase_token');
      if (token && !config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });

    checkAuth();

    // Listen for Supabase OAuth state changes (Google login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('supabase_token', session.access_token);
        try {
          const r = await axios.get(`${API}/auth/me`, { withCredentials: true });
          setUser(r.data);
        } catch {
          setUser(null);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase_token');
        setUser(null);
      }
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
    if (response.data.token) {
      localStorage.setItem('supabase_token', response.data.token);
    }
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email, password, name) => {
    await axios.post(`${API}/auth/register`, { email, password, name });
    return login(email, password);
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('supabase_token');
    setUser(null);
  };

  const loginWithGoogle = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== COMPONENTS ====================

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1" data-testid="logo-link">
          <span className="font-serif text-2xl font-semibold text-[#2D2A26]">Find</span>
          <ShinyText 
            text="UP" 
            className="font-serif text-2xl font-semibold"
            color="#D4AF37"
            shineColor="#F3E5AB"
            speed={3}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-4 py-2 rounded-full glass hover:scale-105 transition-transform" data-testid="user-menu-btn">
                  <Avatar className="h-8 w-8 ring-2 ring-[#D4AF37]/30">
                    <AvatarImage src={user.picture} />
                    <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#B5952F] text-white">{user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-[#2D2A26]">{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 glass-strong rounded-2xl border-0">
                <DropdownMenuItem onClick={() => navigate('/favoris')} className="rounded-xl" data-testid="favoris-menu-item">
                  <Heart className="w-4 h-4 mr-2 text-[#D4AF37]" /> Mes favoris
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/historique')} className="rounded-xl" data-testid="historique-menu-item">
                  <History className="w-4 h-4 mr-2 text-[#D4AF37]" /> Historique
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="rounded-xl text-red-500" data-testid="logout-btn">
                  <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <motion.button 
              onClick={() => navigate('/login')} 
              className="btn-liquid-glass"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.98 }}
              data-testid="login-btn"
            >
              Connexion
            </motion.button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-3 rounded-full glass"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-0 right-0 glass-strong p-6"
          >
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-[#E7E5E4]">
                  <Avatar className="h-12 w-12 ring-2 ring-[#D4AF37]/30">
                    <AvatarImage src={user.picture} />
                    <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#B5952F] text-white">{user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-[#2D2A26]">{user.name}</p>
                    <p className="text-sm text-[#6B6560]">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { navigate('/favoris'); setMobileMenuOpen(false); }}
                  className="flex items-center gap-4 w-full p-3 hover:bg-white/50 rounded-2xl transition-colors"
                >
                  <Heart className="w-5 h-5 text-[#D4AF37]" /> Mes favoris
                </button>
                <button 
                  onClick={() => { navigate('/historique'); setMobileMenuOpen(false); }}
                  className="flex items-center gap-4 w-full p-3 hover:bg-white/50 rounded-2xl transition-colors"
                >
                  <History className="w-5 h-5 text-[#D4AF37]" /> Historique
                </button>
                <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-4 w-full p-3 hover:bg-red-50 rounded-2xl transition-colors text-red-500"
                >
                  <LogOut className="w-5 h-5" /> Déconnexion
                </button>
              </div>
            ) : (
              <motion.button 
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="btn-liquid-glass w-full"
                whileTap={{ scale: 0.98 }}
              >
                Connexion
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const CookieBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="cookie-banner"
      data-testid="cookie-banner"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-[#2D2A26]">Nous utilisons des cookies</p>
          <p className="text-sm text-[#6B6560] mt-1">
            Pour améliorer votre expérience et mémoriser vos préférences. Nous respectons votre vie privée.
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={decline} 
            className="btn-liquid-glass-outline"
            data-testid="cookie-decline-btn"
          >
            Refuser
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={accept} 
            className="btn-liquid-glass"
            data-testid="cookie-accept-btn"
          >
            Accepter
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B5952F] flex items-center justify-center shadow-md flex-shrink-0">
      <Sparkles className="w-4 h-4 text-white" />
    </div>
    <div className="chat-bubble-ai inline-block">
      <div className="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
);

const ChatBubble = ({ msg, index }) => (
  <motion.div
    key={index}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: 0.05 }}
    className={`flex ${msg.type === 'user' ? 'justify-end' : 'items-start gap-3'}`}
  >
    {msg.type === 'ai' && (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B5952F] flex items-center justify-center shadow-md flex-shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
    )}
    <div className={msg.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
      {msg.image && (
        <img src={msg.image} alt="Photo" className="w-48 h-32 object-cover rounded-xl mb-3 shadow-md" />
      )}
      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
    </div>
  </motion.div>
);

const QuickReplies = ({ suggestions = [], onSelect, onGeolocate, needsLocation, onCustomOpen }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-wrap gap-3 justify-center mt-4 mb-2"
  >
    {suggestions.map((s, i) => (
      <button key={i} className="quick-reply-chip" onClick={() => onSelect(s)}>
        {s}
      </button>
    ))}
    {needsLocation && (
      <button className="quick-reply-chip quick-reply-highlight" onClick={onGeolocate}>
        📍 Me géolocaliser
      </button>
    )}
    <button className="quick-reply-chip" onClick={onCustomOpen}>
      ✏️ Autre réponse...
    </button>
  </motion.div>
);

const ArtisanCard = ({ artisan, onFavorite, isFavorite, onClick }) => (
  <motion.div 
    className="card-artisan cursor-pointer"
    onClick={onClick}
    whileHover={{ y: -6, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    data-testid={`artisan-card-${artisan.artisan_id}`}
  >
    <div className="flex gap-5">
      <Avatar className="h-20 w-20 rounded-2xl ring-2 ring-white shadow-lg">
        <AvatarImage src={artisan.photo_url} className="object-cover" />
        <AvatarFallback className="bg-gradient-to-br from-[#E8E4DD] to-[#D4CFC5] text-[#6B6560] text-2xl rounded-2xl">
          {artisan.nom?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-semibold text-lg text-[#2D2A26]">{artisan.entreprise}</h3>
            <p className="text-[#6B6560]">{artisan.nom}</p>
          </div>
          {artisan.is_verified && (
            <span className="badge-verified whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5" /> Vérifié
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-1.5 text-[#D4AF37]">
            <Star className="w-5 h-5 fill-current" />
            <span className="font-semibold text-base">{artisan.note_moyenne || '—'}</span>
            <span className="text-[#6B6560]">({artisan.nombre_avis})</span>
          </div>
          {artisan.distance_km && (
            <div className="flex items-center gap-1.5 text-[#6B6560]">
              <MapPin className="w-4 h-4" />
              <span>{artisan.distance_km} km</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {artisan.metiers?.slice(0, 3).map(metier => (
            <span key={metier} className={`specialty-tag ${getSpecialtyColor(metier)}`}>
              {metier}
            </span>
          ))}
        </div>
      </div>
    </div>

    <div className="flex gap-3 mt-6 pt-5 border-t border-[#E8E4DD]">
      <motion.button 
        className="flex-1 btn-liquid-glass flex items-center justify-center gap-2"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${artisan.telephone}`; }}
        data-testid={`call-btn-${artisan.artisan_id}`}
      >
        <Phone className="w-5 h-5" /> Appeler
      </motion.button>
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`p-3 rounded-full glass ${isFavorite ? 'text-red-500' : 'text-[#6B6560]'}`}
        onClick={(e) => { e.stopPropagation(); onFavorite && onFavorite(artisan.artisan_id); }}
        data-testid={`favorite-btn-${artisan.artisan_id}`}
      >
        <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
      </motion.button>
    </div>
  </motion.div>
);

// ==================== PAGES ====================

const NANTES_CITIES = {
  'nantes': { lat: 47.2184, lng: -1.5536, name: 'Nantes' },
  'reze': { lat: 47.1856, lng: -1.5512, name: 'Rezé' },
  'saint-herblain': { lat: 47.2117, lng: -1.6194, name: 'Saint-Herblain' },
  'orvault': { lat: 47.2711, lng: -1.6250, name: 'Orvault' },
  'vertou': { lat: 47.1692, lng: -1.4700, name: 'Vertou' },
};

const EXAMPLE_PROBLEMS = [
  { icon: <Droplets className="w-4 h-4" />, text: "J'ai une fuite sous l'évier" },
  { icon: <Zap className="w-4 h-4" />, text: "Prise électrique en panne" },
  { icon: <Paintbrush className="w-4 h-4" />, text: "Besoin de repeindre mon salon" },
];

const HomePage = () => {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [location, setLocation] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const conversationHistory = useRef([]); // Full history sent to AI each turn
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Format non supporté. Utilisez JPG, PNG ou WEBP.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
        setImageBase64(reader.result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const doSearch = async (metiers, tags, urgence) => {
    if (!location) return;
    try {
      const searchResponse = await axios.post(`${API}/artisans/search`, {
        metiers,
        tags,
        latitude: location.latitude,
        longitude: location.longitude,
        rayon_km: 15,
        urgence: urgence || false
      });
      setSearchResults({ artisans: searchResponse.data, metiers, tags });
    } catch (error) {
      toast.error('Erreur lors de la recherche');
      console.error(error);
    }
  };

  const sendMessage = async (overrideText) => {
    const text = overrideText !== undefined ? overrideText : message;
    if (!text.trim() && !imageBase64) return;

    const userMsg = { type: 'user', content: text, image: imagePreview };
    setChatMessages(prev => [...prev, userMsg]);
    setMessage('');
    setCustomInput('');
    setShowCustomInput(false);
    setCurrentSuggestions([]);
    setNeedsLocation(false);
    setIsTyping(true);

    // Update conversation history
    conversationHistory.current = [
      ...conversationHistory.current,
      { role: 'user', content: text }
    ];

    try {
      const response = await axios.post(`${API}/chat/send`, {
        message: text,
        image_base64: imageBase64,
        conversation_history: conversationHistory.current.slice(0, -1), // history before this message
        location: location
      }, { withCredentials: true });

      const data = response.data;
      const aiText = data.message || data.response || '';

      setChatMessages(prev => [...prev, { type: 'ai', content: aiText }]);

      // Update conversation history with AI response
      conversationHistory.current = [
        ...conversationHistory.current,
        { role: 'assistant', content: aiText }
      ];

      // Update UI state from structured response
      setCurrentSuggestions(data.suggestions || []);
      setNeedsLocation(!!data.needs_location);

      // Auto-search when ready
      if (data.ready_to_search && location && data.metiers) {
        await doSearch(data.metiers, data.tags || [], data.urgence || false);
      }

      removeImage();
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setLocation(loc);
          setNeedsLocation(false);
          toast.success('Position détectée !');
          sendMessage('📍 Ma position a été détectée automatiquement');
        },
        () => {
          toast.info('Géolocalisation non disponible');
          setShowLocationInput(true);
        }
      );
    } else {
      setShowLocationInput(true);
    }
  };

  const handleCitySubmit = () => {
    if (!cityInput.trim()) return;
    const cityKey = cityInput.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    const city = NANTES_CITIES[cityKey] || NANTES_CITIES['nantes'];
    const loc = { latitude: city.lat, longitude: city.lng };
    setLocation(loc);
    setShowLocationInput(false);
    setCityInput('');
    setNeedsLocation(false);
    toast.success(`Position définie : ${city.name}`);
    sendMessage(`📍 Je suis à ${city.name}`);
  };

  const resetChat = () => {
    setChatMessages([]);
    setMessage('');
    setLocation(null);
    setSearchResults(null);
    setCurrentSuggestions([]);
    setNeedsLocation(false);
    setShowLocationInput(false);
    setCustomInput('');
    setShowCustomInput(false);
    conversationHistory.current = [];
    removeImage();
  };

  if (searchResults) {
    return <ResultsPage
      results={searchResults}
      location={location}
      onBack={resetChat}
    />;
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">

        {/* Hero Section */}
        {chatMessages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B5952F] flex items-center justify-center shadow-lg">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold text-[#2D2A26] mb-5 leading-tight">
              Décrivez votre problème,<br />
              <ShinyText
                text="on s'occupe du reste."
                className="font-serif text-4xl md:text-5xl font-semibold"
                color="#D4AF37"
                shineColor="#F3E5AB"
                speed={2.5}
              />
            </h1>
            <p className="text-lg text-[#6B6560] max-w-md mx-auto leading-relaxed">
              Notre assistant IA identifie le bon artisan et vous met en relation avec les meilleurs professionnels près de chez vous.
            </p>
          </motion.div>
        )}

        {/* Chat Messages */}
        {chatMessages.length > 0 && (
          <ScrollArea className="h-[45vh] mb-4 pr-2">
            <div className="space-y-5">
              {chatMessages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} index={i} />
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <TypingIndicator />
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Quick Replies */}
        {!isTyping && currentSuggestions.length > 0 && (
          <QuickReplies
            suggestions={currentSuggestions}
            onSelect={sendMessage}
            onGeolocate={handleGeolocate}
            needsLocation={needsLocation}
            onCustomOpen={() => setShowCustomInput(true)}
          />
        )}

        {/* Location Input Card */}
        {(showLocationInput || (needsLocation && chatMessages.length > 0 && !currentSuggestions.length)) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-5 glass-card rounded-3xl"
          >
            <p className="text-[#6B6560] mb-3 font-medium">Entrez votre ville (région Nantes) :</p>
            <div className="flex gap-3">
              <Input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCitySubmit()}
                placeholder="Ex: Nantes, Rezé, Orvault..."
                className="flex-1 h-12 rounded-xl border-[#E8E4DD] focus:ring-[#D4AF37]"
                data-testid="city-input"
              />
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCitySubmit}
                className="btn-liquid-glass px-6"
                data-testid="city-submit-btn"
              >
                OK
              </motion.button>
            </div>
            <button
              onClick={() => {
                const loc = { latitude: 47.2184, longitude: -1.5536 };
                setLocation(loc);
                setShowLocationInput(false);
                setNeedsLocation(false);
                toast.success('Position définie : Nantes');
                sendMessage('📍 Je suis à Nantes');
              }}
              className="text-sm text-[#D4AF37] hover:text-[#B5952F] font-medium mt-3 transition-colors"
              data-testid="use-nantes-btn"
            >
              Utiliser Nantes centre
            </button>
          </motion.div>
        )}

        {/* Custom text input for "Autre réponse" */}
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 glass-card rounded-2xl"
          >
            <div className="flex gap-3">
              <Input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(customInput)}
                placeholder="Votre réponse..."
                className="flex-1 h-11 rounded-xl border-[#E8E4DD] focus:ring-[#D4AF37]"
                autoFocus
              />
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendMessage(customInput)}
                className="btn-liquid-glass px-5"
              >
                Envoyer
              </motion.button>
              <button
                onClick={() => setShowCustomInput(false)}
                className="p-2 text-[#6B6560] hover:text-[#D4AF37] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
          data-testid="chat-input-section"
        >
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-20 left-4"
            >
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl shadow-lg" />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                  data-testid="remove-image-btn"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}

          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Décrivez votre problème..."
                className="input-hero"
                data-testid="chat-input"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="image-upload-input"
                />
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-camera"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="camera-btn"
                >
                  <Camera className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="btn-liquid-glass h-[60px] w-[60px] !p-0 flex items-center justify-center !rounded-2xl"
              onClick={() => sendMessage()}
              disabled={!message.trim() && !imageBase64}
              data-testid="send-btn"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Nouvelle recherche button */}
          {chatMessages.length > 0 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={resetChat}
                className="flex items-center gap-2 text-sm text-[#6B6560] hover:text-[#D4AF37] transition-colors"
                data-testid="reset-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Nouvelle recherche
              </button>
            </div>
          )}
        </motion.div>

        {/* Example Problems */}
        {chatMessages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-center"
          >
            <p className="text-sm text-[#6B6560] mb-4">Exemples de problèmes :</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {EXAMPLE_PROBLEMS.map(({ icon, text }) => (
                <motion.button
                  key={text}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendMessage(text)}
                  className="quick-reply-chip"
                  data-testid="example-btn"
                >
                  {icon} {text}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const ResultsPage = ({ results, location, onBack }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (user) loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favoris`, { withCredentials: true });
      setFavorites(response.data.map(a => a.artisan_id));
    } catch {}
  };

  const toggleFavorite = async (artisanId) => {
    if (!user) {
      toast.info('Connectez-vous pour sauvegarder vos favoris');
      navigate('/login');
      return;
    }

    try {
      if (favorites.includes(artisanId)) {
        await axios.delete(`${API}/favoris/${artisanId}`, { withCredentials: true });
        setFavorites(prev => prev.filter(id => id !== artisanId));
        toast.success('Retiré des favoris');
      } else {
        await axios.post(`${API}/favoris`, { artisan_id: artisanId }, { withCredentials: true });
        setFavorites(prev => [...prev, artisanId]);
        toast.success('Ajouté aux favoris');
      }
    } catch {
      toast.error('Erreur');
    }
  };

  const recordHistory = async (artisanId, action) => {
    try {
      await axios.post(`${API}/historique`, { artisan_id: artisanId, action }, { withCredentials: true });
    } catch {}
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <button 
              onClick={onBack}
              className="flex items-center text-[#6B6560] hover:text-[#D4AF37] mb-3 transition-colors"
              data-testid="back-btn"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Nouvelle recherche
            </button>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2A26]">
              {results.artisans.length} artisan{results.artisans.length > 1 ? 's' : ''} trouvé{results.artisans.length > 1 ? 's' : ''}
            </h1>
            <p className="text-[#6B6560] mt-2 text-lg">
              {results.metiers?.join(', ')} près de chez vous
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="md:hidden btn-liquid-glass-outline flex items-center gap-2"
            onClick={() => setShowMap(!showMap)}
            data-testid="toggle-map-btn"
          >
            <MapPin className="w-4 h-4" /> {showMap ? 'Liste' : 'Carte'}
          </motion.button>
        </motion.div>

        {/* Content */}
        <div className="grid md:grid-cols-5 gap-8">
          {/* Artisans List */}
          <div className={`md:col-span-3 space-y-6 ${showMap ? 'hidden md:block' : ''}`}>
            {/* Partner Banner - BIGGER */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="partner-banner"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B5952F] flex items-center justify-center shadow-lg">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#2D2A26] text-lg">Besoin de matériaux ?</p>
                  <p className="text-[#D4AF37] font-bold text-xl">-10% chez notre partenaire</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-liquid-glass-outline"
                >
                  Voir l'offre
                </motion.button>
              </div>
            </motion.div>

            {results.artisans.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-3xl">
                <p className="text-[#6B6560] text-lg">Aucun artisan trouvé dans votre zone.</p>
                <p className="text-sm text-[#6B6560] mt-2">Essayez d'élargir votre recherche.</p>
              </div>
            ) : (
              results.artisans.map((artisan, index) => (
                <motion.div
                  key={artisan.artisan_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ArtisanCard
                    artisan={artisan}
                    isFavorite={favorites.includes(artisan.artisan_id)}
                    onFavorite={toggleFavorite}
                    onClick={() => {
                      setSelectedArtisan(artisan);
                      recordHistory(artisan.artisan_id, 'vu');
                    }}
                  />
                </motion.div>
              ))
            )}
          </div>

          {/* Map */}
          <div className={`md:col-span-2 ${!showMap ? 'hidden md:block' : ''}`}>
            <div className="sticky top-24">
              <MapComponent 
                artisans={results.artisans} 
                userLocation={location}
                onArtisanClick={(artisan) => {
                  setSelectedArtisan(artisan);
                  recordHistory(artisan.artisan_id, 'vu');
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Artisan Detail Dialog */}
      <ArtisanDetailDialog 
        artisan={selectedArtisan}
        isOpen={!!selectedArtisan}
        onClose={() => setSelectedArtisan(null)}
        isFavorite={selectedArtisan ? favorites.includes(selectedArtisan.artisan_id) : false}
        onFavorite={toggleFavorite}
        onCall={(artisanId) => recordHistory(artisanId, 'appele')}
      />
    </div>
  );
};

const MapComponent = ({ artisans, userLocation, onArtisanClick }) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapRef.current._leaflet_id) return;

    const L = window.L;
    const center = userLocation 
      ? [userLocation.latitude, userLocation.longitude]
      : [47.2184, -1.5536];

    const map = L.map(mapRef.current, { center, zoom: 12, zoomControl: false });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19
    }).addTo(map);

    const goldIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="width: 36px; height: 36px; background: linear-gradient(145deg, #D4AF37, #B5952F); border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(212,175,55,0.4); display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    const verifiedIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="width: 42px; height: 42px; background: linear-gradient(145deg, #D4AF37, #E8CD6A); border-radius: 50%; border: 4px solid white; box-shadow: 0 6px 16px rgba(212,175,55,0.5); display: flex; align-items: center; justify-content: center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      </div>`,
      iconSize: [42, 42],
      iconAnchor: [21, 42]
    });

    artisans.forEach(artisan => {
      const marker = L.marker(
        [artisan.latitude, artisan.longitude],
        { icon: artisan.is_verified ? verifiedIcon : goldIcon }
      ).addTo(map);

      marker.bindPopup(`
        <div style="text-align: center; padding: 8px; font-family: 'Manrope', sans-serif;">
          <strong style="font-size: 14px; color: #2D2A26;">${artisan.entreprise}</strong><br/>
          <span style="color: #6B6560; font-size: 12px;">${artisan.metiers?.[0] || ''}</span><br/>
          ${artisan.is_verified ? '<span style="color: #D4AF37; font-size: 11px; font-weight: 600;">✓ Vérifié</span>' : ''}
        </div>
      `);

      marker.on('click', () => onArtisanClick && onArtisanClick(artisan));
    });

    if (userLocation) {
      L.circleMarker([userLocation.latitude, userLocation.longitude], {
        radius: 10,
        fillColor: '#4A90D9',
        color: 'white',
        weight: 3,
        fillOpacity: 1
      }).addTo(map).bindPopup('Vous êtes ici');
    }

    return () => map.remove();
  }, [mapLoaded, artisans, userLocation, onArtisanClick]);

  return (
    <div 
      ref={mapRef} 
      className="map-container h-[350px] md:h-[calc(100vh-220px)] w-full"
      data-testid="map-container"
    />
  );
};

const ArtisanDetailDialog = ({ artisan, isOpen, onClose, isFavorite, onFavorite, onCall }) => {
  const [avis, setAvis] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (artisan) loadAvis();
  }, [artisan]);

  const loadAvis = async () => {
    if (!artisan) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/artisans/${artisan.artisan_id}/avis`);
      setAvis(response.data);
    } catch {} 
    finally { setLoading(false); }
  };

  if (!artisan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto glass-strong !rounded-3xl border-0" data-testid="artisan-detail-dialog">
        <DialogHeader>
          <div className="flex items-start gap-5">
            <Avatar className="h-24 w-24 rounded-2xl ring-2 ring-white shadow-xl">
              <AvatarImage src={artisan.photo_url} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-[#E8E4DD] to-[#D4CFC5] text-3xl rounded-2xl">{artisan.nom?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="font-serif text-2xl text-[#2D2A26]">{artisan.entreprise}</DialogTitle>
              <p className="text-[#6B6560] text-lg mt-1">{artisan.nom}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-[#D4AF37]">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-semibold text-lg">{artisan.note_moyenne || '—'}</span>
                </div>
                {artisan.is_verified && (
                  <span className="badge-verified">
                    <ShieldCheck className="w-3.5 h-3.5" /> Vérifié FindUP
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          {/* Description */}
          {artisan.description && (
            <div>
              <h4 className="font-semibold text-[#2D2A26] text-lg mb-3">À propos</h4>
              <p className="text-[#6B6560] leading-relaxed">{artisan.description}</p>
            </div>
          )}

          {/* Tags - Colorful */}
          <div>
            <h4 className="font-semibold text-[#2D2A26] text-lg mb-4">Spécialités</h4>
            <div className="flex flex-wrap gap-3">
              {artisan.tags?.map(tag => (
                <span key={tag} className={`specialty-tag ${getSpecialtyColor(artisan.metiers?.[0])}`}>
                  {tag === 'FuiteEau' && <Droplets className="w-4 h-4" />}
                  {tag === 'InstallationÉlectrique' && <Zap className="w-4 h-4" />}
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Horaires */}
          {artisan.horaires && (
            <div>
              <h4 className="font-semibold text-[#2D2A26] text-lg mb-3">Horaires</h4>
              <p className="text-[#6B6560] flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#D4AF37]" /> {artisan.horaires}
              </p>
            </div>
          )}

          {/* Urgence */}
          {artisan.urgent_disponible && (
            <div className="availability-badge">
              <Clock className="w-5 h-5" />
              Disponible pour les urgences
            </div>
          )}

          {/* Avis */}
          <div>
            <h4 className="font-semibold text-[#2D2A26] text-lg mb-4">Avis clients ({avis.length})</h4>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
              </div>
            ) : avis.length === 0 ? (
              <p className="text-[#6B6560]">Pas encore d'avis</p>
            ) : (
              <div className="space-y-4">
                {avis.map(a => (
                  <div key={a.avis_id} className="glass-card rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-[#2D2A26]">{a.auteur}</span>
                      <div className="flex items-center gap-1 text-[#D4AF37]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < a.note ? 'fill-current' : 'text-[#E8E4DD]'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#6B6560] leading-relaxed">{a.commentaire}</p>
                    <p className="text-[#6B6560]/60 text-sm mt-3">{a.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-[#E8E4DD]">
            <motion.button 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 btn-liquid-glass flex items-center justify-center gap-2"
              onClick={() => {
                window.location.href = `tel:${artisan.telephone}`;
                onCall && onCall(artisan.artisan_id);
              }}
              data-testid="dialog-call-btn"
            >
              <Phone className="w-5 h-5" /> {artisan.telephone}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-4 rounded-2xl glass ${isFavorite ? 'text-red-500' : 'text-[#6B6560]'}`}
              onClick={() => onFavorite && onFavorite(artisan.artisan_id)}
              data-testid="dialog-favorite-btn"
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LoginPage = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.email, form.password, form.name);
      } else {
        await login(form.email, form.password);
      }
      toast.success(isRegister ? 'Compte créé !' : 'Connecté !');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-semibold text-[#2D2A26]">
            {isRegister ? 'Créer un compte' : 'Connexion'}
          </h1>
          <p className="text-[#6B6560] mt-3 text-lg">
            {isRegister ? 'Rejoignez FindUP' : 'Retrouvez vos favoris et historique'}
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">Nom</label>
                <Input 
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="Votre nom"
                  required={isRegister}
                  className="h-12 rounded-xl border-[#E8E4DD] focus:ring-[#D4AF37]"
                  data-testid="name-input"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-2">Email</label>
              <Input 
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                placeholder="votre@email.com"
                required
                className="h-12 rounded-xl border-[#E8E4DD] focus:ring-[#D4AF37]"
                data-testid="email-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-2">Mot de passe</label>
              <Input 
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                placeholder="••••••••"
                required
                className="h-12 rounded-xl border-[#E8E4DD] focus:ring-[#D4AF37]"
                data-testid="password-input"
              />
            </div>
            <motion.button 
              type="submit" 
              className="w-full btn-liquid-glass h-14"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid="submit-btn"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegister ? 'Créer mon compte' : 'Se connecter')}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#E8E4DD]" />
            <span className="text-sm text-[#6B6560]">ou</span>
            <div className="flex-1 h-px bg-[#E8E4DD]" />
          </div>

          {/* Google OAuth */}
          <motion.button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl border-2 border-[#E8E4DD] bg-white/70 hover:bg-white transition-all font-medium text-[#2D2A26]"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            data-testid="google-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </motion.button>

          <p className="text-center text-[#6B6560] mt-6">
            {isRegister ? 'Déjà inscrit ?' : 'Pas encore de compte ?'}{' '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#D4AF37] font-semibold hover:text-[#B5952F] transition-colors"
              data-testid="toggle-auth-btn"
            >
              {isRegister ? 'Se connecter' : 'Créer un compte'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase JS client exchanges the code from the URL automatically
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem('supabase_token', session.access_token);
        await checkAuth();
        toast.success('Connecté avec Google !');
      }
      navigate('/');
    };
    handleCallback();
  }, [navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
    </div>
  );
};

const FavorisPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favoris, setFavoris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtisan, setSelectedArtisan] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadFavoris();
  }, [user, navigate]);

  const loadFavoris = async () => {
    try {
      const response = await axios.get(`${API}/favoris`, { withCredentials: true });
      setFavoris(response.data);
    } catch {}
    finally { setLoading(false); }
  };

  const removeFavorite = async (artisanId) => {
    try {
      await axios.delete(`${API}/favoris/${artisanId}`, { withCredentials: true });
      setFavoris(prev => prev.filter(a => a.artisan_id !== artisanId));
      toast.success('Retiré des favoris');
    } catch {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-3xl font-semibold text-[#2D2A26] mb-8"
          data-testid="favoris-title"
        >
          Mes favoris
        </motion.h1>

        {favoris.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 glass-card rounded-3xl"
          >
            <Heart className="w-20 h-20 text-[#E8E4DD] mx-auto mb-6" />
            <p className="text-[#6B6560] text-lg">Vous n'avez pas encore de favoris</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-liquid-glass mt-6"
              onClick={() => navigate('/')}
            >
              Trouver un artisan
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {favoris.map((artisan, index) => (
              <motion.div
                key={artisan.artisan_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ArtisanCard
                  artisan={artisan}
                  isFavorite={true}
                  onFavorite={removeFavorite}
                  onClick={() => setSelectedArtisan(artisan)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ArtisanDetailDialog 
        artisan={selectedArtisan}
        isOpen={!!selectedArtisan}
        onClose={() => setSelectedArtisan(null)}
        isFavorite={true}
        onFavorite={removeFavorite}
      />
    </div>
  );
};

const HistoriquePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadHistorique();
  }, [user, navigate]);

  const loadHistorique = async () => {
    try {
      const response = await axios.get(`${API}/historique`, { withCredentials: true });
      setHistorique(response.data);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-3xl font-semibold text-[#2D2A26] mb-8"
          data-testid="historique-title"
        >
          Historique
        </motion.h1>

        {historique.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 glass-card rounded-3xl"
          >
            <History className="w-20 h-20 text-[#E8E4DD] mx-auto mb-6" />
            <p className="text-[#6B6560] text-lg">Aucun historique</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-liquid-glass mt-6"
              onClick={() => navigate('/')}
            >
              Trouver un artisan
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {historique.map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-2xl p-5 flex items-center gap-5"
              >
                <Avatar className="h-14 w-14 rounded-xl ring-2 ring-white shadow-md">
                  <AvatarImage src={item.artisan?.photo_url} />
                  <AvatarFallback className="bg-[#E8E4DD]">{item.artisan?.nom?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2D2A26]">{item.artisan?.entreprise}</p>
                  <p className="text-sm text-[#6B6560]">{item.artisan?.nom}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${item.action === 'appele' ? 'bg-[#E8F5ED] text-[#4CAF7A]' : 'bg-[#F5F5F4] text-[#6B6560]'}`}>
                    {item.action === 'appele' ? 'Appelé' : 'Consulté'}
                  </span>
                  <p className="text-xs text-[#6B6560]/60 mt-2">
                    {new Date(item.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== APP ROUTER ====================

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/favoris" element={<FavorisPage />} />
      <Route path="/historique" element={<HistoriquePage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <Header />
          <AppRouter />
          <CookieBanner />
          <Toaster position="top-center" richColors />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
