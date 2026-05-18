import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

type AccentKey = 'blue' | 'green' | 'orange' | 'violet';
type ModeKey = 'dark' | 'light';
type LangKey = 'es' | 'en';
interface Ac { hex: string; dim: string; mid: string; }
interface Th { bg: string; bg2: string; bg3: string; text: string; text2: string; border: string; borderMid: string; }

const ACCENTS: Record<AccentKey, Ac> = {
  blue:   { hex:'#3b82f6', dim:'rgba(59,130,246,0.12)',  mid:'rgba(59,130,246,0.3)'  },
  green:  { hex:'#22c55e', dim:'rgba(34,197,94,0.12)',   mid:'rgba(34,197,94,0.3)'   },
  orange: { hex:'#f97316', dim:'rgba(249,115,22,0.12)',  mid:'rgba(249,115,22,0.3)'  },
  violet: { hex:'#a855f7', dim:'rgba(168,85,247,0.12)',  mid:'rgba(168,85,247,0.3)'  },
};
const THEMES: Record<ModeKey, Th> = {
  dark:  { bg:'#07070f', bg2:'#0e0e1c', bg3:'#151526', text:'#f0f0f8', text2:'rgba(240,240,248,0.55)', border:'rgba(240,240,248,0.08)', borderMid:'rgba(240,240,248,0.14)' },
  light: { bg:'#f4f4fa', bg2:'#ffffff', bg3:'#e8e8f4', text:'#09090f', text2:'rgba(9,9,15,0.5)',       border:'rgba(9,9,15,0.07)',        borderMid:'rgba(9,9,15,0.12)'      },
};

const COPY = {
  es: {
    nav: 'Empezar Gratis',
    hero: { eyebrow:'100% Gratuito · Open Source', line1:'TU GYM BRO', line2:'DIGITAL.', sub:'La app de entrenamiento que piensa como un bro — y entrena como un científico.', cta:'Empezar Ahora' },
    stats: [{ v:'104', l:'Ejercicios con técnica detallada' }, { v:'200+', l:'Vídeos de técnica integrados' }, { v:'0€', l:'Para siempre, sin suscripciones' }, { v:'10x', l:'Motor de rutinas con IA' }],
    featEyebrow:'Todo lo que necesitas', featTitle:'Una app completa.\nSin coste.',
    feats:[
      { icon:'⚡', t:'Rutinas con IA',          d:'Personalizadas según tu somatotipo, nivel y lesiones. Motor anti-estancamiento.'  },
      { icon:'💪', t:'Sesión de Entrenamiento', d:'Tracking en tiempo real. Sugerencias de peso basadas en tu historial.'           },
      { icon:'📊', t:'Progreso & Estadísticas', d:'Fotos, medidas, gráficas y mapa muscular de calor.'                              },
      { icon:'🥗', t:'Nutrición Inteligente',   d:'Macros y calorías adaptados a tu composición corporal y objetivo.'              },
      { icon:'🤕', t:'Control de Lesiones',     d:'Detecta lesiones, ajusta pesos automáticamente y genera tu rehab.'              },
      { icon:'🏆', t:'Logros & Compartir',      d:'Sistema de logros gamificado. Comparte tus stats semanales.'                    },
    ],
    wkEyebrow:'Sesión de Entrenamiento', wkTitle:'Cada serie cuenta.\nCada kilo importa.',
    wkDesc:'GymBro recuerda lo que levantaste la última vez y te sugiere el peso ideal. Timer de descanso integrado. Registro completo de RIR.',
    wkPills:['Peso sugerido por historial','1RM estimado en tiempo real','Timer de descanso automático'],
    rtEyebrow:'Generador de Rutinas IA', rtTitle:'Tu rutina, diseñada\npor ciencia.',
    rtDesc:'No es una plantilla genérica. El motor 10x analiza tu somatotipo, nivel, lesiones y equipamiento para crear la rutina exacta que tu cuerpo necesita.',
    rtPoints:['Adaptación biológica por somatotipo','Escalado por nivel de experiencia','Anti-estancamiento con shuffle dinámico','Respeta tus lesiones activas'],
    frEyebrow:'Sin trampa ni cartón', frTitle:'100% Gratis.\nPara siempre.',
    frDesc:'Sin suscripciones. Sin paywalls. Sin anuncios. GymBro es gratis y siempre lo será. Empieza hoy, sin tarjeta de crédito.',
    frCta:'Empezar Ahora — Es Gratis',
    ctaTitle1:'EMPIEZA HOY.', ctaTitle2:'GRATIS.', ctaSub:'Tu cuerpo no espera. GymBro tampoco.', ctaBtn:'Empezar Ahora — Es Gratis',
    footer:'GymBro · 100% Gratuito y Open Source · Hecho con 💪',
  },
  en: {
    nav: 'Start Free',
    hero: { eyebrow:'100% Free · Open Source', line1:'YOUR DIGITAL', line2:'GYM BRO.', sub:'The workout app that thinks like a bro — and trains like a scientist.', cta:'Get Started' },
    stats: [{ v:'104', l:'Exercises with detailed technique' }, { v:'200+', l:'Technique videos included' }, { v:'0€', l:'Forever free, no subscriptions' }, { v:'10x', l:'AI-powered routine engine' }],
    featEyebrow:'Everything you need', featTitle:'A complete app.\nNo cost.',
    feats:[
      { icon:'⚡', t:'AI Routines',         d:'Personalized for your body type, level and injuries. Anti-plateau engine.'         },
      { icon:'💪', t:'Workout Session',     d:'Real-time tracking. Weight suggestions based on your history.'                    },
      { icon:'📊', t:'Progress & Stats',    d:'Photos, measurements, charts and muscle heat map.'                                },
      { icon:'🥗', t:'Smart Nutrition',     d:'Macros and calories adapted to your body composition and goal.'                  },
      { icon:'🤕', t:'Injury Control',      d:'Detects injuries, auto-adjusts weights and generates your rehab plan.'           },
      { icon:'🏆', t:'Achievements',        d:'Gamified achievements. Share your weekly stats with your community.'             },
    ],
    wkEyebrow:'Workout Session', wkTitle:'Every set counts.\nEvery kilo matters.',
    wkDesc:'GymBro remembers what you lifted last time and suggests the ideal weight. Built-in rest timer. Complete RIR tracking.',
    wkPills:['Weight suggested from history','Real-time 1RM estimate','Automatic rest timer'],
    rtEyebrow:'AI Routine Generator', rtTitle:'Your routine, designed\nby science.',
    rtDesc:"Not a generic template. The 10x engine analyzes your body type, level, injuries and equipment to create the exact routine your body needs.",
    rtPoints:['Biological adaptation by body type','Scaling by experience level','Anti-plateau dynamic shuffle','Respects your active injuries'],
    frEyebrow:'No tricks', frTitle:'100% Free.\nForever.',
    frDesc:'No subscriptions. No paywalls. No ads. GymBro is free and always will be. Start today, no credit card required.',
    frCta:'Get Started — It\'s Free',
    ctaTitle1:'START TODAY.', ctaTitle2:'FREE.', ctaSub:"Your body can't wait. Neither can GymBro.", ctaBtn:"Get Started — It's Free",
    footer:'GymBro · 100% Free and Open Source · Made with 💪',
  },
};

// ── Hooks ──────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mob, setMob] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mob;
}

function useReveal() {
  useEffect(() => {
    const sel = '.lp-reveal,.lp-reveal-left,.lp-reveal-right,.lp-reveal-scale,.lp-reveal-tilt,.lp-reveal-tilt-r';
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll(sel).forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function useParallax() {
  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const sy = window.scrollY;
        document.querySelectorAll<HTMLElement>('.lp-parallax-blob').forEach((b, i) => {
          b.style.transform = `translateY(${sy * (i % 2 === 0 ? 0.16 : -0.10)}px)`;
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafId); };
  }, []);
}

function StatCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const suffix = value.replace(/[\d.]/g, '');
    const num = parseFloat(value);
    if (!num) { el.textContent = value; return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / 1400, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(num * ease) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

// ── Nav ────────────────────────────────────────────────────────────────
function Nav({ c, ac, th, lang, mode, setLang, setMode }: {
  c: typeof COPY.es; ac: Ac; th: Th;
  lang: LangKey; mode: ModeKey;
  setLang: (v: LangKey) => void; setMode: (v: ModeKey) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const btnStyle: CSSProperties = { background: th.bg3, border: `1px solid ${th.borderMid}`, color: th.text2, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, flexShrink: 0 };

  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'0 16px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', background: scrolled ? th.bg2+'ee' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', borderBottom: scrolled ? `1px solid ${th.border}` : 'none', transition:'all .3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'20px', fontWeight:900, letterSpacing:'.5px', color: th.text, flexShrink:0 }}>
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill={ac.hex}/>
          <path d="M6 14h4M18 14h4M10 10v8M18 10v8M10 14h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        GymBro
      </div>
      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
        {!isMobile && <button style={btnStyle} onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>{lang === 'es' ? 'EN' : 'ES'}</button>}
        {!isMobile && <button style={{ ...btnStyle, fontSize:'15px' }} onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>{mode === 'dark' ? '☀️' : '🌙'}</button>}
        <Link to="/login" style={{ background: ac.hex, color:'#fff', padding: isMobile ? '8px 16px' : '9px 20px', borderRadius:'10px', fontWeight:700, fontSize: isMobile ? '13px' : '14px', textDecoration:'none', letterSpacing:'.3px', whiteSpace:'nowrap' as const }}>{c.nav}</Link>
      </div>
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────
function Hero({ c, ac, th }: { c: typeof COPY.es; ac: Ac; th: Th }) {
  const isMobile = useIsMobile();
  return (
    <section className="lp-grid-bg" style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', paddingTop:'56px' }}>
      <div className="lp-parallax-blob" style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', width:'600px', height:'600px', top:'-100px', left:'-150px', background: ac.hex, opacity:.07 }} />
      <div className="lp-parallax-blob" style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', width:'400px', height:'400px', bottom:'-50px', right:'-100px', background:'#a855f7', opacity:.06 }} />

      <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'0 20px', maxWidth:'1000px', width:'100%', margin:'0 auto', boxSizing:'border-box' as const }}>
        <div className="lp-fade-up" style={{ animationDelay:'.1s', marginBottom:'24px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'8px', background: ac.dim, border:`1px solid ${ac.mid}`, color: ac.hex, padding:'6px 16px', borderRadius:'999px', fontSize:'13px', fontWeight:600, letterSpacing:'.5px', textTransform:'uppercase' as const }}>
            <span className="lp-glow-dot" style={{ width:'6px', height:'6px', borderRadius:'50%', background: ac.hex, display:'inline-block' }} />
            {c.hero.eyebrow}
          </span>
        </div>

        <h1 className="lp-fade-up" style={{ animationDelay:'.2s', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'clamp(64px,14vw,160px)', lineHeight:.9, fontWeight:900, letterSpacing:'-2px', color: th.text, marginBottom:'12px', textTransform:'uppercase' as const }}>
          {c.hero.line1}
        </h1>
        <h1 className="lp-fade-up lp-gradient-text" style={{ animationDelay:'.3s', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'clamp(64px,14vw,160px)', lineHeight:.9, fontWeight:900, letterSpacing:'-2px', marginBottom:'32px', textTransform:'uppercase' as const }}>
          {c.hero.line2}
        </h1>

        <p className="lp-fade-up" style={{ animationDelay:'.4s', fontSize:'clamp(15px,2.5vw,22px)', color: th.text2, maxWidth:'560px', width:'100%', margin:'0 auto 36px', lineHeight:1.6, fontWeight:400 }}>
          {c.hero.sub}
        </p>

        <div className="lp-fade-up" style={{ animationDelay:'.5s', display:'flex', justifyContent:'center' }}>
          <Link to="/login" style={{ background: ac.hex, color:'#fff', padding: isMobile ? '14px 32px' : '16px 48px', borderRadius:'14px', fontWeight:700, fontSize:'16px', textDecoration:'none', boxShadow:`0 0 40px ${ac.mid}`, textAlign:'center' as const, transition:'transform .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='scale(1.02)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='scale(1)'; }}>
            {c.hero.cta}
          </Link>
        </div>

        {/* Floating mock cards — desktop: absolutely positioned; mobile: horizontal scroll */}
        {isMobile ? (
          <div style={{ marginTop:'36px', marginLeft:'-20px', marginRight:'-20px', display:'flex', gap:'12px', overflowX:'auto', paddingLeft:'20px', paddingRight:'20px', paddingBottom:'8px', scrollbarWidth:'none' as const }}>
            {/* Streak */}
            <div className="lp-float" style={{ flexShrink:0, background: th.bg2, border:`1px solid ${th.borderMid}`, borderRadius:'16px', padding:'14px 16px', minWidth:'150px', boxShadow:'0 12px 32px rgba(0,0,0,.4)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
                <span style={{ fontSize:'16px' }}>🔥</span>
                <span style={{ fontSize:'10px', fontWeight:600, color: th.text2, letterSpacing:'.5px', textTransform:'uppercase' as const }}>Racha</span>
              </div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'40px', fontWeight:900, color: ac.hex, lineHeight:1 }}>14</div>
              <div style={{ fontSize:'10px', color: th.text2, marginTop:'2px' }}>días seguidos</div>
            </div>
            {/* Timeline */}
            <div className="lp-float2" style={{ flexShrink:0, background: th.bg2, border:`1px solid ${th.borderMid}`, borderRadius:'16px', padding:'14px 16px', minWidth:'220px', boxShadow:'0 12px 32px rgba(0,0,0,.4)' }}>
              <div style={{ fontSize:'10px', fontWeight:600, color: th.text2, marginBottom:'8px', letterSpacing:'.5px', textTransform:'uppercase' as const }}>Esta semana</div>
              <div style={{ display:'flex', gap:'5px' }}>
                {['L','M','X','J','V','S','D'].map((d, i) => (
                  <div key={d} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'9px', color: i===3 ? ac.hex : th.text2, marginBottom:'3px', fontWeight:600 }}>{d}</div>
                    <div style={{ width:'24px', height:'24px', borderRadius:'6px', background: i<3 ? ac.dim : i===3 ? ac.mid : th.bg3, border: i===3 ? `2px solid ${ac.hex}` : `1px solid ${th.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px' }}>
                      {i < 3 ? '✓' : i === 3 ? '→' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Volume */}
            <div className="lp-float" style={{ animationDelay:'1s', flexShrink:0, background: th.bg2, border:`1px solid ${th.borderMid}`, borderRadius:'16px', padding:'14px 16px', minWidth:'130px', boxShadow:'0 12px 32px rgba(0,0,0,.4)' }}>
              <div style={{ fontSize:'10px', color: th.text2, marginBottom:'4px', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'.5px' }}>Volumen mes</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'30px', fontWeight:900, color: th.text, lineHeight:1 }}>8.4<span style={{ fontSize:'14px', color: th.text2 }}>t</span></div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop:'80px', position:'relative', height:'280px' }}>
            {/* Streak card */}
            <div className="lp-float" style={{ position:'absolute', left:'50%', top:'0', transform:'translateX(-50%) rotate(-3deg)', background: th.bg2, border:`1px solid ${th.borderMid}`, borderRadius:'18px', padding:'16px 20px', width:'200px', boxShadow:'0 20px 60px rgba(0,0,0,.4)', marginLeft:'-160px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <span style={{ fontSize:'20px' }}>🔥</span>
                <span style={{ fontSize:'12px', fontWeight:600, color: th.text2, letterSpacing:'.5px', textTransform:'uppercase' as const }}>Racha actual</span>
              </div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'52px', fontWeight:900, color: ac.hex, lineHeight:1 }}>14</div>
              <div style={{ fontSize:'11px', color: th.text2, marginTop:'4px' }}>días seguidos</div>
            </div>
            {/* Weekly timeline */}
            <div className="lp-float2" style={{ position:'absolute', left:'50%', top:'20px', transform:'translateX(-50%) rotate(2deg)', background: th.bg2, border:`1px solid ${th.borderMid}`, borderRadius:'18px', padding:'16px 20px', width:'260px', boxShadow:'0 20px 60px rgba(0,0,0,.4)', marginLeft:'60px' }}>
              <div style={{ fontSize:'12px', fontWeight:600, color: th.text2, marginBottom:'10px', letterSpacing:'.5px', textTransform:'uppercase' as const }}>Esta semana</div>
              <div style={{ display:'flex', gap:'6px', justifyContent:'space-between' }}>
                {['L','M','X','J','V','S','D'].map((d, i) => (
                  <div key={d} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'10px', color: i===3 ? ac.hex : th.text2, marginBottom:'4px', fontWeight:600 }}>{d}</div>
                    <div style={{ width:'28px', height:'28px', borderRadius:'8px', background: i<3 ? ac.dim : i===3 ? ac.mid : th.bg3, border: i===3 ? `2px solid ${ac.hex}` : `1px solid ${th.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>
                      {i < 3 ? '✓' : i === 3 ? '→' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Volume card */}
            <div className="lp-float" style={{ animationDelay:'1s', position:'absolute', bottom:'0', left:'50%', transform:'translateX(-50%) rotate(1deg)', background: th.bg2, border:`1px solid ${th.borderMid}`, borderRadius:'18px', padding:'14px 18px', width:'170px', boxShadow:'0 20px 60px rgba(0,0,0,.4)', marginLeft:'-200px' }}>
              <div style={{ fontSize:'11px', color: th.text2, marginBottom:'4px', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'.5px' }}>Volumen mes</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'36px', fontWeight:900, color: th.text, lineHeight:1 }}>8.4<span style={{ fontSize:'18px', color: th.text2 }}>t</span></div>
            </div>
          </div>
        )}
      </div>

      <div style={{ position:'absolute', bottom:'32px', left:'50%', transform:'translateX(-50%)', color: th.text2, fontSize:'12px', letterSpacing:'2px', textTransform:'uppercase' as const, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'8px' }}>
        <span>Scroll</span>
        <div style={{ width:'1px', height:'40px', background:`linear-gradient(${ac.hex}, transparent)` }} />
      </div>
    </section>
  );
}

// ── StatsBar ───────────────────────────────────────────────────────────
function StatsBar({ c, ac, th }: { c: typeof COPY.es; ac: Ac; th: Th }) {
  return (
    <section className="lp-reveal" style={{ background: th.bg2, borderTop:`1px solid ${th.border}`, borderBottom:`1px solid ${th.border}`, padding:'64px 24px', overflow:'hidden', position:'relative' }}>
      <div className="lp-parallax-blob" style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', width:'400px', height:'400px', top:'-150px', left:'50%', transform:'translateX(-50%)', background: ac.hex, opacity:.05 }} />
      <div style={{ maxWidth:'900px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'48px', position:'relative', zIndex:1 }}>
        {c.stats.map((s, i) => (
          <div key={i} className={`lp-reveal lp-d${i+1}`} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'80px', fontWeight:900, color: ac.hex, lineHeight:1, marginBottom:'8px' }}>
              <StatCounter value={s.v} />
            </div>
            <span className="lp-shimmer-line" style={{ margin:'0 auto 10px', display:'block' }} />
            <div style={{ fontSize:'14px', color: th.text2, fontWeight:500 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────
function Features({ c, ac, th }: { c: typeof COPY.es; ac: Ac; th: Th }) {
  return (
    <section id="features" style={{ padding:'120px 24px', position:'relative', overflow:'hidden' }}>
      <div className="lp-parallax-blob" style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', width:'500px', height:'500px', top:'50%', right:'-200px', background: ac.hex, opacity:.05, transform:'translateY(-50%)' }} />
      <div style={{ maxWidth:'1100px', margin:'0 auto', position:'relative', zIndex:1 }}>
        <div className="lp-reveal" style={{ textAlign:'center', marginBottom:'80px' }}>
          <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase' as const, color: ac.hex, marginBottom:'16px' }}>{c.featEyebrow}</div>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'clamp(48px,7vw,88px)', fontWeight:900, color: th.text, lineHeight:.95, whiteSpace:'pre-line' as const }}>{c.featTitle}</h2>
          <span className="lp-shimmer-line" style={{ margin:'24px auto 0', display:'block' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'20px' }}>
          {c.feats.map((item, i) => (
            <div key={i} className={`lp-reveal-scale lp-card-lift lp-d${(i % 3) + 1}`}
              style={{ background: th.bg2, border:`1px solid ${th.border}`, borderRadius:'20px', padding:'28px', cursor:'default' }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = ac.hex; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = th.border; }}>
              <div style={{ fontSize:'32px', marginBottom:'16px' }}>{item.icon}</div>
              <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'26px', fontWeight:700, color: th.text, marginBottom:'10px', letterSpacing:'.3px' }}>{item.t}</h3>
              <p style={{ fontSize:'15px', color: th.text2, lineHeight:1.6 }}>{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── WorkoutSection ─────────────────────────────────────────────────────
function WorkoutSection({ c, ac, th }: { c: typeof COPY.es; ac: Ac; th: Th }) {
  const isMobile = useIsMobile();
  return (
    <section style={{ padding: isMobile ? '60px 20px' : '120px 24px', background: th.bg2, position:'relative', overflow:'hidden' }}>
      <div className="lp-parallax-blob" style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', width:'600px', height:'600px', top:'-100px', left:'-200px', background: ac.hex, opacity:.06 }} />
      <div style={{ maxWidth:'1100px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'80px', alignItems:'center', position:'relative', zIndex:1 }}>
        {/* Phone mock */}
        <div className="lp-reveal-tilt" style={{ display:'flex', justifyContent:'center' }}>
          <div className="lp-float" style={{ borderRadius:'40px', border:`2px solid ${th.borderMid}`, background: th.bg, overflow:'hidden', position:'relative', boxShadow:`0 40px 80px rgba(0,0,0,.6), 0 0 0 1px ${th.border}`, width:'280px' }}>
            <div style={{ height:'28px', background: th.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:'80px', height:'10px', background:'#111', borderRadius:'10px' }} />
            </div>
            <div style={{ background: ac.hex, padding:'16px', color:'#fff' }}>
              <div style={{ fontSize:'13px', opacity:.8, marginBottom:'4px' }}>Pecho & Tríceps</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'22px', fontWeight:700 }}>PRESS BANCA</div>
              <div style={{ marginTop:'8px', background:'rgba(255,255,255,.2)', borderRadius:'6px', height:'5px', overflow:'hidden' }}>
                <div style={{ width:'60%', height:'100%', background:'#fff', borderRadius:'6px' }} />
              </div>
              <div style={{ fontSize:'11px', marginTop:'4px', opacity:.7 }}>3 de 5 ejercicios</div>
            </div>
            <div style={{ padding:'16px', background: th.bg2 }}>
              <div style={{ background: th.bg3, borderRadius:'12px', padding:'14px', marginBottom:'12px' }}>
                <div style={{ fontSize:'11px', color: th.text2, marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'.5px' }}>Objetivo</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'28px', fontWeight:900, color: th.text }}>4 × 8–10</div>
              </div>
              <div style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'10px', padding:'10px 14px', marginBottom:'10px', fontSize:'13px', color:'#93c5fd' }}>
                💡 Peso sugerido: <strong>80kg</strong>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'12px' }}>
                {['Reps','Peso kg','RIR'].map(l => (
                  <div key={l} style={{ background: th.bg3, borderRadius:'8px', padding:'10px 6px', textAlign:'center' }}>
                    <div style={{ fontSize:'9px', color: th.text2, marginBottom:'3px' }}>{l}</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'22px', fontWeight:700, color: th.text }}>—</div>
                  </div>
                ))}
              </div>
              <div style={{ background: ac.hex, color:'#fff', borderRadius:'10px', padding:'12px', textAlign:'center', fontSize:'13px', fontWeight:700 }}>
                ✓ Completar Serie 3
              </div>
            </div>
          </div>
        </div>
        {/* Text */}
        <div className="lp-reveal-left">
          <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase' as const, color: ac.hex, marginBottom:'20px' }}>{c.wkEyebrow}</div>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'clamp(42px,5vw,72px)', fontWeight:900, color: th.text, lineHeight:.95, marginBottom:'24px', whiteSpace:'pre-line' as const }}>{c.wkTitle}</h2>
          <p style={{ fontSize:'16px', color: th.text2, lineHeight:1.7, marginBottom:'32px' }}>{c.wkDesc}</p>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px' }}>
            {c.wkPills.map((p, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: ac.hex, flexShrink:0 }} />
                <span style={{ fontSize:'15px', color: th.text, fontWeight:500 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── RoutineSection ─────────────────────────────────────────────────────
function RoutineSection({ c, ac, th }: { c: typeof COPY.es; ac: Ac; th: Th }) {
  const isMobile = useIsMobile();
  const days = ['Push','Pull','Legs','Upper','Lower'];
  const exs = [
    { name:'Press Banca',  tier:'S', sets:'4×8-10' },
    { name:'Fondos',       tier:'A', sets:'3×10-12' },
    { name:'Press Militar',tier:'A', sets:'3×10-12' },
  ];
  return (
    <section style={{ padding: isMobile ? '60px 20px' : '120px 24px', position:'relative', overflow:'hidden' }}>
      <div className="lp-parallax-blob" style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', width:'500px', height:'500px', bottom:'-100px', right:'-100px', background:'#a855f7', opacity:.07 }} />
      <div style={{ maxWidth:'1100px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap: isMobile ? '40px' : '80px', alignItems:'center', position:'relative', zIndex:1 }}>
        {/* Text */}
        <div className="lp-reveal-right">
          <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase' as const, color: ac.hex, marginBottom:'20px' }}>{c.rtEyebrow}</div>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'clamp(42px,5vw,72px)', fontWeight:900, color: th.text, lineHeight:.95, marginBottom:'24px', whiteSpace:'pre-line' as const }}>{c.rtTitle}</h2>
          <p style={{ fontSize:'16px', color: th.text2, lineHeight:1.7, marginBottom:'32px' }}>{c.rtDesc}</p>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px' }}>
            {c.rtPoints.map((p, i) => (
              <div key={i} className={`lp-reveal lp-d${i+1}`} style={{ display:'flex', alignItems:'center', gap:'12px', background: th.bg2, border:`1px solid ${th.border}`, borderRadius:'12px', padding:'12px 16px' }}>
                <div style={{ width:'24px', height:'24px', borderRadius:'50%', background: ac.dim, border:`1px solid ${ac.mid}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ color: ac.hex, fontSize:'12px', fontWeight:700 }}>✓</span>
                </div>
                <span style={{ fontSize:'15px', color: th.text, fontWeight:500 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Routine mock */}
        <div className="lp-reveal-tilt-r" style={{ display:'flex', justifyContent:'center' }}>
          <div className="lp-float2" style={{ background: th.bg2, border:`1px solid ${th.borderMid}`, borderRadius:'24px', padding:'24px', width:'300px', boxShadow:'0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
              <span style={{ fontSize:'20px' }}>⚡</span>
              <div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'18px', fontWeight:700, color: th.text, letterSpacing:'.3px' }}>Push/Pull/Legs 2x</div>
                <div style={{ fontSize:'12px', color: th.text2 }}>6 días · Hipertrofia · Intermedio</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'6px', marginBottom:'16px', flexWrap:'wrap' as const }}>
              {days.map((d, i) => (
                <div key={i} style={{ padding:'5px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:600, background: i===0 ? ac.dim : th.bg3, border:`1px solid ${i===0 ? ac.mid : th.border}`, color: i===0 ? ac.hex : th.text2 }}>{d}</div>
              ))}
            </div>
            <div style={{ borderTop:`1px solid ${th.border}`, paddingTop:'16px' }}>
              <div style={{ fontSize:'11px', color: th.text2, textTransform:'uppercase' as const, letterSpacing:'.5px', marginBottom:'10px', fontWeight:600 }}>Día 1 — Push</div>
              {exs.map((ex, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background: th.bg3, borderRadius:'10px', marginBottom:'6px' }}>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600, color: th.text }}>{ex.name}</div>
                    <div style={{ fontSize:'11px', color: th.text2 }}>{ex.sets}</div>
                  </div>
                  <div style={{ padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:700, background: ex.tier==='S' ? 'rgba(34,197,94,.15)' : ac.dim, color: ex.tier==='S' ? '#4ade80' : ac.hex }}>
                    Tier {ex.tier}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:'16px', background: ac.hex, borderRadius:'12px', padding:'12px', textAlign:'center', color:'#fff', fontSize:'13px', fontWeight:700 }}>
              ✓ Guardar y Comenzar
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FreeSection ────────────────────────────────────────────────────────
function FreeSection({ c, ac, th }: { c: typeof COPY.es; ac: Ac; th: Th }) {
  const isMobile = useIsMobile();
  return (
    <section style={{ padding: isMobile ? '60px 16px' : '120px 24px', position:'relative', overflow:'hidden' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', position:'relative', zIndex:1 }}>
        <div className="lp-reveal-scale" style={{ background:`linear-gradient(135deg,${th.bg2} 0%,${th.bg3} 100%)`, border:`1px solid ${th.borderMid}`, borderRadius: isMobile ? '20px' : '32px', padding: isMobile ? '48px 24px' : '80px 60px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div className="lp-parallax-blob" style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', width:'400px', height:'400px', top:'-100px', left:'50%', transform:'translateX(-50%)', background: ac.hex, opacity:.07 }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase' as const, color: ac.hex, marginBottom:'20px' }}>{c.frEyebrow}</div>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'clamp(56px,9vw,110px)', fontWeight:900, lineHeight:.9, color: th.text, whiteSpace:'pre-line' as const, marginBottom:'24px' }}>{c.frTitle}</h2>
            <p style={{ fontSize:'18px', color: th.text2, maxWidth:'520px', margin:'0 auto 40px', lineHeight:1.6 }}>{c.frDesc}</p>
            <Link to="/login"
              style={{ display:'inline-block', background: ac.hex, color:'#fff', border:'none', padding:'16px 36px', borderRadius:'12px', fontWeight:700, fontSize:'15px', textDecoration:'none', boxShadow:`0 0 40px ${ac.mid}`, transition:'transform .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='scale(1)'; }}>
              {c.frCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FinalCTA ───────────────────────────────────────────────────────────
function FinalCTA({ c, ac, th }: { c: typeof COPY.es; ac: Ac; th: Th }) {
  const isMobile = useIsMobile();
  return (
    <section className="lp-grid-bg" style={{ padding: isMobile ? '80px 20px' : '140px 24px', position:'relative', overflow:'hidden', textAlign:'center' }}>
      <div className="lp-parallax-blob" style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', width:'700px', height:'700px', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background: ac.hex, opacity:.06 }} />
      <div className="lp-reveal-scale" style={{ position:'relative', zIndex:1 }}>
        <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'clamp(64px,13vw,150px)', fontWeight:900, lineHeight:.9, textTransform:'uppercase' as const, marginBottom:0 }}>
          <span style={{ color: th.text, display:'block' }}>{c.ctaTitle1}</span>
          <span className="lp-gradient-text" style={{ display:'block' }}>{c.ctaTitle2}</span>
        </h2>
        <p style={{ fontSize:'18px', color: th.text2, marginTop:'32px', marginBottom:'48px' }}>{c.ctaSub}</p>
        <Link to="/login"
          style={{ display:'inline-block', background: ac.hex, color:'#fff', padding:'20px 48px', borderRadius:'16px', fontWeight:700, fontSize:'18px', textDecoration:'none', boxShadow:`0 0 60px ${ac.mid}`, transition:'transform .2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='scale(1.04)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='scale(1)'; }}>
          {c.ctaBtn}
        </Link>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────
function Footer({ c, th }: { c: typeof COPY.es; th: Th }) {
  return (
    <footer style={{ borderTop:`1px solid ${th.border}`, padding:'32px 24px', textAlign:'center', background: th.bg2 }}>
      <p style={{ fontSize:'14px', color: th.text2 }}>{c.footer}</p>
    </footer>
  );
}

// ── Main export ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mode, setMode] = useState<ModeKey>('dark');
  const [lang, setLang] = useState<LangKey>('es');

  const ac = ACCENTS['blue'];
  const th = THEMES[mode];
  const c  = COPY[lang];

  useReveal();
  useParallax();

  return (
    <div style={{ background: th.bg, color: th.text, fontFamily:"'DM Sans',sans-serif", overflowX:'hidden', position:'relative', lineHeight:1.5 }} className="lp-noise">
      <Nav c={c} ac={ac} th={th} lang={lang} mode={mode} setLang={setLang} setMode={setMode} />
      <Hero    c={c} ac={ac} th={th} />
      <StatsBar c={c} ac={ac} th={th} />
      <Features c={c} ac={ac} th={th} />
      <WorkoutSection  c={c} ac={ac} th={th} />
      <RoutineSection  c={c} ac={ac} th={th} />
      <FreeSection     c={c} ac={ac} th={th} />
      <FinalCTA        c={c} ac={ac} th={th} />
      <Footer          c={c} th={th} />
    </div>
  );
}
