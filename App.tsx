
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import {
  Menu,
  X,
  Zap,
  TrendingUp,
  LayoutGrid,
  Box,
  BarChart3,
  Plus,
  BookOpen,
  Users,
  Database,
  Rocket,
  MapPin,
  CheckCircle2,
  ArrowRight,
  CreditCard
} from 'lucide-react';

// --- Custom Bolt Logo Component inspired by the provided image ---
const BoltfyLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} filter drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="boltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff1a1a" />
        <stop offset="50%" stopColor="#b30000" />
        <stop offset="100%" stopColor="#660000" />
      </linearGradient>
    </defs>
    {/* Outline / Shadow layer */}
    <path
      d="M13,2 L4.5,14.5 L11,14.5 L9,22 L19.5,9.5 L13,9.5 L15,2 Z"
      fill="rgba(0,0,0,0.5)"
      transform="translate(0.5, 0.5)"
    />
    {/* Main Bolt with Gradient */}
    <path
      d="M13,2 L4.5,14.5 L11,14.5 L9,22 L19.5,9.5 L13,9.5 L15,2 Z"
      fill="url(#boltGradient)"
      stroke="#ff4d4d"
      strokeWidth="0.5"
    />
  </svg>
);

// --- CountUp Component for Dynamic Numbers ---

const CountUp = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return (
    <span ref={countRef}>
      {count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
};

// --- Ultra-Performance Cinematic Globe (Shaders + InstancedMesh) ---

const CinematicGlobe = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    camera.position.z = 230;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      precision: "mediump"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const updateSize = () => {
      if (!container) return;
      const size = Math.min(window.innerWidth * 0.9, 520);
      renderer.setSize(size, size);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Clear any existing canvases to prevent duplication (especially in StrictMode)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const loader = new THREE.TextureLoader();
    const mapTex = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg');

    const dotGeo = new THREE.SphereGeometry(60, 150, 150);
    const dotMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uMap: { value: mapTex },
        uColor: { value: new THREE.Color(0xff0000) },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (1.5 * (300.0 / -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          vec4 mapData = texture2D(uMap, vUv);
          if (mapData.r < 0.15) discard;
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(uColor, (1.0 - dist * 2.0) * 0.7);
        }
      `,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(dotGeo, dotMat);
    group.add(points);

    const hubCoords = [
      [-23.5, -46.6], [40.7, -74.0], [51.5, -0.1], [35.6, 139.6],
      [-33.9, -151.2], [25.2, 55.2], [-34.6, -58.3], [1.3, 103.8], [37.5, 126.9]
    ];

    const hubGeo = new THREE.SphereGeometry(1.6, 12, 12);
    const hubMat = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending });
    const hubInstances = new THREE.InstancedMesh(hubGeo, hubMat, hubCoords.length);

    const tempObj = new THREE.Object3D();
    hubCoords.forEach((coord, i) => {
      const lat = (90 - coord[0]) * (Math.PI / 180);
      const lng = (coord[1] + 180) * (Math.PI / 180);
      tempObj.position.setFromSphericalCoords(61, lat, lng);
      tempObj.updateMatrix();
      hubInstances.setMatrixAt(i, tempObj.matrix);
    });
    group.add(hubInstances);

    const arcs: any[] = [];
    const arcCount = 10;
    for (let i = 0; i < arcCount; i++) {
      const h1 = hubCoords[Math.floor(Math.random() * hubCoords.length)];
      const h2 = hubCoords[Math.floor(Math.random() * hubCoords.length)];
      const start = new THREE.Vector3().setFromSphericalCoords(61.5, (90 - h1[0]) * (Math.PI / 180), (h1[1] + 180) * (Math.PI / 180));
      const end = new THREE.Vector3().setFromSphericalCoords(61.5, (90 - h2[0]) * (Math.PI / 180), (h2[1] + 180) * (Math.PI / 180));
      const mid = new THREE.Vector3().lerpVectors(start, end, 0.5).normalize().multiplyScalar(85);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const headGeo = new THREE.SphereGeometry(1.3, 8, 8);
      const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending });
      const head = new THREE.Mesh(headGeo, headMat);
      group.add(head);
      arcs.push({
        curve,
        head,
        t: Math.random(),
        speed: 0.0015 + Math.random() * 0.003,
        geo: headGeo,
        mat: headMat
      });
    }

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      group.rotation.y += 0.002;
      arcs.forEach(arc => {
        arc.t += arc.speed;
        if (arc.t > 1) arc.t = 0;
        arc.head.position.copy(arc.curve.getPoint(arc.t));
        arc.head.material.opacity = Math.sin(arc.t * Math.PI);
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      hubGeo.dispose();
      hubMat.dispose();
      arcs.forEach(arc => {
        arc.geo.dispose();
        arc.mat.dispose();
      });
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-visible">
      <div ref={containerRef} className="relative z-10 drop-shadow-[0_0_80px_rgba(255,0,0,0.5)]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/5 blur-[140px] rounded-full -z-0"></div>
    </div>
  );
};

// --- Step Visuals ---

const Step1Visual = () => (
  <div className="relative w-full aspect-video bg-[#050505] rounded-3xl border border-red-900/30 overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 opacity-40">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute border border-red-600/20 rounded-lg"
          style={{ inset: `${i * 12}%`, transform: `perspective(500px) rotateX(20deg) translateZ(${i * 10}px)` }}
        ></div>
      ))}
    </div>
    <div className="relative z-10 bg-black/90 border border-red-600/40 px-4 py-2 rounded-xl flex items-center gap-3 backdrop-blur-md animate-pulse">
      <Database size={14} className="text-red-500" />
      <span className="text-[10px] font-mono font-bold text-red-500 tracking-wider">DATABASE_LINKED</span>
    </div>
  </div>
);

const Step2Visual = () => (
  <div className="relative w-full aspect-video bg-[#050505] rounded-3xl border border-red-900/30 overflow-hidden flex items-center justify-center">
    <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-900 rounded-full shadow-[0_0_40px_rgba(255,0,0,0.4)]"></div>
    <div className="absolute top-4 left-4 glass-card p-2 rounded-lg border-white/10">
      <div className="flex gap-1">
        <div className="w-3 h-3 bg-red-600 rounded"></div>
        <div className="w-3 h-3 bg-red-900 rounded"></div>
      </div>
    </div>
  </div>
);

const Step3Visual = () => (
  <div className="relative w-full aspect-video bg-[#080808] rounded-3xl border border-red-900/30 overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,0,0,0.1),_transparent)]"></div>
    <MapPin className="text-red-600 animate-bounce" size={32} />
    <div className="absolute bottom-4 bg-black/80 px-3 py-1 rounded-full border border-red-600/20 text-[8px] font-mono text-red-500 uppercase tracking-widest">Target: CEO real estate</div>
  </div>
);

const Step4Visual = () => (
  <div className="relative w-full aspect-video bg-[#050505] rounded-3xl border border-red-900/30 overflow-hidden flex items-center justify-center">
    <Rocket size={40} className="text-red-600 -rotate-12 hover:translate-y-[-5px] transition-transform duration-500" />
    <div className="absolute top-2 right-2 flex gap-1 items-end h-8">
      {[10, 20, 15, 30].map((h, i) => (
        <div key={i} className="w-1 bg-red-500/40 rounded-t" style={{ height: `${h}px` }}></div>
      ))}
    </div>
  </div>
);

// --- Sections ---

const DashboardContent = () => (
  <div className="h-full w-full bg-[#050505] flex flex-col p-8 text-left overflow-y-auto scrollbar-hide select-none">
    <div className="flex justify-center mb-10">
      <div className="bg-[#111] border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-6 shadow-xl">
        <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-600/20 animate-pulse">
          <BoltfyLogo className="w-4 h-4" />
        </div>
        <Plus className="w-4 h-4 text-white/40" />
        <div className="w-px h-4 bg-white/10 mx-2"></div>
        <LayoutGrid className="w-4 h-4 text-red-500" />
        <BookOpen className="w-4 h-4 text-white/40" />
        <Users className="w-4 h-4 text-white/40" />
        <Database className="w-4 h-4 text-white/40" />
      </div>
    </div>
    <div className="mb-10">
      <h3 className="text-2xl font-extrabold text-white mb-1">Painel Boltfy</h3>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]"></div>
        <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Workspace Ativo</span>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
      <div className="md:col-span-8 bg-[#0a0a0a] border border-red-900/10 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl">
        <h4 className="text-3xl font-extrabold mb-4 text-white">App Configurado</h4>
        <p className="text-white/40 text-[11px] mb-8 max-w-md leading-relaxed">Sua infraestrutura está pronta. Utilize as ferramentas de prospecção e escala para crescer.</p>
        <button className="bg-red-600 text-white px-6 py-3 rounded-2xl text-[11px] font-black flex items-center gap-2.5 shadow-xl shadow-red-600/20">
          <Box className="w-3.5 h-3.5" /> Lançar Aplicativo
        </button>
      </div>
      <div className="md:col-span-4 bg-[#0a0a0a] border border-red-900/10 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl">
        <div className="flex items-center justify-between mb-4"><span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Métricas</span><BarChart3 className="w-4 h-4 text-red-600" /></div>
        <p className="text-6xl font-black text-white mb-6">712</p>
        <div className="flex items-end gap-1.5 h-16">
          {[30, 50, 40, 70, 45, 90, 60].map((h, i) => (
            <div key={i} className={`flex-1 rounded-xl transition-all duration-500 ${i === 5 ? 'bg-red-600 shadow-[0_0_15px_rgba(255,0,0,0.4)]' : 'bg-red-900/20'}`} style={{ height: `${h}%` }}></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="fixed top-8 left-0 right-0 z-50 flex justify-center px-6">
      <nav className="w-full max-w-6xl h-[72px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-between px-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative">

        {/* Logo Section with Glow */}
        <div className="flex items-center gap-3 relative cursor-pointer group" onClick={scrollToTop}>
          <div className="absolute -left-2 w-16 h-16 bg-red-600/20 blur-2xl rounded-full -z-10 group-hover:bg-red-600/30 transition-all duration-500"></div>
          <div className="w-11 h-11 flex items-center justify-center bg-black/60 rounded-full border border-white/10 overflow-hidden shadow-[inset_0_0_15px_rgba(255,0,0,0.2)] group-hover:border-red-600/30 transition-colors">
            <BoltfyLogo className="w-7 h-7" />
          </div>
          <span className="text-xl font-bold text-white tracking-tighter group-hover:text-red-500 transition-colors">Boltfy</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-10 text-[14px] font-medium text-slate-400">
          <a href="#" onClick={scrollToTop} className="hover:text-white transition-colors">Início</a>
          <a href="#metodo" onClick={(e) => scrollToSection(e, 'metodo')} className="hover:text-white transition-colors">Como Funciona</a>
          <a href="#precos" onClick={(e) => scrollToSection(e, 'precos')} className="hover:text-white transition-colors">Planos</a>
        </div>

        {/* CTA Section */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="text-[14px] font-medium text-slate-400 hover:text-white transition-colors">Login</a>
          <button
            onClick={(e) => scrollToSection(e, 'precos')}
            className="bg-white text-black px-7 py-2.5 rounded-full text-[14px] font-bold hover:bg-slate-100 transition-all shadow-lg active:scale-95"
          >
            Assinar agora
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-[calc(100%+16px)] left-0 right-0 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-6 lg:hidden animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
            <a href="#" className="text-white font-bold text-xl" onClick={scrollToTop}>Início</a>
            <a href="#metodo" className="text-slate-400 font-bold text-xl" onClick={(e) => scrollToSection(e, 'metodo')}>Como Funciona</a>
            <a href="#precos" className="text-slate-400 font-bold text-xl" onClick={(e) => scrollToSection(e, 'precos')}>Planos</a>
            <div className="h-px bg-white/5 w-full my-2"></div>
            <div className="flex flex-col gap-4">
              <a href="#" className="text-slate-400 font-bold text-lg text-center">Login</a>
              <button onClick={(e) => scrollToSection(e, 'precos')} className="w-full bg-white text-black py-5 rounded-full font-bold text-lg shadow-xl">Assinar agora</button>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

const Hero = () => {
  const scrollToPricing = () => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="pt-48 pb-12 px-6 relative overflow-hidden bg-black">
      <div className="max-w-5xl mx-auto text-center relative z-10 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top duration-1000">
          <BoltfyLogo className="w-4 h-4" /> Ultra Performance SaaS Scaling
        </div>
        <h1 className="text-4xl md:text-7xl font-extrabold leading-[1.1] mb-8 text-white tracking-tighter">
          Crie e Escale Apps <br /> <span className="text-red-500">na Velocidade da Luz</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">A infraestrutura definitiva para transformar sua ideia em um SaaS milionário em minutos.</p>

        {/* NEW CTA BUTTONS FROM REFERENCE IMAGE */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <button
              onClick={scrollToPricing}
              className="group w-full sm:w-auto px-10 py-5 bg-gradient-to-b from-white to-slate-200 text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_14px_0_rgba(255,255,255,0.3)]"
            >
              Assinar agora <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={scrollToPricing}
              className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-medium rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-white/10 active:scale-95 backdrop-blur-sm"
            >
              <CreditCard className="w-5 h-5 text-slate-400" /> Ver planos
            </button>
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.25em] animate-pulse">
            EM QUALQUER DISPOSITIVO <span className="mx-2 text-white/10">•</span> GARANTIA DE 7 DIAS
          </p>
        </div>
      </div>

      <div className="py-12 px-6 relative overflow-hidden flex flex-col items-center text-center mt-8">
        <div className="w-full max-w-5xl relative group">
          <div className="relative z-10 p-3 bg-[#0a0a0a] rounded-t-[3rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,1)] border-t border-white/10">
            <div className="bg-black rounded-t-[2.5rem] overflow-hidden border border-white/5 aspect-[16/10] relative">
              <DashboardContent />
            </div>
          </div>
          <div className="h-7 bg-[#111] w-[106%] -ml-[3%] rounded-b-2xl relative z-20 shadow-2xl"></div>
        </div>
      </div>
    </section>
  );
};

const FourStepsSection = () => {
  const steps = [
    { step: "01", title: "Estruturação", desc: "Nossa IA gera toda a arquitetura e banco de dados do seu SaaS em segundos.", visual: <Step1Visual /> },
    { step: "02", title: "Personalização", desc: "Ajuste o visual e as funcionalidades através de um painel intuitivo 'no-code'.", visual: <Step2Visual /> },
    { step: "03", title: "Prospecção", desc: "Use o Lead Prospector integrado para encontrar seus primeiros 100 clientes.", visual: <Step3Visual /> },
    { step: "04", title: "Escala", desc: "Com infraestrutura global, seu SaaS está pronto para suportar milhões de usuários.", visual: <Step4Visual /> }
  ];

  return (
    <section id="metodo" className="py-24 px-6 bg-black relative overflow-hidden scroll-mt-32">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-red-500 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Boltfy Elite Tier</span>
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight text-white">
            Seu SaaS de Alta Performance <br />
            <span className="text-red-500">em 4 Etapas</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
          {steps.map((s, i) => (
            <div key={i} className="group flex flex-col gap-10 p-10 bg-[#070707] border border-white/5 rounded-[3.5rem] hover:border-red-600/40 transition-all shadow-2xl relative">
              <div className="absolute top-10 right-10 text-6xl font-black text-white/[0.03] group-hover:text-red-600/5 transition-colors">{s.step}</div>
              <div className="relative z-10 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-white tracking-tight group-hover:text-red-500 transition-colors">{s.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-lg max-w-md">{s.desc}</p>
                </div>
                <div className="pt-4 overflow-hidden group-hover:scale-[1.02] transition-transform duration-700 ease-out">{s.visual}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ResultsSection = () => {
  return (
    <section className="py-24 px-6 bg-black border-t border-red-900/10 overflow-visible relative">
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-1000">
          <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter">
            Nossos <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#FF0000] via-[#8B0000] to-[#FF0000] drop-shadow-[0_0_35px_rgba(255,0,0,0.6)] bg-[length:200%_200%] animate-[shimmer_4s_infinite_linear]">Resultados</span>
          </h2>
          <p className="text-slate-500 text-lg font-bold uppercase tracking-[0.3em]">Conectando Negócios em Escala Global</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="w-full lg:w-1/2 flex items-center justify-center min-h-[500px] overflow-visible">
            <CinematicGlobe />
          </div>

          <div className="flex flex-col gap-8 w-full lg:max-w-md">
            <div className="p-10 bg-[#0a0a0a] border border-red-600/10 rounded-[3rem] group relative overflow-hidden shadow-2xl hover:border-red-600/40 transition-all">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-red-600/10 rounded-[2rem] flex items-center justify-center text-[#FF0000] shadow-[0_0_30px_rgba(255,0,0,0.2)]">
                  <Box className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-6xl font-black text-white mb-1 tracking-tighter leading-none">
                    +<CountUp end={2739} />
                  </h3>
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2">SaaS desenvolvidos</p>
                </div>
              </div>
            </div>

            <div className="p-10 bg-[#0a0a0a] border border-red-600/10 rounded-[3rem] group relative overflow-hidden shadow-2xl hover:border-red-600/40 transition-all">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-red-600/10 rounded-[2rem] flex items-center justify-center text-[#FF0000] shadow-[0_0_30px_rgba(255,0,0,0.2)]">
                  <TrendingUp className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-6xl font-black text-white mb-1 tracking-tighter leading-none">
                    +<CountUp end={632} suffix="k" />
                  </h3>
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Faturamento mensal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const plans = [
    {
      name: "Plano Mensal",
      price: "149,00",
      priceSuffix: "/mês",
      description: "Ideal para começar.",
      features: ["Gerador de SaaS Premium", "Suporte exclusivo", "Prospecção Inteligente", "Aulas exclusivas"],
      footerText: "Pague à vista",
      link: "https://go.perfectpay.com.br/PPU38CQ6SK5"
    },
    {
      name: "Plano Vitalício",
      price: "299,00",
      oldPrice: "de R$ 447,00 por:",
      description: "100% Vitalício",
      popular: true,
      features: ["Gerador de SaaS Premium", "Suporte exclusivo", "Prospecção Inteligente", "Aulas exclusivas", "Acesso Vitalício", "Suporte Prioritário"],
      footerText: "Parcele em até 12x",
      link: "https://go.perfectpay.com.br/PPU38CQ6SK4"
    }
  ];

  const handleSubscribe = (link: string) => {
    if (link && link !== "#") {
      window.location.href = link;
    }
  };

  return (
    <section id="precos" className="py-24 px-6 relative border-t border-red-900/10 bg-black scroll-mt-32">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-white">Escolha o plano ideal para você</h2>
          <p className="text-slate-400 text-lg md:text-xl font-medium">Planos flexíveis para todas as necessidades</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto items-stretch">
          {plans.map((p, i) => (
            <div key={i} className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 bg-[#080808] ${p.popular ? 'border-red-600 shadow-[0_0_60px_rgba(220,38,38,0.2)] scale-[1.05] z-10' : 'border-white/5'}`}>

              {p.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-red-600 to-red-800 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-2.5 rounded-full shadow-lg border border-red-500/20">
                    MAIS VANTAJOSO
                  </span>
                </div>
              )}

              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">{p.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">{p.description}</p>

                <div className="flex flex-col items-center gap-1 min-h-[110px] justify-center">
                  {p.oldPrice && (
                    <span className="text-slate-500 text-sm font-medium line-through">
                      {p.oldPrice}
                    </span>
                  )}
                  <div className="flex items-center justify-center">
                    <span className="text-2xl font-bold text-white align-top mt-1 mr-1">R$</span>
                    <span className="text-7xl font-black text-white tracking-tighter">{p.price}</span>
                    {p.priceSuffix && (
                      <span className="text-slate-500 text-lg font-medium ml-1 self-end mb-1">{p.priceSuffix}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-grow space-y-6 mb-12 px-2">
                {p.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-4 text-[16px]">
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${p.popular ? 'text-red-500' : 'text-red-600'}`} />
                    <span className="text-slate-300 font-medium">{f}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-6 mt-auto">
                <button
                  onClick={() => handleSubscribe(p.link)}
                  className={`w-full py-6 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-500 relative group overflow-hidden ${p.popular ? 'bg-red-600 text-white shadow-[0_15px_40px_-10px_rgba(220,38,38,0.7)] scale-100 hover:scale-[1.03]' : 'bg-red-900/10 text-white border border-red-600/30 hover:bg-red-900/20'}`}
                >
                  <span className="relative z-10">Assinar agora</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                </button>
                <p className="text-center text-slate-500 text-[11px] font-bold uppercase tracking-widest opacity-70">
                  {p.footerText}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <FourStepsSection />
        <ResultsSection />
        <Pricing />
      </main>
      <footer className="py-20 px-6 border-t border-white/5 bg-black text-center text-slate-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="p-2.5 bg-black/40 rounded-full border border-white/5">
            <BoltfyLogo className="w-9 h-9" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tighter">Boltfy</span>
        </div>
        © 2024 Boltfy Software LTDA. Todos os direitos reservados.
      </footer>
    </div>
  );
}
