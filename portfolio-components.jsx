/* portfolio-components.jsx */
const { useState, useEffect, useRef, useCallback } = React;

// ── CONSTANTS ─────────────────────────────────────────────
const THEMES = {
  dark:  { bg:'#0B0B0B', surface:'#161614', textPrimary:'#F0EDE8', textSecondary:'#8A857E', border:'#2A2825', navBg:'rgba(11,11,11,0.88)' },
  light: { bg:'#F5F2ED', surface:'#EAE7E0', textPrimary:'#1A1916', textSecondary:'#6B665F', border:'#D5D0C8', navBg:'rgba(245,242,237,0.88)' },
};
const FONTS = {
  technical:  { display:"'Instrument Serif', serif", body:"'Space Grotesk', sans-serif" },
  classic:    { display:"'Libre Baskerville', serif", body:"'DM Sans', sans-serif" },
  avantgarde: { display:"'Syne', sans-serif",         body:"'Space Grotesk', sans-serif" },
};

// ── HOOKS ─────────────────────────────────────────────────
function useInView(ref, opts = {}) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); ob.disconnect(); }
    }, { threshold: 0.1, ...opts });
    ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return vis;
}

// ── REVEAL ────────────────────────────────────────────────
function Reveal({ children, delay = 0, direction = 'up', style = {}, className = '' }) {
  const ref = useRef(null);
  const vis = useInView(ref);
  const offsets = { up:'translateY(28px)', down:'translateY(-28px)', left:'translateX(-28px)', right:'translateX(28px)', none:'none' };
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : (offsets[direction] || offsets.up),
      transition: `opacity .65s cubic-bezier(.16,1,.3,1) ${delay}s, transform .65s cubic-bezier(.16,1,.3,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
}

// ── ANIMATED COUNTER ──────────────────────────────────────
function AnimCounter({ target, suffix = '', duration = 1200 }) {
  const ref = useRef(null);
  const vis = useInView(ref);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!vis) return;
    const num = parseInt(target);
    if (isNaN(num)) return;
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * num));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [vis]);
  return <span ref={ref}>{vis ? count + suffix : '0' + suffix}</span>;
}

// ── SCROLL PROGRESS BAR ──────────────────────────────────
function ScrollProgress({ accent }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? window.scrollY / h : 0);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, height:'2px', zIndex:201, pointerEvents:'none' }}>
      <div style={{ height:'100%', background:accent, width:`${p * 100}%`, transition:'width .08s linear' }} />
    </div>
  );
}

// ── CUSTOM CURSOR ─────────────────────────────────────────
function CustomCursor({ accent }) {
  const dotRef = useRef(null);
  const pos = useRef({ x: -80, y: -80 });
  const target = useRef({ x: -80, y: -80 });
  const [hov, setHov] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setShow(true);
    const move = e => { target.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', move);
    const over = e => { if (e.target.closest('a,button,[data-h]')) setHov(true); };
    const out  = e => { if (e.target.closest('a,button,[data-h]')) setHov(false); };
    document.addEventListener('mouseover', over, true);
    document.addEventListener('mouseout', out, true);
    let raf;
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      if (dotRef.current) {
        dotRef.current.style.left = pos.current.x + 'px';
        dotRef.current.style.top  = pos.current.y + 'px';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', over, true);
      document.removeEventListener('mouseout', out, true);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!show) return null;
  return <div ref={dotRef} style={{
    position:'fixed', pointerEvents:'none', zIndex:99999,
    width: hov ? 44 : 10, height: hov ? 44 : 10,
    borderRadius:'50%', border:`1.5px solid ${accent}`,
    background: hov ? `${accent}12` : 'transparent',
    transform:'translate(-50%,-50%)',
    transition:'width .3s ease, height .3s ease, background .3s ease',
  }} />;
}

// ── SECTION LABEL ─────────────────────────────────────────
function SectionLabel({ text, accent, fp, theme }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'16px' }}>
      <span style={{ fontFamily:fp.body, fontSize:'11px', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:accent }}>{text}</span>
      <span style={{ flex:1, height:'1px', background:theme.border }} />
    </div>
  );
}

// ── NAV ───────────────────────────────────────────────────
function Nav({ theme, accent, fp }) {
  const [hov, setHov] = useState(null);
  const links = ['Mission','Process','Work','Skills','Contact'];
  return (
    <nav className="a-nav nav-bar" style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'18px 48px',
      background:theme.navBg, backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
      borderBottom:`1px solid ${theme.border}`, fontFamily:fp.body,
    }}>
      <a href="#" style={{ fontFamily:fp.display, fontStyle:'italic', fontSize:'24px', color:theme.textPrimary, letterSpacing:'-0.02em', cursor:'pointer', textDecoration:'none' }}>AG</a>
      <div style={{ display:'flex', gap:'32px' }}>
        {links.map(l => (
          <a key={l} href={`#${l.toLowerCase()}`}
            onMouseEnter={() => setHov(l)} onMouseLeave={() => setHov(null)}
            style={{
              fontFamily:fp.body, fontSize:'12px', fontWeight:500,
              letterSpacing:'0.1em', textTransform:'uppercase', textDecoration:'none',
              color: hov === l ? accent : theme.textSecondary,
              transition:'color .25s ease', cursor:'pointer', position:'relative',
            }}>
            {l}
            <span style={{ position:'absolute', bottom:-3, left:0, width:'100%', height:'1.5px',
              background:accent, transform: hov===l ? 'scaleX(1)' : 'scaleX(0)',
              transformOrigin:'left', transition:'transform .3s cubic-bezier(.16,1,.3,1)' }} />
          </a>
        ))}
      </div>
    </nav>
  );
}

// ── CTA BUTTON ────────────────────────────────────────────
function CTA({ children, primary, accent, theme, fp, onClick, href, style: extraStyle = {} }) {
  const [h, setH] = useState(false);
  const [p, setP] = useState(false);
  const Tag = href ? 'a' : 'button';
  return (
    <Tag href={href} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => { setH(false); setP(false); }}
      onMouseDown={() => setP(true)} onMouseUp={() => setP(false)}
      data-h="1"
      style={{
        fontFamily:fp.body, fontSize:'14px', fontWeight:600, letterSpacing:'0.02em',
        padding: primary ? '14px 30px' : '14px 24px', display:'inline-flex', alignItems:'center', gap:'6px',
        border: primary ? 'none' : `1px solid ${theme.border}`,
        borderRadius:'8px', cursor:'pointer', textDecoration:'none',
        transition:'all .25s cubic-bezier(.16,1,.3,1)',
        background: primary ? (h ? theme.textPrimary : accent) : (h ? theme.surface : 'transparent'),
        color: primary ? (h ? theme.bg : '#fff') : theme.textPrimary,
        transform: p ? 'scale(.97)' : h ? 'translateY(-1px)' : 'none',
        boxShadow: h && primary ? `0 8px 28px ${accent}40` : 'none',
        ...extraStyle,
      }}>{children}</Tag>
  );
}

// ══════════════════════════════════════════════════════════
//  HERO SECTION
// ══════════════════════════════════════════════════════════
function HeroSection({ tweaks, theme, accent, fp }) {
  const photoRef = useRef(null);
  useEffect(() => {
    if (!tweaks.showPhoto) return;
    const fn = e => {
      if (!photoRef.current) return;
      photoRef.current.style.transform = `translate(${(e.clientX/window.innerWidth-.5)*-8}px,${(e.clientY/window.innerHeight-.5)*-8}px)`;
    };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, [tweaks.showPhoto]);

  const name = tweaks.nameCase === 'upper' ? { first:'ANDREW', last:'GARDNER' } : { first:'Andrew', last:'Gardner' };
  const nameCSS = {
    fontFamily:fp.display, fontSize:'clamp(58px, 10.5vw, 156px)',
    lineHeight:0.92, letterSpacing: tweaks.nameCase === 'upper' ? '-0.015em' : '-0.03em',
    color:theme.textPrimary, fontWeight:400, textWrap:'nowrap',
  };

  return (
    <section id="hero" className="hero-sect" style={{
      minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center',
      padding:'120px 48px 60px', position:'relative',
    }}>
      <div style={{ position:'absolute', top:'-20%', right:'-10%', width:'60%', height:'80%',
        background:`radial-gradient(ellipse at center, ${accent}08 0%, transparent 70%)`, pointerEvents:'none' }} />
      <div className="hero-grid" style={{
        display:'grid', gridTemplateColumns: tweaks.showPhoto ? '1fr 340px' : '1fr',
        gap:'48px', alignItems:'center', maxWidth:'1320px', width:'100%', margin:'0 auto', position:'relative',
      }}>
        <div>
          <div className="a-meta" style={{
            fontFamily:fp.body, fontSize:'12px', fontWeight:500, letterSpacing:'0.16em', textTransform:'uppercase',
            color:theme.textSecondary, marginBottom:'28px', display:'flex', alignItems:'center', gap:'12px',
          }}>
            <span style={{ color:accent, fontWeight:600 }}>AI Engineer</span>
            <span style={{ width:4, height:4, borderRadius:'50%', background:theme.border, display:'inline-block' }} />
            <span>New Jersey</span>
            <span style={{ width:4, height:4, borderRadius:'50%', background:theme.border, display:'inline-block' }} />
            <span>NJIT Graduate</span>
          </div>
          <div className="a-name1" style={nameCSS}>{name.first}</div>
          <div className="a-name2" style={nameCSS}>{name.last}</div>
          <div className="a-line" style={{ width:100, height:3, background:accent, margin:'28px 0', borderRadius:2 }} />
          <div className="a-tag">
            <p style={{ fontFamily:fp.body, fontSize:'clamp(18px,1.8vw,22px)', lineHeight:1.55, color:theme.textPrimary, maxWidth:540 }}>I build AI systems that ship.</p>
            <p style={{ fontFamily:fp.body, fontSize:'clamp(14px,1.4vw,16px)', lineHeight:1.65, color:theme.textSecondary, maxWidth:540, marginTop:10 }}>
              End-to-end execution from discovery to production — one engineer, measurable business outcomes.
            </p>
          </div>
          <div className="a-stats" style={{
            display:'flex', gap:28, marginTop:32, fontFamily:fp.body, fontSize:12,
            letterSpacing:'0.04em', textTransform:'uppercase', color:theme.textSecondary, alignItems:'center',
          }}>
            {[{ v: null, vComp: <AnimCounter target={20} suffix="+" />, l:'Projects shipped' },
              { v:'Full-Stack', l:'AI execution' },
              { v:'B.S.', l:'Web & Info Systems' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ width:1, height:28, background:theme.border }} />}
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  <span style={{ color:theme.textPrimary, fontWeight:600, fontSize:14, letterSpacing:0 }}>{s.vComp || s.v}</span>
                  <span style={{ fontSize:11, fontWeight:500, opacity:.7 }}>{s.l}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="a-cta" style={{ display:'flex', gap:14, marginTop:36 }}>
            <CTA primary accent={accent} theme={theme} fp={fp} href="#work">See my work <span>→</span></CTA>
            <CTA accent={accent} theme={theme} fp={fp} href="#contact">Get in touch</CTA>
          </div>
        </div>

        {tweaks.showPhoto && (
          <div className="a-photo" style={{ display:'flex', justifyContent:'flex-end' }}>
            <div ref={photoRef} style={{
              width:320, height:420, borderRadius:14, border:`1px solid ${theme.border}`,
              background:theme.surface, position:'relative', overflow:'hidden', transition:'transform .08s ease-out',
            }}>
              <img src="headshot.png" alt="Andrew Gardner" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
              <div style={{ position:'absolute', top:12, right:12, width:24, height:24, borderRight:`1.5px solid ${accent}40`, borderTop:`1.5px solid ${accent}40` }} />
              <div style={{ position:'absolute', bottom:12, left:12, width:24, height:24, borderLeft:`1.5px solid ${accent}40`, borderBottom:`1.5px solid ${accent}40` }} />
            </div>
          </div>
        )}
      </div>

      <div className="a-scroll" style={{
        position:'absolute', bottom:28, left:'50%', display:'flex', flexDirection:'column',
        alignItems:'center', gap:6, color:theme.textSecondary, opacity:.35,
      }}>
        <span style={{ fontFamily:fp.body, fontSize:10, fontWeight:500, letterSpacing:'0.16em', textTransform:'uppercase' }}>Scroll</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 5l4 4 4-4" /></svg>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
//  MISSION SECTION
// ══════════════════════════════════════════════════════════
function MissionSection({ theme, accent, fp }) {
  const steps = [
    { num:'01', text:'Growing up in a small town with limited exposure to technology, I watched local businesses get excluded from the digital economy.' },
    { num:'02', text:'At NJIT, once I started building with AI and agentic workflows, I saw that a single engineer could now reproduce the output velocity of an entire team.' },
    { num:'03', text:'That changed my direction completely. I decided to use that leverage to solve practical business problems end to end.' },
  ];
  return (
    <section id="mission" style={{ padding:'100px 48px', maxWidth:1320, margin:'0 auto' }}>
      <Reveal><SectionLabel text="Mission" accent={accent} fp={fp} theme={theme} /></Reveal>
      <Reveal delay={0.1}>
        <h2 style={{ fontFamily:fp.display, fontSize:'clamp(32px,4.5vw,54px)', lineHeight:1.1, color:theme.textPrimary, maxWidth:680, fontWeight:400, letterSpacing:'-0.02em', marginBottom:56 }}>
          Why this work matters before any product gets built.
        </h2>
      </Reveal>
      <div style={{ position:'relative', paddingLeft:40 }}>
        <div style={{ position:'absolute', left:11, top:8, bottom:8, width:2, background:theme.border, borderRadius:1 }} />
        {steps.map((s, i) => (
          <Reveal key={i} delay={0.15 + i * 0.12} style={{ display:'flex', gap:28, marginBottom: i < steps.length - 1 ? 48 : 0, position:'relative' }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:theme.bg, border:`2px solid ${accent}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'absolute', left:-40, top:2, zIndex:1 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:accent }} />
            </div>
            <div>
              <span style={{ fontFamily:fp.body, fontSize:11, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:accent, display:'block', marginBottom:8 }}>Chapter {s.num}</span>
              <p style={{ fontFamily:fp.body, fontSize:'clamp(16px,1.6vw,19px)', lineHeight:1.65, color:theme.textPrimary, maxWidth:600 }}>{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
//  PROCESS SECTION
// ══════════════════════════════════════════════════════════
function ProcessSection({ theme, accent, fp }) {
  const steps = [
    { num:'01', title:'Discover', desc:'Real problems first. Discovery calls, business context, and user needs before any code.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg> },
    { num:'02', title:'Architect', desc:'System design before implementation. Data flows, APIs, and AI integration points mapped out.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { num:'03', title:'Build', desc:'Full-stack implementation with AI-assisted velocity. One engineer, complete ownership.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
    { num:'04', title:'Measure', desc:'Every deployment ships with analytics, feedback loops, and measurable KPIs baked in.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg> },
    { num:'05', title:'Ship', desc:'Production deployment with verification, observability, and clean documentation.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M5 12l5 5L20 7"/></svg> },
  ];

  return (
    <section id="process" style={{ background:theme.surface, padding:'100px 48px' }}>
      <div style={{ maxWidth:1320, margin:'0 auto' }}>
        <Reveal><SectionLabel text="Process" accent={accent} fp={fp} theme={theme} /></Reveal>
        <Reveal delay={0.1}>
          <h2 style={{ fontFamily:fp.display, fontSize:'clamp(32px,4.5vw,54px)', lineHeight:1.1, color:theme.textPrimary, maxWidth:680, fontWeight:400, letterSpacing:'-0.02em', marginBottom:64 }}>
            How I move from discovery to shipped outcomes.
          </h2>
        </Reveal>
        <div className="process-grid" style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:0, position:'relative' }}>
          <Reveal direction="none" style={{ position:'absolute', top:27, left:'10%', right:'10%', height:2, background:theme.border, zIndex:0 }} />
          {steps.map((s, i) => (
            <Reveal key={i} delay={0.15 + i * 0.1} style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', position:'relative', zIndex:1 }}>
              <div style={{
                width:56, height:56, borderRadius:'50%', background:theme.bg,
                border:`2px solid ${accent}`, display:'flex', alignItems:'center', justifyContent:'center',
                color:accent, marginBottom:20, flexShrink:0,
              }}>{s.icon}</div>
              <span style={{ fontFamily:fp.body, fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:accent, marginBottom:6 }}>{s.num}</span>
              <h3 style={{ fontFamily:fp.display, fontSize:22, color:theme.textPrimary, fontWeight:400, marginBottom:10, letterSpacing:'-0.01em' }}>{s.title}</h3>
              <p style={{ fontFamily:fp.body, fontSize:14, lineHeight:1.6, color:theme.textSecondary, maxWidth:200 }}>{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
//  WORK SECTION
// ══════════════════════════════════════════════════════════
const PROJECTS = [
  {
    tag:'AI EXECUTION MODEL', name:'AGmedia', featured: true,
    brief:'Enterprise-grade execution for small businesses that usually settle for a static brochure site.',
    full:'I launched AGmedia to deliver enterprise-grade execution speed to small businesses. Instead of shipping one page, I delivered complete web presences: site, profiles, SEO, ads, and analytics mapped to the full sales funnel.',
    quote:'Complete web presences mapped to the full sales funnel — not static brochure sites.',
    url:'https://agmediaweb.dev',
  },
  {
    tag:'AI-POWERED STYLE CONSULTANT', name:'Threadworks AI',
    brief:'Vector database + RAG pipeline to surface curated second-hand fashion at scale.',
    full:'Built a digital style consultant backed by a vector database and RAG pipeline that scrapes eBay, Depop, and Poshmark. The pipeline continuously indexes resale listings, embeds them semantically, and retrieves the most relevant pieces in response to natural-language style queries.',
    quote:'Curated thrifting accessible at scale — powered by semantic search and RAG.',
    url:'#',
  },
  {
    tag:'PLATFORM RECOVERY', name:'Pure Home Inspection',
    brief:'Replaced a failing WordPress setup with a clean, performance-oriented web presence.',
    full:'Replaced a failing WordPress setup with a clean, performance-oriented web presence integrated with local discovery and analytics. Deployed quickly through agentic workflows and connected website activity to measurable funnel behavior.',
    quote:'Deployed through agentic workflows — connected activity to measurable funnel behavior.',
    url:'https://njpurehome.com',
  },
];

function WorkSection({ theme, accent, fp }) {
  return (
    <section id="work" style={{ padding:'100px 48px', maxWidth:1320, margin:'0 auto' }}>
      <Reveal><SectionLabel text="Work" accent={accent} fp={fp} theme={theme} /></Reveal>
      <Reveal delay={0.1}>
        <h2 style={{ fontFamily:fp.display, fontSize:'clamp(32px,4.5vw,54px)', lineHeight:1.1, color:theme.textPrimary, maxWidth:700, fontWeight:400, letterSpacing:'-0.02em', marginBottom:48 }}>
          Real deployments, clear execution, measurable impact.
        </h2>
      </Reveal>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {PROJECTS.map((p, i) => (
          <Reveal key={i} delay={0.15 + i * 0.1}>
            <ProjectCard project={p} theme={theme} accent={accent} fp={fp} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project, theme, accent, fp }) {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState(false);
  const bodyRef = useRef(null);
  const [bodyH, setBodyH] = useState(0);

  useEffect(() => {
    if (bodyRef.current) setBodyH(bodyRef.current.scrollHeight);
  }, [open]);

  return (
    <div data-h="1"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:14, border:`1px solid ${hov || open ? accent + '50' : theme.border}`,
        background: hov || open ? theme.surface : 'transparent',
        transition:'all .3s cubic-bezier(.16,1,.3,1)', overflow:'hidden',
      }}>
      <div onClick={() => setOpen(!open)} style={{
        padding:'28px 32px', cursor:'pointer', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24,
      }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
            <span style={{ fontFamily:fp.body, fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color: hov || open ? accent : theme.textSecondary, transition:'color .3s' }}>{project.tag}</span>
            {project.featured && <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:accent, padding:'3px 8px', border:`1px solid ${accent}40`, borderRadius:4, fontFamily:fp.body }}>Featured</span>}
          </div>
          <h3 style={{ fontFamily:fp.display, fontSize:'clamp(22px,2.5vw,30px)', color:theme.textPrimary, fontWeight:400, letterSpacing:'-0.01em', marginBottom:8 }}>{project.name}</h3>
          <p style={{ fontFamily:fp.body, fontSize:15, color:theme.textSecondary, lineHeight:1.55 }}>{project.brief}</p>
        </div>
        <div style={{
          width:36, height:36, borderRadius:'50%', border:`1px solid ${theme.border}`,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:4,
          transition:'all .3s ease', transform: open ? 'rotate(45deg)' : 'rotate(0)',
          background: open ? accent : 'transparent', color: open ? '#fff' : theme.textSecondary,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" /></svg>
        </div>
      </div>

      <div style={{ maxHeight: open ? bodyH : 0, overflow:'hidden', transition:'max-height .5s cubic-bezier(.16,1,.3,1)' }}>
        <div ref={bodyRef} style={{ padding:'0 32px 32px' }}>
          <div style={{ height:1, background:theme.border, marginBottom:24 }} />
          <p style={{ fontFamily:fp.body, fontSize:15, color:theme.textPrimary, lineHeight:1.65, marginBottom:20, maxWidth:640 }}>{project.full}</p>
          <blockquote style={{
            fontFamily:fp.display, fontStyle:'italic', fontSize:'clamp(17px,1.6vw,20px)',
            color:theme.textPrimary, lineHeight:1.5, borderLeft:`3px solid ${accent}`,
            paddingLeft:20, margin:'0 0 24px',
          }}>{project.quote}</blockquote>
          <CTA accent={accent} theme={theme} fp={fp} href={project.url} style={{ fontSize:13 }}>
            Visit project <span>→</span>
          </CTA>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  SKILLS SECTION
// ══════════════════════════════════════════════════════════
const SKILL_DATA = [
  { title:'AI & Machine Learning', skills:['LLMs & Prompt Engineering','RAG Pipelines','Vector Databases','Agentic Workflows','Semantic Search'] },
  { title:'Web Development', skills:['React / Next.js','TypeScript','Node.js','Tailwind CSS','REST & API Design'] },
  { title:'Infrastructure & Data', skills:['Python','PostgreSQL','Vercel / Cloud Deploy','Analytics & SEO','CI/CD & Git'] },
];

function SkillsSection({ theme, accent, fp }) {
  return (
    <section id="skills" style={{ background:theme.surface, padding:'100px 48px' }}>
      <div style={{ maxWidth:1320, margin:'0 auto' }}>
        <Reveal><SectionLabel text="Skills & Tools" accent={accent} fp={fp} theme={theme} /></Reveal>
        <Reveal delay={0.1}>
          <h2 style={{ fontFamily:fp.display, fontSize:'clamp(32px,4.5vw,54px)', lineHeight:1.1, color:theme.textPrimary, maxWidth:600, fontWeight:400, letterSpacing:'-0.02em', marginBottom:48 }}>
            The stack behind the shipped work.
          </h2>
        </Reveal>
        <div className="skills-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {SKILL_DATA.map((cat, i) => (
            <Reveal key={i} delay={0.15 + i * 0.1}>
              <TiltCard theme={theme} accent={accent} fp={fp} category={cat} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TiltCard({ theme, accent, fp, category }) {
  const ref = useRef(null);
  const [hov, setHov] = useState(false);

  const onMove = e => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(700px) rotateX(${y * -5}deg) rotateY(${x * 5}deg) scale(1.01)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(700px) rotateX(0) rotateY(0) scale(1)';
    setHov(false);
  };

  return (
    <div ref={ref} data-h="1"
      onMouseMove={onMove} onMouseEnter={() => setHov(true)} onMouseLeave={onLeave}
      style={{
        padding:'32px', borderRadius:14, border:`1px solid ${hov ? accent + '50' : theme.border}`,
        background:theme.bg, transition:'transform .12s ease, border-color .3s ease, box-shadow .3s ease',
        boxShadow: hov ? `0 12px 40px ${accent}10` : 'none',
      }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
        <div style={{ width:8, height:8, borderRadius:2, background:accent }} />
        <h3 style={{ fontFamily:fp.body, fontSize:13, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:theme.textPrimary }}>{category.title}</h3>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {category.skills.map((skill, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:12,
            fontFamily:fp.body, fontSize:15, color:theme.textSecondary, lineHeight:1.4,
          }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:theme.border, flexShrink:0 }} />
            {skill}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EMAILJS CONFIG ────────────────────────────────────────
// Fill in your three EmailJS values from https://dashboard.emailjs.com
const EMAILJS_PUBLIC_KEY  = 'm5LmsQGrHiaAvPfuH';   // Account > API Keys
const EMAILJS_SERVICE_ID  = 'service_dfdkfut';   // Email Services tab
const EMAILJS_TEMPLATE_ID = 'template_2sd5p8t';  // Email Templates tab
// Template variables expected: {{from_name}}, {{from_email}}, {{message}}

// ── RATE LIMITER ──────────────────────────────────────────
const RATE_KEY = 'ag_contact_sends';
const RATE_MAX = 3;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function canSubmit() {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    const sends = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const recent = sends.filter(t => now - t < RATE_WINDOW);
    if (recent.length >= RATE_MAX) return false;
    recent.push(now);
    localStorage.setItem(RATE_KEY, JSON.stringify(recent));
    return true;
  } catch { return true; }
}

// ── SANITIZE ──────────────────────────────────────────────
function sanitize(str) {
  return String(str).replace(/[<>"'&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'}[c])).trim();
}

// ══════════════════════════════════════════════════════════
//  CONTACT SECTION
// ══════════════════════════════════════════════════════════
function EmailModal({ open, onClose, accent, fp }) {
  const dark = THEMES.dark;
  const [form, setForm] = useState({ name:'', email:'', message:'' });
  const [honeypot, setHoneypot] = useState(''); // must stay empty
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error | rate
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) { setStatus('idle'); setForm({ name:'', email:'', message:'' }); setHoneypot(''); }
  }, [open]);

  // Load EmailJS SDK once
  useEffect(() => {
    if (window.emailjs) return;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = () => window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    document.head.appendChild(s);
  }, []);

  if (!open) return null;

  const inputStyle = {
    width:'100%', padding:'12px 16px', fontFamily:fp.body, fontSize:14,
    background:'rgba(255,255,255,0.06)', border:`1px solid ${dark.border}`,
    borderRadius:8, color:dark.textPrimary, outline:'none', transition:'border-color .2s ease',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypot) return; // bot caught — silently drop
    if (!canSubmit()) { setStatus('rate'); return; }
    setStatus('sending');
    try {
      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name:  sanitize(form.name),
        from_email: sanitize(form.email),
        message:    sanitize(form.message),
      });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:24, animation:'fadeIn .25s ease both',
      }}>
      <div style={{
        background:'#161614', border:`1px solid ${dark.border}`, borderRadius:16,
        padding:'40px 36px', maxWidth:480, width:'100%', position:'relative',
        animation:'scaleIn .3s cubic-bezier(.16,1,.3,1) both',
      }}>
        <button onClick={onClose} style={{
          position:'absolute', top:16, right:16, width:32, height:32, borderRadius:'50%',
          border:`1px solid ${dark.border}`, background:'transparent', color:dark.textSecondary,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all .2s ease',
        }} onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
           onMouseLeave={e => { e.currentTarget.style.borderColor = dark.border; e.currentTarget.style.color = dark.textSecondary; }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l10 10M12 2L2 12"/></svg>
        </button>

        {status === 'sent' ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:`${accent}18`, border:`2px solid ${accent}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2"><path d="M5 12l5 5L20 7"/></svg>
            </div>
            <h3 style={{ fontFamily:fp.display, fontSize:24, color:dark.textPrimary, fontWeight:400, marginBottom:8 }}>Message sent</h3>
            <p style={{ fontFamily:fp.body, fontSize:14, color:dark.textSecondary, lineHeight:1.6 }}>Thanks for reaching out — I'll get back to you soon.</p>
          </div>
        ) : (
          <React.Fragment>
            <h3 style={{ fontFamily:fp.display, fontSize:'clamp(22px,3vw,28px)', color:dark.textPrimary, fontWeight:400, letterSpacing:'-0.01em', marginBottom:6 }}>Get in touch</h3>
            <p style={{ fontFamily:fp.body, fontSize:14, color:dark.textSecondary, lineHeight:1.6, marginBottom:28 }}>Send me a message and I'll get back to you shortly.</p>

            {status === 'rate' && (
              <div style={{ fontFamily:fp.body, fontSize:13, color:'#e07070', background:'rgba(224,112,112,0.1)', border:'1px solid rgba(224,112,112,0.25)', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
                Too many submissions — please wait an hour before trying again.
              </div>
            )}
            {status === 'error' && (
              <div style={{ fontFamily:fp.body, fontSize:13, color:'#e07070', background:'rgba(224,112,112,0.1)', border:'1px solid rgba(224,112,112,0.25)', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
                Something went wrong. Please try again or reach out directly on LinkedIn.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Honeypot — hidden from humans, bots fill it in */}
              <input
                type="text" name="website" tabIndex="-1" autoComplete="off"
                value={honeypot} onChange={e => setHoneypot(e.target.value)}
                style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }}
                aria-hidden="true"
              />
              <input type="text" placeholder="Your name" required
                maxLength={100}
                value={form.name}
                onChange={e => setForm({...form, name:e.target.value})}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = dark.border}
                style={inputStyle} />
              <input type="email" placeholder="Your email" required
                maxLength={200}
                value={form.email}
                onChange={e => setForm({...form, email:e.target.value})}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = dark.border}
                style={inputStyle} />
              <textarea placeholder="Your message" required
                rows={4} maxLength={2000}
                value={form.message}
                onChange={e => setForm({...form, message:e.target.value})}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = dark.border}
                style={{...inputStyle, resize:'vertical', minHeight:100 }} />
              <button type="submit" disabled={status === 'sending'} style={{
                fontFamily:fp.body, fontSize:14, fontWeight:600, letterSpacing:'0.02em',
                padding:'14px 30px', border:'none', borderRadius:8,
                cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                background: status === 'sending' ? dark.border : accent,
                color:'#fff', transition:'all .25s ease',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                opacity: status === 'sending' ? 0.7 : 1,
              }} onMouseEnter={e => { if (status !== 'sending') { e.currentTarget.style.background = dark.textPrimary; e.currentTarget.style.color = dark.bg; }}}
                 onMouseLeave={e => { if (status !== 'sending') { e.currentTarget.style.background = accent; e.currentTarget.style.color = '#fff'; }}}>
                {status === 'sending' ? (
                  <React.Fragment>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation:'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Sending…
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
                    Send message
                  </React.Fragment>
                )}
              </button>
            </form>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

function ContactSection({ theme, accent, fp }) {
  const dark = THEMES.dark;
  const [emailOpen, setEmailOpen] = useState(false);
  return (
    <section id="contact" style={{ background:dark.bg, padding:'100px 48px' }}>
      <div style={{ maxWidth:1320, margin:'0 auto' }}>
        <Reveal>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
            <span style={{ fontFamily:fp.body, fontSize:11, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:accent }}>Contact</span>
            <span style={{ flex:1, height:1, background:dark.border }} />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 style={{ fontFamily:fp.display, fontSize:'clamp(36px,5vw,64px)', lineHeight:1.08, color:dark.textPrimary, maxWidth:750, fontWeight:400, letterSpacing:'-0.02em', marginBottom:20 }}>
            Let's build something that ships.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p style={{ fontFamily:fp.body, fontSize:'clamp(15px,1.5vw,17px)', lineHeight:1.65, color:dark.textSecondary, maxWidth:540, marginBottom:40 }}>
            I'm focused on AI engineering roles where I can design and deploy agentic workflows and models at production scale.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <CTA primary accent={accent} theme={dark} fp={fp} onClick={() => setEmailOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 8L2 4"/></svg>
              Email
            </CTA>
            <CTA accent={accent} theme={dark} fp={fp} href="https://github.com/atg25">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.4 6.84 9.76.5.09.68-.22.68-.49v-1.71c-2.78.62-3.37-1.38-3.37-1.38-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.09 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0112 6.84c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.76 0 3.96-2.34 4.83-4.57 5.08.36.32.68.94.68 1.9v2.81c0 .27.18.59.69.49A10.01 10.01 0 0022 12.26C22 6.58 17.52 2 12 2z"/></svg>
              GitHub
            </CTA>
            <CTA accent={accent} theme={dark} fp={fp} href="https://www.linkedin.com/in/andrew-gardner2026/">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.47 2H3.53A1.45 1.45 0 002 3.47v17.06A1.45 1.45 0 003.47 22h17.06A1.45 1.45 0 0022 20.53V3.47A1.45 1.45 0 0020.47 2zM8.09 18.74h-3v-9h3v9zM6.59 8.48a1.56 1.56 0 110-3.12 1.56 1.56 0 010 3.12zM18.91 18.74h-3v-4.26c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.18-1.73 2.39v4.34h-3v-9h2.88v1.23h.04a3.16 3.16 0 012.85-1.56c3.05 0 3.61 2 3.61 4.61v4.72z"/></svg>
              LinkedIn
            </CTA>
          </div>
        </Reveal>

        <EmailModal open={emailOpen} onClose={() => setEmailOpen(false)} accent={accent} fp={fp} />

        <Reveal delay={0.4} style={{ marginTop:80 }}>
          <div style={{ borderTop:`1px solid ${dark.border}`, paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:fp.body, fontSize:12, color:dark.textSecondary }}>© 2026 Andrew Gardner</span>
            <span style={{ fontFamily:fp.display, fontStyle:'italic', fontSize:18, color:dark.textSecondary, letterSpacing:'-0.02em' }}>AG</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

Object.assign(window, {
  THEMES, FONTS, useInView, Reveal, AnimCounter, ScrollProgress, CustomCursor, SectionLabel,
  Nav, CTA, HeroSection, MissionSection, ProcessSection, WorkSection, SkillsSection, ContactSection, EmailModal,
});
