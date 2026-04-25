import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import {
  Calendar, CheckCircle, BarChart2, Zap, BookOpen, Moon, Sun,
  ArrowRight, Sparkles, ShieldCheck, Clock, Target, Heart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import animationData from '../assets/Female Employee Working on Data Security.json';

const DAILY_VERSE = [
  { text: "Je puis tout par celui qui me fortifie.", ref: "Philippiens 4:13" },
  { text: "Confie-toi en l'Éternel de tout ton cœur.", ref: "Proverbes 3:5" },
  { text: "Car je connais les projets que j'ai formés sur vous.", ref: "Jérémie 29:11" },
  { text: "Ceux qui se confient en l'Éternel renouvellent leur force.", ref: "Ésaïe 40:31" },
  { text: "Ne te laisse pas vaincre par le mal.", ref: "Romains 12:21" },
  { text: "L'Éternel est ma lumière et mon salut.", ref: "Psaumes 27:1" },
  { text: "Tout ce que tu feras, fais-le de tout ton cœur.", ref: "Colossiens 3:23" },
];

const ENCOURAGEMENTS = [
  "Chaque effort compte. Tu construis quelque chose de grand. 🏗️",
  "La discipline d'aujourd'hui est la liberté de demain.",
  "Tu t'es levé tôt alors que le monde dormait. Cette discipline est ta force.",
  "Les grandes réalisations commencent par la décision d'essayer.",
  "Le succès, c'est la somme de petits efforts répétés chaque jour.",
  "Ne regarde pas combien de chemin il reste — regarde combien tu as parcouru.",
  "Chaque jour accompli te rapproche de la meilleure version de toi-même.",
];

const FEATURES = [
  {
    icon: Calendar,
    title: "Planning hebdomadaire intelligent",
    desc: "L'algo analyse tes contraintes réelles (cours, transport, sommeil) et planifie automatiquement tes activités.",
    color: "#22c55e"
  },
  {
    icon: Zap,
    title: "Priorités & énergie",
    desc: "Les tâches importantes arrivent quand tu as le plus d'énergie. Rien n'est laissé au hasard.",
    color: "#eab308"
  },
  {
    icon: CheckCircle,
    title: "Suivi quotidien",
    desc: "Coche tes activités au fil de la journée. Vois ta progression en temps réel.",
    color: "#10b981"
  },
  {
    icon: BarChart2,
    title: "Statistiques & insights",
    desc: "Ton meilleur jour, ton score de productivité, l'évolution semaine après semaine.",
    color: "#3b82f6"
  },
  {
    icon: BookOpen,
    title: "Réflexion hebdomadaire",
    desc: "Analyse ce qui t'a freiné, célèbre tes victoires, fixe ton cap pour la semaine suivante.",
    color: "#8b5cf6"
  },
  {
    icon: Sparkles,
    title: "Motivation quotidienne",
    desc: "Un verset biblique et un message d'encouragement chaque matin pour bien démarrer.",
    color: "#f43f5e"
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verse, setVerse] = useState(null);
  const [encouragement, setEncouragement] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) { navigate('/dashboard'); return; }
    const day = new Date().getDay();
    setVerse(DAILY_VERSE[day % DAILY_VERSE.length]);
    setEncouragement(ENCOURAGEMENTS[day % ENCOURAGEMENTS.length]);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, navigate]);

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isMobile = windowWidth < 768;
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflowX: 'hidden'
    }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', 
        top: 0, 
        left: 0,
        right: 0,
        zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(34,197,94,0.1)' : '1px solid #e2e8f0',
        padding: isMobile ? '0 12px' : '0 5%',
        height: isMobile ? 56 : 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.05)' : 'none'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? 8 : 12,
          cursor: 'pointer'
        }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img
            src={logo}
            alt="DayFlow"
            style={{
              width: isMobile ? 32 : 40,
              height: isMobile ? 32 : 40,
              objectFit: 'contain',
              borderRadius: 10,
            }}
          />
          {!isMobile && (
            <span style={{ 
              fontSize: 20, 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #166534, #22c55e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>DayFlow</span>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'all 0.2s',
              color: '#0f172a',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {mobileMenuOpen ? (
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        )}
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button
              onClick={scrollToFeatures}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 20,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f0fdf4';
                e.currentTarget.style.color = '#166534';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#475569';
              }}
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 24px',
                borderRadius: 40,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Se connecter
              <ArrowRight size={16} strokeWidth={3} />
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 56,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 39,
            }}
            onClick={closeMobileMenu}
          />
          <div style={{
            position: 'fixed',
            top: 56,
            left: 0,
            right: 0,
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '12px',
          }}>
            <button
              onClick={() => { scrollToFeatures(); closeMobileMenu(); }}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                padding: '12px 16px',
                borderRadius: 8,
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f0fdf4';
                e.currentTarget.style.color = '#166534';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#475569';
              }}
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => { navigate('/login'); closeMobileMenu(); }}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                width: '100%',
              }}
            >
              Se connecter
              <ArrowRight size={16} strokeWidth={3} />
            </button>
          </div>
        </>
      )}

      {/* Hero Section */}
      <section style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '100px 12px 60px' : '140px 5% 80px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? 40 : 60,
        alignItems: 'center',
        minHeight: isMobile ? 'auto' : '90vh'
      }}>
        {/* Left side */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 40,
            padding: '8px 16px',
            marginBottom: isMobile ? 20 : 32,
            animation: 'slideInLeft 0.6s ease-out',
            fontSize: isMobile ? 11 : 13,
          }}>
            <Sparkles size={isMobile ? 14 : 16} color="#22c55e" />
            <span style={{ fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>
              {isMobile ? 'Planning intelligent' : 'Planification intelligente pour étudiants'}
            </span>
          </div>

          <h1 style={{
            fontSize: isMobile ? 32 : 'clamp(40px, 5vw, 64px)',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.2,
            marginBottom: isMobile ? 16 : 24,
            animation: 'slideInLeft 0.6s ease-out 0.1s both'
          }}>
            Transforme ton quotidien
            {!isMobile && <br />}
            <span style={{ 
              background: 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {isMobile ? ' en journées accomplies' : 'en journées accomplies'}
            </span>
          </h1>

          <p style={{
            fontSize: isMobile ? 14 : 18,
            color: '#475569',
            lineHeight: 1.6,
            marginBottom: isMobile ? 24 : 40,
            animation: 'slideInLeft 0.6s ease-out 0.2s both'
          }}>
            {isMobile 
              ? 'DayFlow génère un planning adapté à tes cours, transport et sommeil.'
              : 'DayFlow analyse tes contraintes réelles — cours, transport, sommeil — et génère automatiquement un planning hebdomadaire adapté à ta vie.'
            }
          </p>

          <div style={{ 
            display: 'flex', 
            gap: isMobile ? 12 : 16, 
            flexWrap: 'wrap',
            animation: 'slideInLeft 0.6s ease-out 0.3s both'
          }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: isMobile ? '12px 24px' : '16px 32px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                fontWeight: 800,
                fontSize: isMobile ? 14 : 16,
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 8px 25px rgba(34,197,94,0.35)',
                transition: 'all 0.3s',
                flex: isMobile ? '1 1 100%' : 'auto',
                justifyContent: isMobile ? 'center' : 'flex-start',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(34,197,94,0.45)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(34,197,94,0.35)';
              }}
            >
              <Zap size={18} /> Créer mon planning gratuit
            </button>
            
            <button
              onClick={scrollToFeatures}
              style={{
                padding: isMobile ? '12px 24px' : '16px 32px',
                borderRadius: 16,
                background: '#fff',
                color: '#16a34a',
                fontWeight: 700,
                fontSize: isMobile ? 14 : 16,
                cursor: 'pointer',
                border: '2px solid #22c55e',
                transition: 'all 0.3s',
                flex: isMobile ? '1 1 100%' : 'auto',
                textAlign: 'center',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f0fdf4';
                e.currentTarget.style.transform = isMobile ? 'translateY(0)' : 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              En savoir plus
            </button>
          </div>

          {/* Stats */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              gap: 40,
              marginTop: 60,
              paddingTop: 40,
              borderTop: '2px solid #e2e8f0',
              animation: 'slideInLeft 0.6s ease-out 0.4s both'
            }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e' }}>500+</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>Étudiants actifs</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e' }}>92%</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>de satisfaction</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e' }}>15k+</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>Heures économisées</div>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Lottie */}
        {!isMobile && (
          <div style={{
            animation: 'slideInRight 0.8s ease-out',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              height: '120%',
              background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0) 70%)',
              borderRadius: '50%',
              zIndex: 0
            }} />
            <Lottie 
              animationData={animationData} 
              loop={true}
              style={{ width: '100%', height: 'auto', position: 'relative', zIndex: 1 }}
            />
          </div>
        )}
      </section>

      {/* Verset du jour */}
      {verse && (
        <section style={{ maxWidth: 900, margin: '0 auto 80px', padding: isMobile ? '0 12px' : '0 5%' }}>
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
            borderRadius: 28,
            padding: isMobile ? '32px 20px' : '40px 48px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, position: 'relative', flexWrap: 'wrap' }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <BookOpen size={28} color="#4ade80" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: '#86efac', 
                  letterSpacing: 2, 
                  marginBottom: 12, 
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Sun size={14} /> Verset du jour
                </div>
                <p style={{ fontSize: 20, color: '#fff', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 12, fontWeight: 500 }}>
                  "{verse.text}"
                </p>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>— {verse.ref}</p>
              </div>
            </div>

            <div style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <Heart size={16} color="#fbbf24" fill="#fbbf24" />
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', margin: 0 }}>
                {encouragement}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#f0fdf4',
            padding: '6px 16px',
            borderRadius: 40,
            marginBottom: 20
          }}>
            <Target size={14} color="#22c55e" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>FONCTIONNALITÉS</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, marginBottom: 12, color: '#0f172a' }}>
            Tout ce dont tu as besoin
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
            Conçu pour l'étudiant avec un emploi du temps chargé
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {FEATURES.map(({ icon: Icon, title, desc, color }, index) => (
            <div key={title} style={{
              background: '#fff',
              borderRadius: 20,
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              opacity: 0,
              transform: 'translateY(30px)',
              animation: `fadeInUp 0.6s ease-out ${index * 0.1}s forwards`
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 35px -12px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${color}10, ${color}05)`,
                border: `1px solid ${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                transition: 'all 0.3s'
              }}>
                <Icon size={24} color={color} strokeWidth={1.8} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section style={{
        maxWidth: 800,
        margin: '0 auto 100px',
        padding: '0 5%',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)',
          borderRadius: 32,
          padding: '60px 48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 45px -12px rgba(34,197,94,0.4)',
          transform: 'scale(1)',
          transition: 'transform 0.3s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
          }} />

          <Moon size={40} color="rgba(255,255,255,0.9)" style={{ marginBottom: 20 }} />
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 16 }}>
            Prêt à reprendre le contrôle ?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 32, lineHeight: 1.6, maxWidth: 450, marginLeft: 'auto', marginRight: 'auto' }}>
            Rejoins DayFlow et commence à construire les journées que tu mérites.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '14px 36px',
              borderRadius: 40,
              background: '#fff',
              color: '#16a34a',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.3s',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            }}
          >
            Commencer maintenant <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '32px 5%', 
        borderTop: '1px solid #e2e8f0',
        background: '#fff'
      }}>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>
          © 2025 DayFlow — Transforme ton quotidien en journées accomplies
        </p>
      </footer>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}