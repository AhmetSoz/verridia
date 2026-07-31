// ╔══════════════════════════════════════════════════════════════════════╗
// ║ VERRİDİA — BÖLÜM 1: Sessiz Talim ve Kül Rengi Anılar (TOGAN)         ║
// ║ Kitaba sadık, oynanabilir 3B. %100 prosedürel: model/doku/ses dosyası ║
// ║ YOK. Animasyonlar poz-karıştırma ile akıcı; dövüş hitstop'lu.         ║
// ╚══════════════════════════════════════════════════════════════════════╝
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const STATIK = [];   // hic hareket etmeyen gruplar — sonda tek cizime birlestirilir

// ═══════════ 1. GÜRÜLTÜ / ARAZİ ═══════════
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vn(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx*fx*(3-2*fx), v = fy*fy*(3-2*fy);
  return hash(ix,iy)*(1-u)*(1-v) + hash(ix+1,iy)*u*(1-v) + hash(ix,iy+1)*(1-u)*v + hash(ix+1,iy+1)*u*v;
}
function fbm(x, y, o = 4) { let s=0,a=.5,f=1; for(let i=0;i<o;i++){s+=a*vn(x*f,y*f);f*=2.03;a*=.5;} return s; }
const H = (x, z) => {
  const r = Math.hypot(x*.85, z);
  const d = clamp((r-48)/150, 0, 1);
  return fbm(x*.03,z*.03,3)*1.6 + (fbm(x*.006,z*.006,5)*215 + fbm(x*.022,z*.022,4)*30) * d*d;
};

// ═══════════ 2. RENDERER / SAHNE ═══════════
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.3));
renderer.setSize(innerWidth, innerHeight);
// Tonlama artik BURADA degil, grade pasinda (post zincirinin sonunda) yapiliyor.
// CustomToneMapping'i kimlik fonksiyonuna cevirip sadece pozlamayi uyguluyoruz;
// boylece bloom ve hacimsel isik GERCEK HDR degerleri gorur.
THREE.ShaderChunk.tonemapping_pars_fragment =
  THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    'vec3 CustomToneMapping( vec3 color ) { return toneMappingExposure * color; }');
renderer.toneMapping = THREE.CustomToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.info.autoReset = false;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1c2130, 0.0052);   // ağır, yakın atmosfer
const camera = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, 0.1, 4000);

// ── kenar ışığı (siluet ayrışsın)
// tum malzemelerin paylastigi zemin yuksekligi (dip camuru icin) — kare basi bir kez guncellenir
const ZEMIN_TABAN = { value: 0 };

// ═══ ISIMALIK IZGARASI (irradiance grid) ═══
// Etkileyici bulunan her karanlik sahnede DOLAYLI isik vardir. Bizde golgeler sabit
// HemisphereLight ile esit dolduruluyordu; hicbir yuzey "atesin yaninda" hissettirmiyordu.
// Cozum: obayi kaplayan 3B izgarada her mesalenin katkisi ACILISTA BIR KEZ toplanir.
// Calisma zamani maliyeti: fragment basina tek 3B doku fetch'i.
const ISI_BOY = 172, ISI_YUK = 16, ISI_N = 48, ISI_NY = 8, ISI_OLCEK = 0.55;
const isiVeri = new Uint8Array(ISI_N * ISI_NY * ISI_N * 4);
const isiDoku = new THREE.Data3DTexture(isiVeri, ISI_N, ISI_NY, ISI_N);
isiDoku.format = THREE.RGBAFormat; isiDoku.type = THREE.UnsignedByteType;
isiDoku.minFilter = isiDoku.magFilter = THREE.LinearFilter;
isiDoku.wrapS = isiDoku.wrapT = isiDoku.wrapR = THREE.ClampToEdgeWrapping;
isiDoku.needsUpdate = true;
const ISI_PAY = { isiDoku:{value:isiDoku}, isiOlcek:{value:ISI_OLCEK},
                  isiBoy:{value:ISI_BOY}, isiYuk:{value:ISI_YUK} };
const ISI_U = () => ISI_PAY;
// shader tarafi: dunya konumundan izgara okuma
const ISI_GLSL = `
  uniform sampler3D isiDoku; uniform float isiOlcek, isiBoy, isiYuk;
  vec3 isimaOku(vec3 wp){
    vec3 uvw = vec3((wp.x + isiBoy*0.5)/isiBoy, wp.y/isiYuk, (wp.z + isiBoy*0.5)/isiBoy);
    if (uvw.x < 0.0 || uvw.x > 1.0 || uvw.z < 0.0 || uvw.z > 1.0) return vec3(0.0);
    uvw.y = clamp(uvw.y, 0.0, 1.0);
    return texture(isiDoku, uvw).rgb * isiOlcek;
  }
`;
// izgarayi doldur (mesaleler kuruldıktan sonra cagrilir)
function isimaHesapla(kaynaklar){
  for (let zi=0; zi<ISI_N; zi++)
  for (let yi=0; yi<ISI_NY; yi++)
  for (let xi=0; xi<ISI_N; xi++){
    const wx = -ISI_BOY*.5 + (xi+.5)/ISI_N*ISI_BOY;
    const wz = -ISI_BOY*.5 + (zi+.5)/ISI_N*ISI_BOY;
    const wy = (yi+.5)/ISI_NY*ISI_YUK;
    let r=0, g=0, b=0;
    for (let k=0; k<kaynaklar.length; k++){
      const s = kaynaklar[k];
      const dx=wx-s.x, dy=wy-s.y, dz=wz-s.z;
      const d2 = dx*dx+dy*dy+dz*dz, d = Math.sqrt(d2);
      if (d > s.menzil) continue;
      const sn = 1 - d/s.menzil;
      const a = s.guc * sn*sn / (1.6 + d2*1.0);
      r += s.r*a; g += s.g*a; b += s.b*a;
    }
    const o = ((zi*ISI_NY + yi)*ISI_N + xi)*4;
    isiVeri[o]   = Math.min(255, r/ISI_OLCEK*255);
    isiVeri[o+1] = Math.min(255, g/ISI_OLCEK*255);
    isiVeri[o+2] = Math.min(255, b/ISI_OLCEK*255);
    isiVeri[o+3] = 255;
  }
  isiDoku.needsUpdate = true;
}
// isimayi kenar()'dan gecmeyen sade malzemelere de ekler (arazi, cim, detay yamasi)
function isimaSade(mat, guc = 1.0){
  const eskiOBC = mat.onBeforeCompile;
  mat.onBeforeCompile = s => {
    if (eskiOBC) eskiOBC(s);
    Object.assign(s.uniforms, ISI_U());
    s.uniforms.isiGuc = { value: guc };
    s.vertexShader = 'varying vec3 vIP;\n' + s.vertexShader
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 _ip = vec4(transformed,1.0);
        #ifdef USE_INSTANCING
          _ip = instanceMatrix * _ip;
        #endif
        vIP = (modelMatrix * _ip).xyz;`);
    s.uniforms.patikaSeg = PATIKA_U;
    s.fragmentShader = 'varying vec3 vIP; uniform float isiGuc;\n' + ISI_GLSL + PATIKA_GLSL + s.fragmentShader
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        gl_FragColor.rgb += isimaOku(vIP) * isiGuc * 0.55;
        // ── ASINMIS PATIKA: cignenmis toprak koyulasir ve doygunlugunu kaybeder.
        // Bir oba 'kullanilir'; bu olmadan yeni kurulmus dekor gibi okunuyor.
        { float pt = patikaMiktarG(vIP.xz);
          gl_FragColor.rgb = mix(gl_FragColor.rgb,
                                 gl_FragColor.rgb*vec3(0.60,0.54,0.45), pt*0.78); }
        // SSR MASKESI: purüz dusukse (su birikintisi) alfaya yaz.
        // Alfa kanali baska hicbir sey icin kullanilmiyor — bedava maske.
        gl_FragColor.a = clamp(1.0 - roughnessFactor*1.55, 0.0, 1.0);`);
  };
  mat.customProgramCacheKey = () => 'isimaSade' + guc;
  return mat;
}
function kenar(mat, renk = new THREE.Color(0xaebbdc), guc = .40) {
  mat.userData.kR = renk.getHexString(); mat.userData.kG = guc;
  mat.onBeforeCompile = s => {
    s.uniforms.kR = { value: renk }; s.uniforms.kG = { value: guc };
    s.uniforms.zTaban = ZEMIN_TABAN;
    Object.assign(s.uniforms, ISI_U());
    // dunya konumu ve normali: kir/asinma gradyanlari icin
    s.vertexShader = 'varying vec3 vDP; varying vec3 vDN;\n' + s.vertexShader
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 _wp = vec4(transformed, 1.0); vec3 _on = objectNormal;
        #ifdef USE_INSTANCING
          _wp = instanceMatrix * _wp; _on = mat3(instanceMatrix) * _on;
        #endif
        vDP = (modelMatrix * _wp).xyz;
        vDN = normalize(mat3(modelMatrix) * _on);`);
    s.fragmentShader = ISI_GLSL + `uniform vec3 kR; uniform float kG; uniform float zTaban;
      varying vec3 vDP; varying vec3 vDN;
      float _h3(vec3 q){ return fract(sin(dot(q, vec3(127.1,311.7,74.7)))*43758.5453); }
      float _n3(vec3 q){ vec3 i=floor(q), f=fract(q); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(_h3(i),_h3(i+vec3(1,0,0)),f.x),
                       mix(_h3(i+vec3(0,1,0)),_h3(i+vec3(1,1,0)),f.x), f.y),
                   mix(mix(_h3(i+vec3(0,0,1)),_h3(i+vec3(1,0,1)),f.x),
                       mix(_h3(i+vec3(0,1,1)),_h3(i+vec3(1,1,1)),f.x), f.y), f.z); }
      ` + s.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 _albedo = diffuseColor.rgb;`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 4.2);
        gl_FragColor.rgb += kR * fr * kG;
        // ── ASINMA: yukari bakan yuzler acilir (surtunme), asagi bakanlar kirlenir
        float _ust = clamp(vDN.y*0.5+0.5, 0.0, 1.0);
        // ── BENEKLI YIPRANMA: iki oktavli dunya-uzayi gurultusu
        // uc olcekli triplanar renk varyasyonu: gercek nesnede her olcekte renk degisir
        float _kir = _n3(vDP*2.4)*0.55 + _n3(vDP*7.3)*0.30 + _n3(vDP*19.0)*0.15;
        float _buyuk = _n3(vDP*0.55);
        // ── DIP CAMURU: zemine yakin kisimlar koyulasip doygunlugunu kaybeder
        float _dip = smoothstep(1.25, 0.04, vDP.y - zTaban);
        vec3 _c = gl_FragColor.rgb;
        _c *= mix(0.87, 1.09, _ust);
        _c *= (0.86 + 0.30*_kir);
        _c *= mix(vec3(0.94,0.97,1.04), vec3(1.06,1.01,0.92), _buyuk);   // soguk/sicak leke
        _c = mix(_c, _c*vec3(0.64,0.58,0.50), _dip*0.38);
        // ── UC OLCEKLI YUZEY DETAYI: normal haritalar ~5 m'den sonra kayboluyor,
        // uzak nesneler duz renk lekesi olarak kaliyordu. Mevcut _n3 gurultusuyle
        // (ek doku fetch'i YOK) uc olcekte kabartma; mesafeye gore agirliklandirilir,
        // boylece uzakta BUYUK olcek hayatta kalir.
        {
          float _mes = length(vViewPosition);
          float _w0 = 1.0 - smoothstep(2.0, 9.0, _mes);      // ince (0.5 m) — yakinda
          float _w1 = 1.0 - smoothstep(8.0, 28.0, _mes);     // orta (2 m)
          float _w2 = 1.0;                                   // kaba (8 m) — her mesafede
          float _e = 0.42;
          float _d0 = _n3(vDP*2.00), _d1 = _n3(vDP*0.50), _d2 = _n3(vDP*0.125);
          float _dx = (_n3((vDP+vec3(_e,0,0))*2.00)-_d0)*_w0
                    + (_n3((vDP+vec3(_e,0,0))*0.50)-_d1)*_w1*1.6
                    + (_n3((vDP+vec3(_e,0,0))*0.125)-_d2)*_w2*2.4;
          float _dz = (_n3((vDP+vec3(0,0,_e))*2.00)-_d0)*_w0
                    + (_n3((vDP+vec3(0,0,_e))*0.50)-_d1)*_w1*1.6
                    + (_n3((vDP+vec3(0,0,_e))*0.125)-_d2)*_w2*2.4;
          // kabartmayi isiga yansit: yuzey normali dogrultusunda kucuk sapma
          vec3 _L = normalize(vec3(-0.30, 0.52, -0.80));
          float _kab = (_dx*_L.x + _dz*_L.z) * 0.55;
          _c *= (1.0 + clamp(_kab, -0.34, 0.34));
          // uzakta puruz kirilmasi: yuzeyler tamamen matlasmasin
          gl_FragColor.rgb = _c;
        }
        // ── ISIMALIK: normal yonunde ofsetli ornekleme sozde-yonluluk verir
        // (mesaleye BAKAN yuz, sirtini donenden daha fazla dolayli isik alir)
        _c += isimaOku(vDP + vDN*1.5) * _albedo * 0.95;
        gl_FragColor.rgb = _c;
        gl_FragColor.a = 0.0;                      // zemin disi yuzeyler yansitmaz`);
  };
  return mat;
}
// ── PROSEDÜREL YÜZEY DOKULARI (canvas'tan üretilir; hiçbir dosya yok)
function _tuval(n){ const c=document.createElement('canvas'); c.width=c.height=n; return c; }
// yükseklik çizimi → normal haritası (+ ham yükseklik pürüz haritası olarak)
function yuzeyDoku(n, ciz, guc=2.4, tekrar=3){
  const hc=_tuval(n), hg=hc.getContext('2d'); ciz(hg,n);
  const hd=hg.getImageData(0,0,n,n).data;
  const nc=_tuval(n), ng=nc.getContext('2d'), nim=ng.createImageData(n,n);
  const at=(x,y)=>hd[((((y%n)+n)%n)*n + (((x%n)+n)%n))*4]/255;
  for(let y=0;y<n;y++) for(let x=0;x<n;x++){
    const dx=(at(x+1,y)-at(x-1,y))*guc, dy=(at(x,y+1)-at(x,y-1))*guc;
    const l=Math.hypot(dx,dy,1), o=(y*n+x)*4;
    nim.data[o]=(-dx/l*.5+.5)*255; nim.data[o+1]=(-dy/l*.5+.5)*255;
    nim.data[o+2]=(1/l*.5+.5)*255; nim.data[o+3]=255;
  }
  ng.putImageData(nim,0,0);
  const mk=c=>{ const tx=new THREE.CanvasTexture(c); tx.wrapS=tx.wrapT=THREE.RepeatWrapping;
    tx.repeat.set(tekrar,tekrar); tx.anisotropy=4; return tx; };
  return { n:mk(nc), r:mk(hc) };
}
const _cizgi=(g,x0,y0,x1,y1,s,w)=>{ g.strokeStyle=s; g.lineWidth=w;
  g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); };

// yün/keçe dokuması — çözgü + atkı + tüylenme
const D_KUMAS = yuzeyDoku(160,(g,n)=>{
  g.fillStyle='#808080'; g.fillRect(0,0,n,n);
  for(let i=0;i<n;i+=5){
    g.fillStyle='rgba(255,255,255,.20)'; g.fillRect(i,0,2,n);
    g.fillStyle='rgba(0,0,0,.20)';       g.fillRect(0,i+2,n,2);
  }
  for(let i=0;i<7000;i++){ const x=Math.random()*n,y=Math.random()*n;
    g.fillStyle=(Math.random()<.5?'rgba(255,255,255,.12)':'rgba(0,0,0,.12)');
    g.fillRect(x,y,1.5,1.5); }
},2.6,13);
// deri — gren kabarcıkları + çatlaklar
const D_DERI = yuzeyDoku(160,(g,n)=>{
  g.fillStyle='#8a8a8a'; g.fillRect(0,0,n,n);
  for(let i=0;i<240;i++){ const x=Math.random()*n,y=Math.random()*n,r=3+Math.random()*8;
    const gr=g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(255,255,255,.26)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,6.283); g.fill(); }
  for(let i=0;i<160;i++){ const x=Math.random()*n,y=Math.random()*n;
    _cizgi(g,x,y,x+(Math.random()-.5)*26,y+(Math.random()-.5)*26,'rgba(0,0,0,.30)',1); }
},2.8,7);
// ten — ince gözenek
const D_TEN = yuzeyDoku(128,(g,n)=>{
  g.fillStyle='#8c8c8c'; g.fillRect(0,0,n,n);
  for(let i=0;i<11000;i++){ const x=Math.random()*n,y=Math.random()*n;
    g.fillStyle='rgba(0,0,0,.08)'; g.fillRect(x,y,1,1); }
},1.0,7);
// kürk — yönlü tüy telleri
const D_KURK = yuzeyDoku(160,(g,n)=>{
  g.fillStyle='#707070'; g.fillRect(0,0,n,n);
  for(let i=0;i<3400;i++){ const x=Math.random()*n,y=Math.random()*n,
    a=-1.25+Math.random()*.75, l=6+Math.random()*12;
    _cizgi(g,x,y,x+Math.cos(a)*l,y+Math.sin(a)*l,
      (Math.random()<.5?'rgba(255,255,255,.24)':'rgba(15,15,15,.24)'),1.3); }
},3.2,6);
// dövme çelik — yatay taşlama izleri
const D_CELIK = yuzeyDoku(128,(g,n)=>{
  g.fillStyle='#b8b8b8'; g.fillRect(0,0,n,n);
  for(let i=0;i<3000;i++){ const y=Math.random()*n;
    _cizgi(g,0,y,n,y+(Math.random()-.5)*3,
      (Math.random()<.5?'rgba(255,255,255,.10)':'rgba(0,0,0,.12)'),1); }
},.9,2);

const MAT = (c, r=.85, m=.05, yz=null, ns=1, purR=false) => {
  const o = { color:c, roughness:r, metalness:m };
  if (yz){ o.normalMap = yz.n; o.normalScale = new THREE.Vector2(ns, ns);
           if (purR) o.roughnessMap = yz.r; }
  return kenar(new THREE.MeshStandardMaterial(o));
};

// ═══════════ 3. GÖKYÜZÜ ═══════════
// ZAMAN: 0 = derin gece · 1 = tam safak. Tek degisken her seyi birlikte surer.
const ZAMAN = { value: 0 };
const AY_YON = new THREE.Vector3(-0.30, 0.46, -0.84).normalize();
const _gy = new THREE.Vector3();
// gunes dogudan alcak acidan dogar; safakta ufkun hemen ustunde
function gunesYonu(z){ return _gy.set(0.86, lerp(-0.32, 0.155, z), 0.44).normalize(); }
const gokMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  uniforms: { t: { value: 0 }, zaman: ZAMAN, gunesYon: { value: new THREE.Vector3(0.86,-0.32,0.44).normalize() } },
  vertexShader: `varying vec3 vW; void main(){ vW=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `,
  fragmentShader: `varying vec3 vW; uniform float t, zaman; uniform vec3 gunesYon;
  float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
  float fb(vec2 p){ float s=0.,a=.5; for(int i=0;i<6;i++){s+=a*n(p);p*=2.03;a*=.5;} return s; }
  // domain-warp: gurultuyu KENDI turevine gore bukup girdapli/organik bulut sekli uretir
  float bulut(vec2 p){
    vec2 w1 = vec2(fb(p+vec2(1.7,9.2)), fb(p+vec2(8.3,2.8)));
    vec2 w2 = vec2(fb(p+4.0*w1+vec2(17.,5.2)), fb(p+4.0*w1+vec2(3.1,28.)));
    return fb(p + 4.0*w2);
  }
  void main(){
    vec3 d=normalize(vW); float y=clamp(d.y*.5+.5,0.,1.);
    float safak = clamp(zaman, 0.0, 1.0);
    float gece  = 1.0 - smoothstep(0.05, 0.62, safak);      // gece ogeleri boyle soner
    float gd    = dot(d, gunesYon);                          // gunese yakinlik
    float ufukGunes = max(0.0, gd);

    // ── UFUK GRADYANI: gece paletinden safak paletine gecer ──
    vec3 uf0 = mix(vec3(0.62,0.40,0.35), vec3(1.35,0.62,0.30), safak);   // en dip
    vec3 uf1 = mix(vec3(0.38,0.30,0.40), vec3(1.00,0.55,0.38), safak);
    vec3 uf2 = mix(vec3(0.22,0.21,0.38), vec3(0.52,0.46,0.58), safak);
    vec3 uf3 = mix(vec3(0.09,0.11,0.26), vec3(0.19,0.28,0.50), safak);   // zenit
    vec3 col = mix(uf0, uf1, smoothstep(0.0,0.11,y));
    col = mix(col, uf2, smoothstep(0.09,0.27,y));
    col = mix(col, uf3, smoothstep(0.25,0.84,y));
    // ufka yakin sicak bant; safakta gunes yonunde cok daha guclu
    col += mix(vec3(0.76,0.38,0.20)*0.62,
               vec3(1.50,0.66,0.26)*(0.35+1.35*pow(ufukGunes,2.2)), safak)
           * pow(max(0.,1.-abs(d.y)*8.),3.);

    // ── SAMANYOLU: galaktik duzlem boyunca yogun yildiz bandi (sadece gece) ──
    vec3 galaksi = normalize(vec3(0.36, 0.30, -0.88));
    float gdz = abs(dot(d, galaksi));
    float band = smoothstep(0.30, 0.015, gdz) * smoothstep(-0.05, 0.30, d.y);
    float bandDoku = bulut(vec2(atan(d.z,d.x)*1.5, d.y*3.0));
    col += vec3(0.30,0.33,0.48) * band * (0.20 + 0.80*bandDoku) * 0.60 * gece;

    // ── BULUTLAR: safakta ALTTAN aydinlanir (safagin asil gosterisi budur) ──
    float bl=bulut(vec2(atan(d.z,d.x)*2.2, d.y*6.5-t*0.004));
    vec3 bulutIsik = mix(vec3(0.08,0.06,0.11),
                         vec3(1.55,0.72,0.30)*pow(ufukGunes,1.7) + vec3(0.30,0.26,0.30), safak);
    col=mix(col, col*mix(1.28,1.05,safak) + bulutIsik,
            smoothstep(0.52,0.86,bl)*smoothstep(0.03,0.36,d.y)*0.85);
    float bl2=bulut(vec2(atan(d.z,d.x)*3.6+11., d.y*9.0-t*0.011));
    col=mix(col, col*1.14 + bulutIsik*0.45,
            smoothstep(0.60,0.90,bl2)*smoothstep(0.05,0.40,d.y)*0.5);

    // ── YILDIZLAR: titresimli, safakta soner ──
    vec2 sp=d.xz/max(0.10,abs(d.y)+0.30)*135.; vec2 ce=floor(sp);
    float dd=length(fract(sp)-vec2(h(ce+3.1),h(ce+7.7)));
    float titrek = 0.72 + 0.28*sin(t*(1.3+h(ce+1.1)*2.6) + h(ce+9.9)*6.28);
    // Samanyolu bandinda yildizlar daha sik gorunur
    float esik = mix(0.986, 0.960, band);
    col+=vec3(0.90,0.93,1.0)*smoothstep(esik,1.0,h(ce))*smoothstep(0.22,0.0,dd)*1.6*titrek
         *smoothstep(-0.02,0.24,d.y)*gece;
    // KIZIL SURU takimyildizi (kitaptan) — gece
    vec3 ks=normalize(vec3(0.70,0.20,-0.68)); float dk=max(0.,dot(d,ks));
    col+=vec3(0.68,0.09,0.14)*pow(dk,22.)*(0.22+0.85*bulut(d.xy*9.))*gece;
    col+=vec3(1.0,0.22,0.24)*smoothstep(0.975,1.0,h(ce+55.))*smoothstep(0.30,0.0,dd)*pow(dk,9.)*2.6*gece;

    // ── AY: TEK GOZ. Halesi keskin ic + yayilmis dis. Safakta soner ──
    vec3 ay=normalize(vec3(-0.30,0.46,-0.84)); float da=dot(d,ay);
    float ayG = mix(1.0, 0.25, safak);
    col+=vec3(0.42,0.47,0.74)*pow(max(0.,da),560.)*0.95*ayG;
    col+=vec3(0.30,0.34,0.56)*pow(max(0.,da),34.)*0.20*ayG;
    col+=vec3(0.20,0.24,0.42)*pow(max(0.,da),7.)*0.075*ayG;
    col=mix(col, vec3(0.90,0.92,0.99)*(0.86+0.14*n(d.xy*280.)), smoothstep(0.99920,0.99950,da)*ayG);
    col=mix(col, vec3(0.07,0.10,0.25), smoothstep(0.999730,0.999820,da)*(1.-smoothstep(0.999875,0.999925,da))*0.92*ayG);
    col=mix(col, vec3(0.02,0.02,0.05), smoothstep(0.999875,0.999925,da)*0.85*ayG);

    // ── GUNES: ufuk parlamasi + disk (HDR degerler → bloom yakalar) ──
    col += vec3(1.90,0.78,0.28) * pow(ufukGunes, 9.0) * safak * 0.85;
    col += vec3(6.0,4.2,2.6) * smoothstep(0.99955, 0.99985, gd) * safak;
    gl_FragColor=vec4(col,1.); }`
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(2200, 56, 36), gokMat));
// gökyüzü shader'ından PMREM çevre haritası: metal kılıç/toka artık gerçek yansıtıyor
const pmrem = new THREE.PMREMGenerator(renderer);
{
  const gs = new THREE.Scene();
  gs.add(new THREE.Mesh(new THREE.SphereGeometry(400, 32, 20), gokMat));
  scene.environment = pmrem.fromScene(gs, 0, 1, 800).texture;   // ilk kare icin
  scene.environmentIntensity = 0.62;
}
// ── SAHNEDEN ORTAM HARITASI: duz bir gradyan yansitmak her seyi plastik
// gosteriyordu. CubeCamera ile sahnenin kendisini yakalayip PMREM'e ceviriyoruz;
// boylece kilic ve su birikintileri GERCEK mesaleleri yansitiyor.
const kupRT = new THREE.WebGLCubeRenderTarget(192, { type: THREE.HalfFloatType });
const kupKam = new THREE.CubeCamera(.6, 700, kupRT);
let kupSayac = 0, kupEski = null;
function cevreYenile(x, y, z){
  kupKam.position.set(x, y, z);
  kupKam.update(renderer, scene);
  const yeni = pmrem.fromCubemap(kupRT.texture).texture;
  if (kupEski) kupEski.dispose();
  kupEski = yeni; scene.environment = yeni;
}

// ═══════════ 4. IŞIK ═══════════
const ayI = new THREE.DirectionalLight(0xc6d2f8, 3.9);
ayI.position.set(-90, 110, -150); ayI.castShadow = true;
ayI.shadow.mapSize.set(2048, 2048);
Object.assign(ayI.shadow.camera, { left:-34, right:34, top:34, bottom:-34, far:320 });
ayI.shadow.bias = -0.00035; ayI.shadow.normalBias = 0.014; ayI.shadow.radius = 2.2;
scene.add(ayI, ayI.target);
const ortamI = new THREE.HemisphereLight(0x5d6880, 0x413828, 0.78); scene.add(ortamI);
// yüzü karanlıkta bırakmayan yumuşak dolgu (gölge yok, ucuz)
const dolgu = new THREE.DirectionalLight(0x8e9ec6, 0.42); dolgu.position.set(80, 42, 110); scene.add(dolgu);
// karakter anahtarı: kameranın omzundan gelen, sadece yakını aydınlatan sinematik ışık
const karIsik = new THREE.PointLight(0xa8b4d6, 7.5, 9, 2.0); scene.add(karIsik);

// ═══════════ 5. ARAZİ + ÇİM ═══════════
let ISLAKLIK = null;   // su birikintisi purüz haritasi (arazi + detay yamasi paylasir)
// arazi rengi — hem ana arazi hem yakin alan detay yamasi ayni formulu kullanir
const _AR = new THREE.Color();
const _acPatika = new THREE.Color(0x4a3b2b);
const _ac1 = new THREE.Color(0x6b5c44), _ac2 = new THREE.Color(0x53483a),
      _ac3 = new THREE.Color(0x3b3128), _ac4 = new THREE.Color(0x45423f);
// ── ASINMIS PATIKALAR ──
// Bir oba 'kullanilir'. Yurtlar arasindaki gecisler cignenir: toprak koyulasir,
// sikisir, cim seyrelir. Bu olmadan oba 'yeni kurulmus dekor' gibi okunuyor.
// Oba yollari dallanir; tek polyline yetmez, SEGMENT listesi kullaniyoruz.
// Dugumler: yurtlar (-22,15) (-31,-8) (17,21) (27,-3) (-7,27) (9,-26),
// ana ocak (13,9), talim alani (-2,-9), meydan (1,2).
const PATIKA = [
  [  1,  2,  13,  9],   // meydan → ocak
  [  1,  2,  -2, -9],   // meydan → talim alani
  [  1,  2, -22, 15],   // meydan → bati yurdu
  [  1,  2,  17, 21],   // meydan → kuzeydogu yurdu
  [ 13,  9,  17, 21],   // ocak → kuzeydogu yurdu
  [-22, 15, -31, -8],   // bati yurtlari arasi
  [-22, 15,  -7, 27],
  [  1,  2,  27, -3],   // meydan → dogu yurdu
  [ -2, -9,   9,-26],   // talim → guney yurdu
];
// shader'a gonderilecek hal: vec4(ax, az, bx, bz)
const PATIKA_U = { value: PATIKA.map(q => new THREE.Vector4(q[0], q[1], q[2], q[3])) };
const PATIKA_GLSL = `
  uniform vec4 patikaSeg[${PATIKA.length}];
  float patikaMiktarG(vec2 p){
    float en = 1e9;
    for (int i = 0; i < ${PATIKA.length}; i++){
      vec2 a = patikaSeg[i].xy, b = patikaSeg[i].zw;
      vec2 ab = b - a, ap = p - a;
      float s = clamp(dot(ap,ab) / max(dot(ab,ab), 1e-6), 0.0, 1.0);
      en = min(en, length(a + ab*s - p));
    }
    return clamp(1.0 - en/2.55, 0.0, 1.0);
  }
`;
function patikaMiktar(x, z){
  let en = 1e9;
  for (let i = 0; i < PATIKA.length; i++) {
    const q = PATIKA[i];
    const dx = q[2]-q[0], dz = q[3]-q[1], L2 = dx*dx+dz*dz;
    let s = L2 > 1e-6 ? ((x-q[0])*dx + (z-q[1])*dz) / L2 : 0;
    s = s < 0 ? 0 : (s > 1 ? 1 : s);
    const px = q[0] + dx*s - x, pz = q[1] + dz*s - z;
    const d = Math.sqrt(px*px + pz*pz);
    if (d < en) en = d;
  }
  // patika genisligi ~2.2 m, kenari yumusak; hafif gurultuyle duzensizlestir
  const gen = 2.2 + fbm(x*.35, z*.35, 2)*1.1;
  return clamp(1 - en/gen, 0, 1);
}
function araziRenk(x, z, out){
  const y = H(x,z);
  const eg = Math.abs(H(x+2,z)-y) + Math.abs(H(x,z+2)-y);
  const ya = fbm(x*.03+11, z*.03-7, 3), mi = fbm(x*.5, z*.5, 2);
  const mrk = 1 - clamp(Math.hypot(x,z)/24, 0, 1);
  out.copy(_ac1).lerp(_ac2, clamp(ya*1.4-.2,0,1));
  out.lerp(_ac3, Math.max(clamp(eg*.16,0,.7), mrk*.88));
  if (eg > 5) out.lerp(_ac4, clamp((eg-5)*.12,0,.8));
  out.multiplyScalar(.40 + .24*mi);
  return out;   // patika artik shader'da (izgara cozunurlugu yetmiyordu)
}
{
  const g = new THREE.PlaneGeometry(900, 900, 200, 200); g.rotateX(-Math.PI/2);
  const P = g.attributes.position, R = new Float32Array(P.count*3);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i); P.setY(i, H(x,z));
    araziRenk(x, z, _AR);
    R[i*3]=_AR.r; R[i*3+1]=_AR.g; R[i*3+2]=_AR.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(R,3)); g.computeVertexNormals();
  window.__araziG = g;
  const zn = D_DERI.n.clone(); zn.repeat.set(300,300); zn.needsUpdate = true;
  // su birikintisi purüz haritasi: koyu bolgeler = islak = ayna gibi yansitir
  ISLAKLIK = (()=>{ const N=256, c=_tuval(N), x=c.getContext('2d');
    const im=x.createImageData(N,N);
    for(let j=0;j<N;j++) for(let i=0;i<N;i++){
      const f = fbm(i*.055, j*.055, 4) + fbm(i*.19, j*.19, 3)*.25;
      const w = clamp((f-.50)/.10, 0, 1);              // esik alti = su
      const v = (.40 + .60*w) * 255, o=(j*N+i)*4;
      im.data[o]=im.data[o+1]=im.data[o+2]=v; im.data[o+3]=255; }
    x.putImageData(im,0,0);
    const tx=new THREE.CanvasTexture(c); tx.wrapS=tx.wrapT=THREE.RepeatWrapping;
    tx.repeat.set(30,30); return tx; })();
  const m = new THREE.Mesh(g, isimaSade(new THREE.MeshStandardMaterial({vertexColors:true, roughness:1.0,
    normalMap:zn, normalScale:new THREE.Vector2(.55,.55), roughnessMap:ISLAKLIK, metalness:0,
    envMapIntensity:1.35 }), 1.15));
  m.receiveShadow = true; scene.add(m);
}
const cimMat = new THREE.MeshStandardMaterial({ color:0xffffff, side:THREE.DoubleSide, roughness:1 });
cimMat.onBeforeCompile = s => { s.uniforms.t = {value:0}; cimMat.userData.s = s;
  s.vertexShader = 'uniform float t;\nvarying float vY;\n' + s.vertexShader
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      vY=uv.y; float ph=float(gl_InstanceID)*0.61;
      float w=sin(t*1.4+ph)*0.24+sin(t*2.9+ph*1.8)*0.09;
      transformed.x+=w*pow(uv.y,1.7)*0.95; transformed.z+=w*0.42*pow(uv.y,1.7);`);
  s.fragmentShader = 'varying float vY;\n' + s.fragmentShader
    .replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb *= mix(0.30, 1.02, vY);`);
};
{
  const bg = new THREE.BufferGeometry(), v=[], uvv=[];
  const sec = [[.055,0],[.045,.4],[.028,.72],[0,1]];
  for (let i=0;i<sec.length-1;i++){ const [w0,y0]=sec[i],[w1,y1]=sec[i+1];
    v.push(-w0,y0,0, w0,y0,0, w1,y1,0); uvv.push(0,y0,1,y0,1,y1);
    v.push(-w0,y0,0, w1,y1,0, -w1,y1,0); uvv.push(0,y0,1,y1,0,y1); }
  bg.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  bg.setAttribute('uv', new THREE.Float32BufferAttribute(uvv,2)); bg.computeVertexNormals();
  const N = 24000, cim = new THREE.InstancedMesh(bg, cimMat, N);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();
  const R = new Float32Array(N*3);
  for (let i=0;i<N;i++){
    const r = 5 + Math.pow(Math.random(),.5)*185, a = Math.random()*Math.PI*2;
    const x = Math.cos(a)*r, z = Math.sin(a)*r;
    Q.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.random()*Math.PI);
    // patikada ot cignenmis: hem seyrek hem kisa
    const pt = patikaMiktar(x, z);
    if (pt > .45 && Math.random() < pt*.85) { M4.makeScale(0,0,0); cim.setMatrixAt(i, M4); continue; }
    const mrk = (Math.hypot(x,z) < 22 ? .22 : 1) * (1 - pt*.55);
    const s = (.7+Math.random()*.9)*mrk;
    M4.compose(V.set(x,H(x,z)-.05,z), Q, S.set(s*(.8+Math.random()*.5), s, s));
    cim.setMatrixAt(i, M4);
    const t = .72+Math.random()*.5, ye = Math.random()<.25;
    R[i*3]=(ye?.30:.44)*t; R[i*3+1]=(ye?.29:.38)*t; R[i*3+2]=(ye?.18:.22)*t;
  }
  cim.instanceColor = new THREE.InstancedBufferAttribute(R,3); scene.add(cim);
}

// ── YAKIN ALAN ZEMIN DETAYI ────────────────────────────────────────────────
// Ana arazi 4.5 m cozunurlukte; kameranin 5 m yakininda zemin dumduz kaliyor.
// Oyuncuyu izleyen yuksek cozunurluklu bir yama, ince tumsek/oyugu ekler.
// Kenarda detay 0'a soner ve taban yuzeyle BIREBIR ortusur → dikis gorunmez.
const DET_BOY = 28, DET_BOL = 72, DET_KILIT = 2.0;   // boy(m), bolme, kayma adimi
const detayGeo = new THREE.PlaneGeometry(DET_BOY, DET_BOY, DET_BOL, DET_BOL);
detayGeo.rotateX(-Math.PI/2);
{
  const c = new Float32Array(detayGeo.attributes.position.count*3).fill(.5);
  detayGeo.setAttribute('color', new THREE.BufferAttribute(c,3));
}
const detayZn = D_DERI.n.clone(); detayZn.repeat.set(56,56); detayZn.needsUpdate = true;
const detayMesh = new THREE.Mesh(detayGeo, isimaSade(new THREE.MeshStandardMaterial({
  vertexColors:true, roughness:1.0, metalness:0,
  normalMap:detayZn, normalScale:new THREE.Vector2(.85,.85),
  roughnessMap:ISLAKLIK, envMapIntensity:1.35,
  polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-3 }), 1.15));
detayMesh.receiveShadow = true; scene.add(detayMesh);
let detayCx = 1e9, detayCz = 1e9;
{
  // taban arazinin tam olarak kullandigi izgara (900 m / 200 bolme)
  const IZ = 900/200, IZ0 = -450;
  const kH = [], kR = [];                       // kose yukseklik/renk onbellegi
  const _c = new THREE.Color();
  function detayKur(cx, cz){
    const i0 = Math.floor((cx-DET_BOY/2-IZ0)/IZ)-1, j0 = Math.floor((cz-DET_BOY/2-IZ0)/IZ)-1;
    const say = Math.ceil(DET_BOY/IZ)+3;
    kH.length = 0; kR.length = 0;
    for (let j=0;j<say;j++) for (let i=0;i<say;i++){
      const x = IZ0+(i0+i)*IZ, z = IZ0+(j0+j)*IZ;
      kH.push(H(x,z)); araziRenk(x, z, _c); kR.push(_c.r, _c.g, _c.b);
    }
    const bil = (fx,fj,a,b,c2,d2) => a+(b-a)*fx + ((c2+(d2-c2)*fx)-(a+(b-a)*fx))*fj;
    const pa = detayGeo.attributes.position, ca = detayGeo.attributes.color;
    for (let k=0;k<pa.count;k++){
      const lx = pa.getX(k), lz = pa.getZ(k);
      const wx = cx+lx, wz = cz+lz;
      const gi = (wx-IZ0)/IZ - i0, gj = (wz-IZ0)/IZ - j0;
      const ii = Math.min(say-2, Math.max(0, Math.floor(gi))), jj = Math.min(say-2, Math.max(0, Math.floor(gj)));
      const fx = gi-ii, fj = gj-jj;
      const o00=jj*say+ii, o10=o00+1, o01=o00+say, o11=o01+1;
      const yTaban = bil(fx,fj,kH[o00],kH[o10],kH[o01],kH[o11]);
      // kenara dogru sonen ince kabartma
      const rr = Math.max(Math.abs(lx),Math.abs(lz))/(DET_BOY*.5);
      const sn = clamp(1-rr*rr*rr, 0, 1);
      const ince = (fbm(wx*.85+31, wz*.85-17, 3)-.5)*.135 + (fbm(wx*3.3, wz*3.3, 2)-.5)*.048;
      pa.setY(k, yTaban + ince*sn);
      for (let q=0;q<3;q++)
        ca.setXYZ(k,
          bil(fx,fj,kR[o00*3],kR[o10*3],kR[o01*3],kR[o11*3]),
          bil(fx,fj,kR[o00*3+1],kR[o10*3+1],kR[o01*3+1],kR[o11*3+1]),
          bil(fx,fj,kR[o00*3+2],kR[o10*3+2],kR[o01*3+2],kR[o11*3+2]));
    }
    pa.needsUpdate = true; ca.needsUpdate = true;
    detayGeo.computeVertexNormals(); detayGeo.computeBoundingSphere();
    detayMesh.position.set(cx, 0, cz);
  }
  window.__detayKur = detayKur;
}

// ═══════════ 6. SES (WebAudio sentez — dosya yok) ═══════════
let AC = null, ustGain = null, ruzgarG = null;
function sesBaslat() {
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  ustGain = AC.createGain(); ustGain.gain.value = .55; ustGain.connect(AC.destination);
  // rüzgâr: filtrelenmiş gürültü
  const buf = AC.createBuffer(1, AC.sampleRate*3, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1)*.6;
  const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420; f.Q.value=.6;
  ruzgarG = AC.createGain(); ruzgarG.gain.value = .085;
  src.connect(f); f.connect(ruzgarG); ruzgarG.connect(ustGain); src.start();
}
function gurultu(sure, tip, frek, Q, g0, g1) {
  if (!AC) return;
  const n = Math.max(1, Math.floor(AC.sampleRate*sure));
  const buf = AC.createBuffer(1, n, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i=0;i<n;i++) d[i] = (Math.random()*2-1);
  const src = AC.createBufferSource(); src.buffer = buf;
  const f = AC.createBiquadFilter(); f.type = tip; f.Q.value = Q;
  f.frequency.setValueAtTime(frek[0], AC.currentTime);
  f.frequency.exponentialRampToValueAtTime(frek[1], AC.currentTime+sure);
  const g = AC.createGain();
  g.gain.setValueAtTime(g0, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(Math.max(.0001,g1), AC.currentTime+sure);
  src.connect(f); f.connect(g); g.connect(ustGain); src.start();
}
function ton(frek, sure, tip, gain, bitis) {
  if (!AC) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = tip; o.frequency.setValueAtTime(frek, AC.currentTime);
  if (bitis) o.frequency.exponentialRampToValueAtTime(bitis, AC.currentTime+sure);
  g.gain.setValueAtTime(gain, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime+sure);
  o.connect(g); g.connect(ustGain); o.start(); o.stop(AC.currentTime+sure+.02);
}
const S = {
  islik: () => gurultu(.20,'bandpass',[2600,700],2.2,.30,.001),
  celik: () => { ton(2450,.28,'square',.10,1500); ton(3260,.22,'square',.07,2100);
                 gurultu(.16,'highpass',[3000,1200],1.2,.22,.001); },
  darbe: () => { ton(150,.16,'sine',.34,60); gurultu(.14,'lowpass',[900,180],1,.26,.001); },
  tahta: () => { ton(320,.13,'triangle',.22,140); gurultu(.11,'bandpass',[1400,500],1.6,.20,.001); },
  adim:  () => gurultu(.075,'lowpass',[700,240],.9,.11,.001),
  dusme: () => { ton(90,.30,'sine',.40,40); gurultu(.26,'lowpass',[500,110],.8,.28,.001); },
  parry: () => { ton(3000,.34,'square',.13,1900); ton(4300,.26,'sine',.08,2600);
                 gurultu(.20,'highpass',[4200,1600],1.4,.24,.001); },
};

// ═══════════ 7. İNSAN — poz karıştırmalı eklemli karakter ═══════════
// uzuv: kas şişkinlikli, uçları yuvarlatılmış lathe — silindir tabutluğu yok
function uzuv(r0,r1,h,c,seg=14,yz=null,kas=.10,ns=1){
  const pts=[], N=16;
  for(let i=0;i<=N;i++){
    const u=i/N;
    let r = lerp(r0,r1,u) * (1 + Math.sin(u*Math.PI)*kas);
    const uc = Math.min(u, 1-u) / .07;                 // uçlarda küreselleştir
    if (uc < 1) r *= Math.sqrt(Math.max(.02, 1-(1-uc)*(1-uc)));
    pts.push(new THREE.Vector2(Math.max(.006,r), -u*h));
  }
  return new THREE.Mesh(new THREE.LatheGeometry(pts, seg), MAT(c,.9,.04,yz,ns));
}
function kure(r,c,sx=1,sy=1,sz=1,yz=null,ns=1){
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,18,14), MAT(c,.88,.04,yz,ns));
  m.scale.set(sx,sy,sz); return m; }

// ── el: avuç + parmak topağı + başparmak (kavrama duruşunda)
function elYap(R, y){
  const g = new THREE.Group();
  const av = new THREE.Mesh(new THREE.SphereGeometry(.052,12,10), MAT(R.ten,.78,.03,D_TEN,.8));
  av.scale.set(.85,1.15,1.25); g.add(av);
  const pm = new THREE.Mesh(new THREE.CapsuleGeometry(.026,.052,4,8), MAT(R.ten,.78,.03,D_TEN,.8));
  pm.rotation.x = 1.35; pm.position.set(0,-.036,.028); g.add(pm);
  const bp = new THREE.Mesh(new THREE.CapsuleGeometry(.019,.040,4,8), MAT(R.ten,.78,.03,D_TEN,.8));
  bp.rotation.set(1.05,0,-.55*y); bp.position.set(.030*y,-.014,.026); g.add(bp);
  const bl = new THREE.Mesh(new THREE.TorusGeometry(.050,.012,5,12), MAT(R.deri||R.kemer,.92,.06,D_DERI,1));
  bl.rotation.x = Math.PI/2; bl.position.y = .046; bl.scale.set(1,1,.82); g.add(bl);  // bilek sargısı
  return g;
}
// ── çizme: taban + burun + konç + bağ
function cizmeYap(R){
  const g = new THREE.Group();
  const kn = uzuv(.098,.082,.20,R.cizme,12,D_DERI,.06,1.1); kn.position.y=.0; g.add(kn);
  const ay = new THREE.Mesh(new THREE.SphereGeometry(.088,14,10), MAT(R.cizme,.92,.05,D_DERI,1.1));
  ay.scale.set(.72,.62,1.42); ay.position.set(0,-.215,.052); g.add(ay);
  const tb = new THREE.Mesh(new THREE.BoxGeometry(.116,.030,.250), MAT(0x241a10,.98,.02,D_DERI,1.3));
  tb.position.set(0,-.256,.048); g.add(tb);
  const bg = new THREE.Mesh(new THREE.TorusGeometry(.088,.011,5,12), MAT(0x3a2a18,.95,.03,D_DERI,1));
  bg.rotation.x=Math.PI/2; bg.position.y=-.055; bg.scale.set(1,1,.9); g.add(bg);
  return g;
}
function palaGeo(){
  const s = new THREE.Shape(); s.moveTo(0,0);
  s.bezierCurveTo(.075,.30,.085,.62,.050,.93); s.lineTo(.020,1.00);
  s.bezierCurveTo(.005,.70,-.010,.38,-.028,0); s.closePath();
  const g = new THREE.ExtrudeGeometry(s,{depth:.022,bevelEnabled:true,bevelThickness:.006,
    bevelSize:.006,bevelSegments:1,curveSegments:6}); g.translate(0,0,-.011); return g;
}
// ═══════════ LAMEL ZIRH SISTEMI ═══════════
// Bozkir zirhi yuzlerce kucuk plakadan orulur — tekrar eden geometrik oge,
// yani prosedurel uretimin EN IYI oldugu sey. Tek plaka geometrisi,
// InstancedMesh ile yuzlerce kez, her biri hafif farkli tonda yerlestirilir.
function plakaGeo(w, h, kal, bel){
  const g = new THREE.BoxGeometry(w, h, kal, 4, 3, 1);
  const pa = g.attributes.position;
  for (let i=0;i<pa.count;i++){
    const x=pa.getX(i), y=pa.getY(i), z=pa.getZ(i);
    const kx = 1 - Math.pow(Math.abs(x)/(w*.5), 2);        // yatayda bombe
    const ky = 1 - Math.pow(Math.abs(y)/(h*.5), 3);        // dikeyde hafif
    pa.setZ(i, z + kx*ky*bel*(z>0 ? 1 : .30));
    // ust kenar hafif daralir → plakalar birbirine binerken kilitlenir
    if (y > 0) pa.setX(i, x*(1 - (y/(h*.5))*.10));
  }
  g.computeVertexNormals();
  return g;
}
const _lM=new THREE.Matrix4(), _lQ=new THREE.Quaternion(), _lE=new THREE.Euler(),
      _lP=new THREE.Vector3(), _lS=new THREE.Vector3(), _lC=new THREE.Color();
// o: {satir,adet,y0,y1,r0,r1,w,h,kal,bel,ac0,ac1,egim,zOl,ton}
function lamelKusak(grup, mat, o){
  const say = o.satir * o.adet;
  const im = new THREE.InstancedMesh(
    plakaGeo(o.w, o.h, o.kal||.0085, o.bel||.010), mat, say);
  let k = 0;
  for (let s=0;s<o.satir;s++){
    const ts = o.satir===1 ? 0 : s/(o.satir-1);
    const y = lerp(o.y0, o.y1, ts), r = lerp(o.r0, o.r1, ts);
    const kay = (s % 2) * .5;                               // satirlar sasirtmali dizilir
    for (let i=0;i<o.adet;i++){
      const a = lerp(o.ac0, o.ac1, (i + kay) / o.adet);
      const j = hash(s*7.13 + i*1.7, i*3.31 + s*2.9) - .5;  // el isi duzensizligi
      _lP.set(Math.sin(a)*r, y + j*o.h*.07, Math.cos(a)*r*(o.zOl||1));
      _lE.set((o.egim||0) + j*.07, a, j*.09, 'YXZ');
      _lQ.setFromEuler(_lE);
      _lS.setScalar(.94 + hash(i*1.77, s*2.31)*.13);
      im.setMatrixAt(k, _lM.compose(_lP,_lQ,_lS));
      const v = (o.ton||.80) + hash(i*5.51, s*1.13)*.40;    // plakadan plakaya ton farki
      im.setColorAt(k, _lC.setRGB(v, v*.982, v*.945));
      k++;
    }
  }
  im.castShadow = im.receiveShadow = true;
  if (o.omurga) im.userData.omurga = o.omurga;
  grup.add(im); return im;
}
// duz seritli zirh (kolcak/dizlik): metal cubuklar deri uzerine perclenmis
function seritZirh(grup, mat, o){
  const im = new THREE.InstancedMesh(plakaGeo(o.w, o.h, .007, .008), mat, o.adet);
  for (let i=0;i<o.adet;i++){
    const a = lerp(o.ac0, o.ac1, o.adet===1?0:i/(o.adet-1));
    const j = hash(i*3.7, i*1.3)-.5;
    _lP.set(Math.sin(a)*o.r, o.y, Math.cos(a)*o.r*(o.zOl||1));
    _lE.set(0, a, j*.03, 'YXZ'); _lQ.setFromEuler(_lE);
    _lS.setScalar(.96 + hash(i*2.1,i*4.4)*.08);
    im.setMatrixAt(i, _lM.compose(_lP,_lQ,_lS));
    const v = (o.ton||.82) + hash(i*6.1, i*2.2)*.34;
    im.setColorAt(i, _lC.setRGB(v, v*.982, v*.945));
  }
  im.castShadow = true; grup.add(im); return im;
}

// kılıç izi
class Iz {
  constructor(n=16, renk=0xe6ecff){
    this.n=n; this.uc=[]; this.dip=[];
    const g=new THREE.BufferGeometry();
    this.p=new Float32Array(n*2*3); this.a=new Float32Array(n*2);
    g.setAttribute('position',new THREE.BufferAttribute(this.p,3));
    g.setAttribute('aA',new THREE.BufferAttribute(this.a,1));
    const idx=[]; for(let i=0;i<n-1;i++){const q=i*2; idx.push(q,q+1,q+2,q+1,q+3,q+2);} g.setIndex(idx);
    this.mesh=new THREE.Mesh(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,
      side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
      uniforms:{renk:{value:new THREE.Color(renk)}},
      vertexShader:`attribute float aA; varying float v; void main(){v=aA;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform vec3 renk; varying float v;
        void main(){ if(v<=0.004) discard; gl_FragColor=vec4(renk,v*0.22); }`}));
    this.mesh.frustumCulled=false; scene.add(this.mesh);
  }
  ekle(u,d){ this.uc.unshift(u.clone()); this.dip.unshift(d.clone());
    if(this.uc.length>this.n){this.uc.pop();this.dip.pop();} this.yaz(); }
  bosalt(){ this.uc.length=0; this.dip.length=0; this.yaz(); }
  yaz(){ for(let i=0;i<this.n;i++){ const u=this.uc[i], d=this.dip[i], o=i*6;
      const al = u ? Math.pow(1-i/this.n,2.6) : 0;
      if(u){ this.p[o]=u.x;this.p[o+1]=u.y;this.p[o+2]=u.z;
             this.p[o+3]=d.x;this.p[o+4]=d.y;this.p[o+5]=d.z; }
      this.a[i*2]=al; this.a[i*2+1]=al*.22; }
    this.mesh.geometry.attributes.position.needsUpdate=true;
    this.mesh.geometry.attributes.aA.needsUpdate=true; }
}

// kilX: kılıcın el içindeki açısı. PI = bıçak AŞAĞI (kolun devamı). Dinlenmede 2.62 (aşağı-öne).
const SIFIR = { blU:0, blA:0, brU:0, brA:0, blF:0, brF:0, klU:0, klZ:0, klA:0, krU:0, krZ:0, krA:0,
  govX:0, govY:0, govZ:0, pelX:0, pelY:.95, pelR:0, basX:0, basY:0, kilX:2.62, kilZ:0, egim:0, egimY:0 };

// ── SAVURMA EGRISI: dort evre. Her eklem bunu KENDI GECIKMESIYLE okur;
// kalca once, bicak en son doruga cikar → guc kalcadan bilege akar (kinetik zincir).
function savurmaEgrisi(x){
  if (x <= 0 || x >= 1) return 0;
  if (x < .30){ const k=x/.30;        return -.62*(1-Math.pow(1-k,2.2)); }        // yuklen
  if (x < .46){ const k=(x-.30)/.16;  return -.62 + 1.47*(k*k*(3-2*k)); }         // kes
  if (x < .62){ const k=(x-.46)/.16;  return .85 + .20*Math.sin(k*Math.PI); }     // asim
  { const k=(x-.62)/.38;              return 1.05*(1-(k*k*(3-2*k))); }            // toparla
}
// agir vurus: daha uzun yuklenme, daha sert inis
function agirEgrisi(x){
  if (x <= 0 || x >= 1) return 0;
  if (x < .40){ const k=x/.40;        return -1.00*(1-Math.pow(1-k,2.6)); }
  if (x < .56){ const k=(x-.40)/.16;  return -1.00 + 2.15*(k*k*(3-2*k)); }
  if (x < .72){ const k=(x-.56)/.16;  return 1.15 - .12*Math.sin(k*Math.PI); }
  { const k=(x-.72)/.28;              return 1.15*(1-(k*k*(3-2*k))); }
}

// Sadece UST bedeni kullanan eylemler: bunlar oynarken bacaklar yurumeye devam eder.
// takla/devril/kalk/olum tum bedeni kullanir, listede yok.
const UST_EYLEM = { hafif1:1, hafif2:1, hafif3:1, saplama:1, agir:1,
                    riposte:1, blok:1, blokDarbe:1, parry:1, hasar:1 };
const ALT_KANAL = ['blU','brU','blA','brA','blF','brF','pelY','pelX'];

class Insan {
  constructor(R, izRenk) {
    this.R = R;
    this.kok = new THREE.Group();
    this.zeminG = new THREE.Group(); this.kok.add(this.zeminG);     // arazi egimi
    this.egimG = new THREE.Group(); this.zeminG.add(this.egimG);    // takla icin
    this.pelvis = new THREE.Group(); this.pelvis.position.y=.95; this.egimG.add(this.pelvis);
    const _kalca = kure(.175,R.kemer,1.14,.72,.88,D_DERI,.9); _kalca.position.y = -.02; this.pelvis.add(_kalca);

    // ── GÖVDE: göğüs kafesi + omuz kuşağı + kürk yaka + kemer + kaftan eteği
    this.govde = new THREE.Group(); this.pelvis.add(this.govde);
    const gg = uzuv(.215,.170,.58,R.kaftan,18,D_KUMAS,.05,2.4); gg.position.y=.58; gg.scale.z=.78; this.govde.add(gg);
    const gk = kure(.196,R.kaftan,1.08,.92,.76,D_KUMAS,2.4); gk.position.y=.415; this.govde.add(gk);  // göğüs kafesi
    const om = kure(.205,R.kaftan,1.36,.62,.86,D_KUMAS,2.4); om.position.y=.535; this.govde.add(om);   // omuz kuşağı
    // kaftan ön kapağı (üstü birbirine binen kesim)
    const kp = new THREE.Mesh(new THREE.CylinderGeometry(.222,.196,.50,20,1,true,-1.15,2.30),
      MAT(R.kaftanAlt||R.kaftan,1.0,.03,D_KUMAS,2.4,true));
    kp.material.side=THREE.DoubleSide; kp.position.y=.34; kp.scale.set(.92,1,.80); kp.rotation.y=.20; this.govde.add(kp);
    const yk = new THREE.Mesh(new THREE.TorusGeometry(.132,.042,8,20), MAT(R.kurk,1,.02,D_KURK,1.8));
    yk.rotation.x=Math.PI/2; yk.position.y=.625; yk.scale.set(1.18,1.0,.92); this.govde.add(yk);
    const km = new THREE.Mesh(new THREE.TorusGeometry(.190,.033,7,20), MAT(R.kemer,.72,.20,D_DERI,1.1));
    km.rotation.x=Math.PI/2; km.position.y=.06; km.scale.set(1,1,.80); this.govde.add(km);
    const tk = new THREE.Mesh(new THREE.BoxGeometry(.072,.062,.028), MAT(R.altin,.42,.86,D_CELIK,.6,true));
    tk.position.set(0,.06,.163); this.govde.add(tk);                                        // toka
    // ═══ LAMEL GOGUSLUK ═══ 7 satir x 18 plaka, her satir alttakini orter
    { const zm = MAT(R.zirh, .52, .80, D_CELIK, .58, true);
      const zk = MAT(R.zirhKoyu, .64, .64, D_CELIK, .68, true);
      // deri astar: lamel plakalar buna baglanir; kalan bosluklardan DELIK degil deri gorunur
      { const as=new THREE.Mesh(new THREE.CylinderGeometry(.244,.190,.44,22,1,true),
          MAT(R.deri||0x3d2f1e,.96,.05,D_DERI,1.3));
        as.material.side=THREE.DoubleSide; as.position.y=.310; as.scale.z=.86; this.govde.add(as); }
      this.zirhKusak = lamelKusak(this.govde, zm, { satir:8, adet:28, y0:.112, y1:.508,
        omurga:'gogus',
        r0:.196, r1:.252, w:.060, h:.094, kal:.009, bel:.013,
        ac0:0, ac1:Math.PI*2, egim:-.11, zOl:.86, ton:.80 });
      // eteklik: belden uyluga sarkan uzun plakalar
      if (R.eteklik) {
        const as2=new THREE.Mesh(new THREE.CylinderGeometry(.204,.236,.20,22,1,true),
          MAT(R.deri||0x3d2f1e,.96,.05,D_DERI,1.3));
        as2.material.side=THREE.DoubleSide; as2.position.y=-.020; as2.scale.z=.88; this.govde.add(as2);
        lamelKusak(this.govde, zk, { satir:2, adet:26, y0:.050, y1:-.090,
          omurga:'bel',
          r0:.212, r1:.244, w:.056, h:.104, kal:.008, bel:.011,
          ac0:0, ac1:Math.PI*2, egim:.05, zOl:.88, ton:.72 });
      }
      // gogus aynasi: dovme disk — silueti tasiyan tek parlak nokta
      if (R.ayna) {
        const ay2 = new THREE.Mesh(new THREE.SphereGeometry(.088,20,14,0,Math.PI*2,0,Math.PI*.42), zm);
        ay2.scale.set(1,.55,1); ay2.rotation.x = Math.PI/2; ay2.position.set(0,.345,.208);
        ay2.castShadow = true; this.govde.add(ay2);
        const cr2 = new THREE.Mesh(new THREE.TorusGeometry(.088,.011,7,22), zk);
        cr2.position.set(0,.345,.203); this.govde.add(cr2);
      }
      // kemer: belin uzerinde gorunur kusak — silueti ikiye boler
      { const kb4=new THREE.Mesh(new THREE.CylinderGeometry(.202,.198,.075,22,1,false),
          MAT(R.deri||R.kemer,.90,.10,D_DERI,1.3));
        kb4.position.y=.088; kb4.scale.z=.87; kb4.castShadow=true; this.govde.add(kb4);
        for(let i=0;i<10;i++){ const a=i/10*6.28;
          const pl=new THREE.Mesh(new THREE.BoxGeometry(.036,.048,.010),
            MAT(R.zirh,.52,.80,D_CELIK,.58,true));
          pl.position.set(Math.sin(a)*.206, .088, Math.cos(a)*.206*.87);
          pl.rotation.y=a; this.govde.add(pl); } }
      // omuz-boyun koruma halkasi (gorget)
      const gg2 = new THREE.Mesh(new THREE.TorusGeometry(.152,.026,7,22), zk);
      gg2.rotation.x = Math.PI/2; gg2.position.y = .565; gg2.scale.set(1.14,1,.94);
      gg2.castShadow = true; this.govde.add(gg2);
    }
    this.etek = new THREE.Mesh(new THREE.CylinderGeometry(.198,.278,.54,20,4,true), MAT(R.kaftan,1.0,.03,D_KUMAS,2.6,true));
    this.etek.material.side=THREE.DoubleSide; this.etek.position.y=-.21; this.etek.scale.z=.86;
    { const pg=this.etek.geometry.attributes.position;
    for(let i=0;i<pg.count;i++){ const x=pg.getX(i), y=pg.getY(i), z=pg.getZ(i);
      const a=Math.atan2(z,x), r=Math.hypot(x,z);
      const k=1+Math.sin(a*10)*.085*clamp((y+.27)/.54,0,1);
      pg.setX(i,Math.cos(a)*r*k); pg.setZ(i,Math.sin(a)*r*k); }
    this.etek.geometry.computeVertexNormals(); }
  this.etek.userData.hareketli = true; this.govde.add(this.etek);

    // ── BAŞ: kafatası + çene + kaş kemeri + göz + burun + saç + arkada örgü
    this.bas = new THREE.Group(); this.bas.position.y=.72; this.govde.add(this.bas);
    const kf = kure(.126,R.ten,1,1.12,1.04,D_TEN,.7); kf.position.y=.115; this.bas.add(kf);
    const cn = kure(.090,R.ten,.92,.84,1.04,D_TEN,.7); cn.position.set(0,.040,.028); this.bas.add(cn);
    const bo = uzuv(.058,.070,.16,R.ten,12,D_TEN,.05,.7); bo.position.y=.05; this.bas.add(bo);
    const ky = new THREE.Mesh(new THREE.BoxGeometry(.126,.024,.034), MAT(R.ten,.80,.02,D_TEN,.7));
    ky.position.set(0,.146,.094); ky.rotation.x=-.16; this.bas.add(ky);                     // kaş kemeri
    for (const s of [-1,1]) {
      const gz = new THREE.Mesh(new THREE.SphereGeometry(.0215,12,10),
        new THREE.MeshStandardMaterial({color:0xcfc6ba, roughness:.16, metalness:0}));
      gz.position.set(.046*s,.115,.101); this.bas.add(gz);
      const bb = new THREE.Mesh(new THREE.SphereGeometry(.0105,10,8),
        new THREE.MeshStandardMaterial({color:0x2a1a10, roughness:.10, metalness:0}));
      bb.position.set(.048*s,.114,.117); this.bas.add(bb);
      const gk2 = new THREE.Mesh(new THREE.SphereGeometry(.0245,10,8), MAT(R.ten,.80,.02,D_TEN,.7));
      gk2.scale.set(1,.52,1); gk2.position.set(.046*s,.128,.098); this.bas.add(gk2);
      gk2.userData.hareketli = true; (this.kapak = this.kapak || []).push(gk2);                                    // ust goz kapagi
      const kas = new THREE.Mesh(new THREE.BoxGeometry(.052,.014,.020), MAT(R.sac,.95,.02));
      kas.position.set(.047*s,.150,.106); kas.rotation.z=-.13*s; this.bas.add(kas);
    }
    const br = new THREE.Mesh(new THREE.ConeGeometry(.030,.070,6), MAT(R.ten,.80,.02,D_TEN,.7));
    br.rotation.x=1.72; br.position.set(0,.090,.114); this.bas.add(br);                     // burun
    const az = new THREE.Mesh(new THREE.BoxGeometry(.056,.010,.014), MAT(0x6d4238,.85,.02));
    az.position.set(0,.040,.104); this.bas.add(az);                                          // ağız çizgisi
    const sc = kure(.137,R.sac,.94,.62,.96,D_KURK,1.0); sc.position.set(0,.150,-.020); this.bas.add(sc);
    // (sac tutamlari migferin altinda kaldi — yerine arkada orgu kaldi)
    // ═══ MIGFER (sisak) ═══ konik kubbe, dikey kaburgalar, percinli alin kusagi,
    // burunluk ve lamel boyunluk. Gozler kusakla boyunluk arasindaki yarikta,
    // daima golgede kalir → yuz hicbir zaman okunmaz, siluet karakteri tasir.
    {
      const mm = MAT(R.zirh, .44, .86, D_CELIK, .58, true);      // parlak dovme celik
      const km = MAT(R.zirhKoyu, .66, .62, D_CELIK, .70, true);  // kararmis demir
      const RIM = .150, TEPE = .318, RTB = .152;                 // kusak / tepe / taban yaricapi
      const profil = u => Math.max(.004, RTB*Math.pow(1-u,.72)*(1+Math.sin(u*Math.PI)*.13));
      // kubbe
      { const pts=[]; for(let i=0;i<=16;i++){ const u=i/16;
          pts.push(new THREE.Vector2(profil(u), RIM + u*(TEPE-RIM))); }
        const kub = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mm);
        this.bas.add(kub); }
      // 6 dikey kaburga (segmentli migfer yapisi)
      for (let i=0;i<6;i++){ const a=i/6*Math.PI*2;
        const pts=[]; for(let j=0;j<=12;j++){ const u=j/12;
          pts.push(new THREE.Vector2(profil(u)+.0075, RIM + u*(TEPE-RIM))); }
        const kb3 = new THREE.Mesh(new THREE.LatheGeometry(pts, 4, a-.085, .17), km);
        kb3.material.side = THREE.DoubleSide; this.bas.add(kb3); }
      // alin kusagi + percinler
      const ak = new THREE.Mesh(new THREE.TorusGeometry(RTB+.006,.0165,8,26), km);
      ak.rotation.x = Math.PI/2; ak.position.y = RIM; this.bas.add(ak);
      { const pim = new THREE.InstancedMesh(new THREE.SphereGeometry(.0088,7,6), mm, 18);
        for(let i=0;i<18;i++){ const a=i/18*Math.PI*2;
          _lP.set(Math.sin(a)*(RTB+.020), RIM, Math.cos(a)*(RTB+.020));
          _lE.set(0,a,0,'YXZ'); _lQ.setFromEuler(_lE); _lS.set(1,1,.75);
          pim.setMatrixAt(i, _lM.compose(_lP,_lQ,_lS)); }
        pim.castShadow = true; this.bas.add(pim); }
      // tepelik: kucuk kure + mizrak ucu (+ komutan tugu)
      { const tk = new THREE.Mesh(new THREE.SphereGeometry(.019,10,8), mm);
        tk.position.y = TEPE - .004; this.bas.add(tk);
        const uc = new THREE.Mesh(new THREE.ConeGeometry(.011,.062,7), mm);
        uc.position.y = TEPE + .030; this.bas.add(uc);
        if (R.tug) for(let i=0;i<11;i++){                        // at kili tugu
          const a=i/11*6.28, tl = uzuv(.0055,.0018,.155,R.tugRenk||0x2a231c,4,D_KURK,.06,1.4);
          tl.position.set(Math.sin(a)*.016, TEPE+.052, Math.cos(a)*.016);
          tl.rotation.set(Math.sin(a)*.55, 0, -Math.cos(a)*.55); this.bas.add(tl); } }
      // burunluk: alin kusagindan burun uzerine inen serit
      { const bg = new THREE.BoxGeometry(.030,.150,.011,1,4,1), pa=bg.attributes.position;
        for(let i=0;i<pa.count;i++){ const y=pa.getY(i);
          pa.setZ(i, pa.getZ(i) + (1-Math.pow(y/.075,2))*.010);
          pa.setX(i, pa.getX(i)*(y < -.03 ? 1.35 : 1)); }
        bg.computeVertexNormals();
        const bn = new THREE.Mesh(bg, km);
        bn.position.set(0,.086,.146); bn.rotation.x = .12; this.bas.add(bn); }
      // boyunluk (lamel): kusagin altindan omuza dogru iner, agzi ve ceneyi orter
      { const ab=new THREE.Mesh(new THREE.CylinderGeometry(.144,.166,.180,20,1,true),
          MAT(0x241d16,.98,.04,D_DERI,1.2));
        ab.material.side=THREE.DoubleSide; ab.position.y=.004; this.bas.add(ab); }
      lamelKusak(this.bas, km, { satir:4, adet:32, y0:.090, y1:-.082,
        r0:.150, r1:.172, w:.029, h:.040, kal:.006, bel:.007,
        ac0:0, ac1:Math.PI*2, egim:-.16, zOl:1.0, ton:.66 });
      // yarigin ic golgesi: gozler kara bir bosluga otursun
      { const ig = new THREE.Mesh(new THREE.CylinderGeometry(.138,.138,.070,18,1,true),
          new THREE.MeshBasicMaterial({ color:0x05060a, side:THREE.BackSide }));
        ig.position.y = .120; this.bas.add(ig); }
    }
    this.sacG = new THREE.Group(); this.sacG.position.set(0,.185,-.075); this.bas.add(this.sacG);
    const pr = kure(.098,R.sac,.92,.60,.85,D_KURK,1.0); pr.position.set(0,-.035,-.020); this.sacG.add(pr);
    const org = uzuv(.048,.026,.34,R.sac,10,D_KURK,.14,1.0);                                 // örgü
    org.position.set(0,-.05,-.045); org.rotation.x=-.22; this.sacG.add(org);
    for (let i=0;i<3;i++){ const b=new THREE.Mesh(new THREE.TorusGeometry(.036-i*.007,.010,5,10),
      MAT(R.deri||R.kemer,.9,.06,D_DERI,1)); b.rotation.x=Math.PI/2+.22;
      b.position.set(0,-.12-i*.10,-.020-i*.022); this.sacG.add(b); }

    // ── KOLLAR: deltoid + üst kol + dirsek eklemi + ön kol + el
    const kol = y => { const u=new THREE.Group(); u.position.set(.222*y,.520,0); this.govde.add(u);
      const dl = kure(.085,R.kaftan,1.02,1.0,.98,D_KUMAS,2.4); dl.position.y=-.015; u.add(dl);
      u.add(uzuv(.074,.058,.30,R.kaftan,14,D_KUMAS,.14,2.4));
      // ═══ OMUZLUK ═══ omuzu asan 3 sira buyuk plaka
      lamelKusak(u, MAT(R.zirh,.52,.80,D_CELIK,.58,true), { satir:3, adet:10,
        y0:.022, y1:-.152, r0:.100, r1:.130, w:.064, h:.086, kal:.009, bel:.014,
        ac0:-Math.PI*.66*y, ac1:Math.PI*.66*y, egim:-.30, zOl:1.0, ton:.82 });
      const bz = new THREE.Mesh(new THREE.TorusGeometry(.078,.016,7,16),
        MAT(R.zirhKoyu,.64,.64,D_CELIK,.68,true)); bz.rotation.x=Math.PI/2;
      bz.position.y=-.020; u.add(bz);
      const a=new THREE.Group(); a.position.y=-.30; u.add(a);
      const dr = kure(.058,R.kaftan,1,1,1,D_KUMAS,2.4); a.add(dr);                            // dirsek
      a.add(uzuv(.062,.044,.24,R.kaftan,14,D_KUMAS,.16,2.4));                                 // yen
      const yn = new THREE.Mesh(new THREE.CylinderGeometry(.052,.058,.075,14,1,true),
        MAT(R.kaftanAlt||R.kaftan,1,.03,D_KUMAS,2.4,true));                                   // yen agzi
      yn.material.side=THREE.DoubleSide; yn.position.y=-.245; a.add(yn);
      // ═══ KOLCAK ═══ deri uzerine perclenmis dikey metal seritler
      seritZirh(a, MAT(R.zirh,.54,.78,D_CELIK,.58,true), { adet:7, r:.064, y:-.135,
        w:.030, h:.185, ac0:-Math.PI*.75, ac1:Math.PI*.75, zOl:1, ton:.78 });
      for (const yy2 of [-.048,-.222]) { const kys=new THREE.Mesh(
        new THREE.TorusGeometry(.066,.0095,6,14), MAT(R.deri||R.kemer,.90,.10,D_DERI,1.2));
        kys.rotation.x=Math.PI/2; kys.position.y=yy2; a.add(kys); }
      a.add(uzuv(.044,.040,.055,R.ten,12,D_TEN,.05,1.0)).position.y=-.245;                    // bilek
      const e=elYap(R,y); e.position.y=-.295; a.add(e);
      return {u,a,el:e}; };
    this.kL = kol(1); this.kR = kol(-1);

    // ── BACAKLAR: uyluk + diz eklemi + baldır + çizme
    const bac = y => { const u=new THREE.Group(); u.position.set(.118*y,-.06,0); this.pelvis.add(u);
      u.add(uzuv(.118,.090,.44,R.pantolon,16,D_KUMAS,.16,2.4));
      const a=new THREE.Group(); a.position.y=-.44; u.add(a);
      const dz = kure(.088,R.pantolon,1,.92,1.02,D_KUMAS,2.4); a.add(dz);                     // diz
      // ═══ DIZLIK + BALDIRLIK ═══
      if (R.dizlik) {
        const dk2 = new THREE.Mesh(new THREE.SphereGeometry(.098,16,12,0,Math.PI*2,0,Math.PI*.5),
          MAT(R.zirh,.52,.80,D_CELIK,.58,true));
        dk2.rotation.x = -1.15; dk2.position.set(0,.004,.030); dk2.castShadow=true; a.add(dk2);
        seritZirh(a, MAT(R.zirh,.54,.78,D_CELIK,.58,true), { adet:6, r:.085, y:-.235,
          w:.038, h:.235, ac0:-Math.PI*.55, ac1:Math.PI*.55, zOl:1, ton:.76 });
      }
      a.add(uzuv(.088,.066,.42,R.pantolon,14,D_KUMAS,.20,2.4));
      const f=cizmeYap(R); f.position.y=-.42; a.add(f);
      return {u,a,ayak:f}; };
    this.bL = bac(1); this.bR = bac(-1);

    this.kilic = new THREE.Group(); this.kR.a.add(this.kilic); this.kilic.position.y=-.30;
    const bc = new THREE.Mesh(palaGeo(), MAT(R.celik,.22,.96,D_CELIK,.35,true));
    bc.scale.set(1.18,.86,1.20); this.kilic.add(bc);
    const ktMat = MAT(R.altin,.36,.88,D_CELIK,.5,true);
    const kbz = new THREE.Mesh(new THREE.BoxGeometry(.185,.030,.052), ktMat); this.kilic.add(kbz);
    for (const s of [-1,1]){ const uc=new THREE.Mesh(new THREE.SphereGeometry(.026,10,8), ktMat);
      uc.scale.set(1,.62,.9); uc.position.set(.092*s,.008,0); this.kilic.add(uc); }   // balçak uçları
    this.kilic.add(uzuv(.030,.025,.17,0x332414,12,D_DERI,.05,1.3));                    // kabza sargısı
    for (let i=0;i<5;i++){ const h=new THREE.Mesh(new THREE.TorusGeometry(.029,.0055,4,10),
      MAT(0x8a7a52,.7,.35,D_CELIK,.4)); h.rotation.x=Math.PI/2; h.position.y=-.036-i*.028; this.kilic.add(h); }
    const tp = kure(.036,R.altin,1,.86,1,D_CELIK,.5); tp.position.y=-.182; this.kilic.add(tp);
    this.kilic.rotation.x = 2.62;
    this.uc = new THREE.Object3D(); this.uc.position.y=.84; this.kilic.add(this.uc);
    this.dp = new THREE.Object3D(); this.dp.position.y=.62; this.kilic.add(this.dp);

    // ═══ OMURGA EKLEMLENDIRME ═══
    // Omurga TEK eklemdi (this.govde); govde bu yuzden tahta gibi duruyordu.
    // Yapiyi kurduktan SONRA cocuklari yuksekliklerine gore ayiriyoruz:
    //   pelvis > govde(BEL) > gogus > boyun > bas
    // Poz kanallari degismiyor; uygulama aninda uce dagitiliyor (asagida).
    {
      const GOGUS_Y = .30, BOYUN_Y = .34;
      this.gogus = new THREE.Group(); this.gogus.position.y = GOGUS_Y;
      const gidecek = this.govde.children.filter(c =>
        c !== this.gogus &&
        (c.userData.omurga === 'gogus' || (c.userData.omurga !== 'bel' && c.position.y >= GOGUS_Y)));
      for (const c of gidecek) { c.position.y -= GOGUS_Y; this.gogus.add(c); }
      this.govde.add(this.gogus);
      // boyun: bas artik gogus degil BOYUN cocugu
      this.boyun = new THREE.Group(); this.boyun.position.y = BOYUN_Y; this.gogus.add(this.boyun);
      this.bas.position.y -= BOYUN_Y; this.boyun.add(this.bas);
      // KOPRUCUK KEMIKLERI: kollar dogrudan gogse degil kopruce baglaniyor.
      // Omuz savurdugunda kopruck de bir miktar doner — omuz kusagi canlanir.
      for (const kol of [this.kL, this.kR]) {
        const kp2 = new THREE.Group();
        kp2.position.copy(kol.u.position); this.gogus.add(kp2);
        kol.u.position.set(0,0,0); kp2.add(kol.u);
        kol.kop = kp2;
      }
    }
    this.kok.traverse(o => { if (o.isMesh) { o.castShadow=true; o.receiveShadow=true; } });
    // ── PELERIN: omuzdan dize inen, yayla gecikmeli agir yun
    this.pelerinG = new THREE.Group(); this.pelerinG.position.y = .555; this.govde.add(this.pelerinG);
    {
      // UC SEGMENT: her biri bir oncekinin cocugu ve kendi yayina bagli.
      // Gecikmeler ust uste binince kamci etkisi olusur — gercek agir kumas boyle davranir.
      const pm = MAT(R.pelerin || 0x1d2129, 1.0, .02, D_KUMAS, 2.8, true);
      pm.side = THREE.DoubleSide;
      const boy=[.34,.32,.30], r0=[.190,.258,.310], r1=[.258,.310,.352];
      let ust = this.pelerinG, toplam = 0;
      this.pSeg = [];
      for (let i=0;i<3;i++){
        const sg = new THREE.Group(); sg.position.y = (i===0 ? 0 : -boy[i-1]); ust.add(sg);
        const pg = new THREE.CylinderGeometry(r0[i], r1[i], boy[i], 24, 2, true, -2.35, 4.70);
        const pa = pg.attributes.position;
        for (let k=0;k<pa.count;k++){
          const x=pa.getX(k), y=pa.getY(k), z=pa.getZ(k);
          const a=Math.atan2(z,x), r=Math.hypot(x,z);
          const v=clamp((toplam + (boy[i]*.5 - y))/0.96, 0, 1);       // etege dogru artan dalga
          const dalga = 1 + Math.sin(a*7.5)*.085*v + Math.sin(a*3.1+1.2)*.050*v;
          pa.setX(k, Math.cos(a)*r*dalga); pa.setZ(k, Math.sin(a)*r*dalga*1.06);
        }
        pg.computeVertexNormals();
        const m = new THREE.Mesh(pg, pm); m.position.y = -boy[i]*.5; sg.add(m);
        this.pSeg.push({ g:sg, yx:{p:0,v:0}, yz:{p:0,v:0} });
        ust = sg; toplam += boy[i];
      }
      const ypk = new THREE.Mesh(new THREE.TorusGeometry(.145,.030,6,16), pm);
      ypk.rotation.x = Math.PI/2; ypk.position.y = .045; ypk.scale.set(1.30,1,1.05); this.pelerinG.add(ypk);
    }
    // ── temas gölgesi: ayakları yere oturtan yumuşak leke (gölge haritasının altını doldurur)
    this.golge = new THREE.Mesh(new THREE.PlaneGeometry(1.35,1.35),
      new THREE.MeshBasicMaterial({ map:noktaDoku('rgba(4,4,10,'), transparent:true, opacity:.50,
        depthWrite:false }));
    this.golge.rotation.x = -Math.PI/2; this.golge.position.y = .035;
    this.golge.renderOrder = -1; this.golge.userData.hareketli = true; this.zeminG.add(this.golge);

    this.poz = Object.assign({}, SIFIR);      // hedef
    this.cur = Object.assign({}, SIFIR);      // mevcut (yumuşak geçer)
    this.faz = Math.random()*6.28;
    this.iz = new Iz(22, izRenk);
    this.eylem = null; this.eT = 0; this.vurdu = false; this.adimFaz = 0; this.ileriIt = 0;
    this.gecG={x:0,y:0,z:0}; this.gecB={x:0,y:0,z:0};   // gogus/boyun gecikmesi
    this.yZ={p:0,v:0}; this.yZz={p:0,v:0};              // zirh sarsintisi
    this.yE={p:0,v:0}; this.yEz={p:0,v:0}; this.yS={p:0,v:0}; this.ySz={p:0,v:0};
    this.yP={p:0,v:0}; this.yPz={p:0,v:0};
    this._sonDon = 0; this._sonHiz = 0; this.bakHedef = null; this.bakX = 0; this.bakY = 0;
    this.kirpT = 1 + Math.random()*3; this.kirpS = 0;              // goz kirpma sayaci
    this.sakT = 1 + Math.random()*2; this.sakX = 0; this.sakY = 0; // bakis kacirma (saccade)
    this._a = new THREE.Vector3(); this._b = new THREE.Vector3();
    this.can = 100; this.denge = 100; this.olu = false;
  }

  basla(ad, yon) {   // eylem: hafif1 hafif2 agir takla blok parry hasar devril kalk
    this.eylem = ad; this.eT = 0; this.vurdu = false; this.ileriIt = 0;
    if (yon !== undefined) this.hasarYon = yon;
    if (ad === 'hafif1' || ad === 'hafif2' || ad === 'agir') { this.iz.bosalt(); S.islik(); }
    if (ad === 'takla') S.adim();
    if (ad === 'devril') S.dusme();
  }
  mesgul() { return this.eylem && this.eylem !== 'blok'; }

  // → bu karede darbe anı geldiyse eylem adını döndürür
  guncelle(t, dt, hiz, blokTutuluyor) {
    const p = this.poz; let darbe = null;
    const E = this.eylem;
    let hizBlend = .20;

    let ustKayit = null;
    if (E) {
      this.eT += dt;
      const T = { hafif1:.50, hafif2:.54, hafif3:.76, saplama:.62, agir:.92, takla:.62,
                  parry:.36, hasar:.38, blokDarbe:.30, riposte:.52,
                  devril:1.0, kalk:.75, blok:1e9, olum:1.3 }[E] || .5;
      const u = this.eT / T;
      hizBlend = .42;

      if (E === 'hafif1' || E === 'hafif2') {
        // hafif1: sag-ustten sol-asagi capraz · hafif2: sol-asagidan sag-yukari ters
        const yon = (E === 'hafif2') ? -1 : 1;
        const g = d => savurmaEgrisi(u + d);
        const sK=g(.055), sG=g(.028), sO=g(0), sD=g(-.022), sB=g(-.045);
        // omuz: yatay supurme (Z) baskin
        p.krZ = -.28 - yon * sO * 1.05;
        p.krU = -.58 + sO*.50 - Math.abs(sO)*.26;
        p.krA = -.98 + Math.max(0, sD)*.92;                 // dirsek GEC acilir = kamci
        p.klZ = .36 + yon * sG * .34; p.klU = -.28 - sG*.20; p.klA = -.78;
        // bicak: yuklenmede omuz arkasina saklanir, keserken one firlar
        p.kilX = 2.62 + (sB < 0 ? -sB*.85 : -sB*1.80);
        p.kilZ = yon * (.16 + sB*.42);
        // govde ve kalca — kalca ONDE
        p.govY = -yon * sG * .70; p.pelR = -yon * sK * .44;
        p.govX = .10 + Math.max(0, sG)*.20; p.govZ = yon * sG * .10;
        // agirlik aktarimi: yuklenirken arka bacaga cok, keserken one adim
        p.blU = -.20 + Math.max(0,sK)*.46 + Math.min(0,sK)*.30;
        p.brU =  .16 - Math.max(0,sK)*.26 - Math.min(0,sK)*.34;
        p.blA = .14 + Math.max(0,-sK)*.30; p.brA = .24 + Math.max(0,sK)*.22;
        p.pelY = .95 - Math.abs(sO)*.05;
        p.basY = -yon * sG * .16;                           // bas govdeden AZ doner (hedefte kalir)
        if (u > .28 && u < .66) this.izBirak();
        if (!this.vurdu && u > .40) { this.vurdu = true; darbe = E; }
        // kok hareketi: yuklenirken hafif geri, keserken one patlama
        this.ileriIt = u < .28 ? -1.1 : (u < .50 ? 5.2 : (u < .64 ? 1.8 : 0));
      }
      else if (E === 'hafif3') {
        // BITIRICI: sol-asagidan sag-yukari yukselen capraz, iki elle, govde acilir
        const g = d => savurmaEgrisi(u + d);
        const sK=g(.060), sG=g(.030), sO=g(0), sD=g(-.026), sB=g(-.052);
        p.krZ = -.34 + sO*.88;
        p.krU = -.30 - sO*1.42;                          // kol yukari firlar
        p.krA = -1.08 + Math.max(0,sD)*1.10;
        p.klZ = .30 + sG*.58; p.klU = -.26 - sG*1.10; p.klA = -.70 + Math.max(0,sD)*.58;
        p.kilX = 2.62 + (sB < 0 ? -sB*1.05 : -sB*2.05);
        p.kilZ = -(.10 + sB*.34);
        p.govY = sG*.55; p.pelR = sK*.38; p.govZ = -sG*.14;
        p.govX = .16 - Math.max(0,sG)*.38;               // gogus acilir
        p.blU = -.26 + Math.max(0,sK)*.58 + Math.min(0,sK)*.34;
        p.brU =  .20 - Math.max(0,sK)*.34 - Math.min(0,sK)*.30;
        p.blA = .18 + Math.max(0,-sK)*.32; p.brA = .30;
        p.pelY = .95 - Math.abs(sO)*.03 + Math.max(0,sO)*.055;
        p.basX = -Math.max(0,sG)*.22;
        if (u > .28 && u < .72) this.izBirak();
        if (!this.vurdu && u > .42) { this.vurdu = true; darbe = 'hafif3'; }
        this.ileriIt = u < .30 ? -1.5 : (u < .52 ? 6.2 : (u < .68 ? 2.0 : 0));
      }
      else if (E === 'saplama') {
        // SAPLAMA: geri cekilis → patlayici ileri uzanma. Menzil uzun, aci dar.
        let s;
        if (u < .34) s = -(1 - Math.pow(1-u/.34, 2)) * .72;
        else if (u < .50) { const k=(u-.34)/.16; s = -.72 + 1.90*(k*k*(3-2*k)); }
        else if (u < .64) s = 1.18;
        else { const k=(u-.64)/.36; s = 1.18*(1 - k*k*(3-2*k)); }
        p.krU = -1.32 - s*.16; p.krZ = -.10 - s*.06;
        p.krA = -1.18 + Math.max(0,s)*1.16;              // dirsek patlayarak acilir
        p.klU = -.58 - Math.max(0,s)*.18; p.klZ = .34; p.klA = -.98;
        p.kilX = 1.74 - Math.max(0,s)*.12; p.kilZ = 0;   // bicak ILERI bakar
        p.govY = -s*.32; p.pelR = -s*.24; p.govX = .10 + Math.max(0,s)*.24;
        p.blU = -.30 + Math.max(0,s)*.88 + Math.min(0,s)*.26;
        p.brU =  .24 - Math.max(0,s)*.58 - Math.min(0,s)*.30;
        p.blA = .16; p.brA = .34 + Math.max(0,s)*.32;
        p.pelY = .95 - Math.max(0,s)*.105;
        p.basY = 0;
        if (u > .36 && u < .62) this.izBirak();
        if (!this.vurdu && u > .44) { this.vurdu = true; darbe = 'saplama'; }
        this.ileriIt = u < .32 ? -1.7 : (u < .56 ? 8.8 : 0);
      }
      else if (E === 'riposte') {
        // KARSI VURUS: savusturmadan sonraki kisa pencerede acilan olumcul kesik
        const s = u < .22 ? -(u/.22)*.45
                : u < .40 ? -.45 + ((u-.22)/.18)*1.70
                : 1.25*(1 - Math.pow((u-.40)/.60, 1.6));
        p.krZ = -.24 - s*1.20; p.krU = -.70 + s*.30; p.krA = -.90 + Math.max(0,s)*1.00;
        p.klZ = .34 + s*.40; p.klU = -.30 - s*.24; p.klA = -.80;
        p.kilX = 2.62 + (s < 0 ? -s*.70 : -s*1.95); p.kilZ = .18 + s*.46;
        p.govY = -s*.78; p.pelR = -s*.50; p.govX = .12 + Math.max(0,s)*.24;
        p.blU = -.22 + Math.max(0,s)*.52; p.brU = .18 - Math.max(0,s)*.30;
        p.blA = .16; p.brA = .28; p.pelY = .95 - Math.abs(s)*.06;
        if (u > .18 && u < .62) this.izBirak();
        if (!this.vurdu && u > .34) { this.vurdu = true; darbe = 'riposte'; }
        this.ileriIt = u < .20 ? 0 : (u < .48 ? 7.4 : 0);
      }
      else if (E === 'blokDarbe') {
        // SIPER DARBESI: kilic geri itilir, govde sarsilir, ayak geri kayar
        const s = Math.sin(clamp(u,0,1)*Math.PI);
        p.krU = -1.05 + s*.46; p.krZ = -.62 - s*.34; p.krA = -.62 + s*.38;
        p.klU = -.62 + s*.32; p.klZ = .48 + s*.10; p.klA = -.85;
        p.kilX = 1.45 + s*.34; p.kilZ = -.22 - s*.24;
        p.govX = .12 - s*.34; p.govY = -.16 - s*.24; p.govZ = s*.10;
        p.pelY = .92 - s*.065; p.basX = -s*.22;
        p.blU = -.22 - s*.34; p.brU = .18 + s*.38; p.blA = .14 + s*.34; p.brA = .20;
        hizBlend = .58;
        if (u >= 1 && blokTutuluyor) { this.eylem = 'blok'; this.eT = 0; }
      }
      else if (E === 'agir') {
        // iki elli tepeden indirme — uzun yuklenme, kisa ve sert inis
        const g = d => agirEgrisi(u + d);
        const sK=g(.070), sG=g(.035), sO=g(0), sD=g(-.030), sB=g(-.058);
        const yuk = Math.max(0,-sO), in_ = Math.max(0, sO);      // yukselme / inis miktari
        p.krU = -.34 - yuk*2.62 + in_*1.18;                       // kol tepeye, sonra one
        p.krZ = -.12 - yuk*.20;
        p.krA = -.30 - yuk*.85 + Math.max(0,sD)*.75;              // tepede katla, inerken ac
        p.klU = -.34 - yuk*2.30 + in_*1.02; p.klZ = .14 + yuk*.18;
        p.klA = -.42 - yuk*.70 + Math.max(0,sD)*.60;              // iki el kabzada
        p.kilX = 2.62 - yuk*1.35 - in_*1.85;                      // tepede dikey, inerken one
        p.kilZ = -sB*.10;
        p.govX = .12 - yuk*.30 + in_*.62;                         // once geriye yaslan, sonra cok
        p.govY = sG*.12; p.pelR = sK*.16;
        p.blU = -.30 - yuk*.24 + in_*.80; p.brU = .24 + yuk*.30 - in_*.52;
        p.blA = .16 + in_*.34; p.brA = .30 + yuk*.30;
        p.pelY = .95 + yuk*.045 - in_*.115;                       // yukselip cokme
        p.basX = -yuk*.22 + in_*.30;
        this.ileriIt = u < .38 ? -.7 : (u < .58 ? 3.6 : (u < .70 ? 1.2 : 0));
        if (u > .38 && u < .76) this.izBirak();
        if (!this.vurdu && u > .52) { this.vurdu = true; darbe = 'agir'; }
      }
      else if (E === 'takla') {
        // GERCEK YUVARLANMA: comelme → omuz oncu devrilme → sirt uzerinde donus → dogrulma
        const e = clamp(u/.86, 0, 1);
        // donus hizi esit degil: once yavas (comelme), ortada hizli, sonda yavas
        const don = e < .16 ? .10*(e/.16)
                  : e < .74 ? .10 + .80*((e-.16)/.58)
                  : .90 + .10*((e-.74)/.26);
        const top = Math.sin(clamp(e/.92,0,1)*Math.PI);            // toplanma miktari
        const com = clamp(e/.16, 0, 1);                            // ilk comelme
        p.egim  = Math.PI*2*don;
        p.egimY = .58*top + .10*com;
        p.pelY  = .95 - .78*top - .10*com;
        // omuz onculu: bir omuz digerinden once girer
        p.govZ = -.42*Math.sin(e*Math.PI);
        p.pelR = -.30*Math.sin(e*Math.PI);
        // bacaklar dizden tam katlanir, sonda one atilir (dogrulma)
        const at = clamp((e-.72)/.28, 0, 1);
        p.blU = -1.62*top + 1.10*at; p.blA = 2.05*top - 1.10*at;
        p.brU = -1.42*top + .70*at;  p.brA = 1.88*top - .80*at;
        // kollar govdeyi sarar, kilic disari dogru tutulur (kendine batmasin)
        p.klU = -2.15*top; p.klA = -1.62*top; p.klZ = .62*top;
        p.krU = -1.72*top; p.krA = -1.30*top; p.krZ = -.86*top;
        p.govX = .78*top - .30*at; p.basX = .52*top;
        p.kilX = 2.62 - .40*top; p.kilZ = -.42*top;
        hizBlend = .60;
      }
      else if (E === 'parry') {
        const s = u<.25 ? u/.25 : 1-(u-.25)/.75;
        p.krU = -1.20 - s*.35; p.krZ = -.75 - s*.35; p.krA = -.55;
        p.klU = -.75; p.klZ = .55; p.klA = -.95;
        p.kilX = 1.35; p.kilZ = -.35;
        p.govX = .06; p.govY = -.28*s; p.blU=-.16; p.brU=.14;
        hizBlend = .55;
      }
      else if (E === 'hasar') {
        // vurusun GELDIGI YONE gore sarsilma — onden gelen geriye, yandan gelen yana atar
        const s = Math.sin(clamp(u,0,1)*Math.PI);
        const a = this.hasarYon || 0, ileri = Math.cos(a), yan = Math.sin(a);
        p.govX = -.46*s*ileri; p.govZ = .34*s*yan; p.govY = .26*s*yan;
        p.basX = -.34*s*ileri; p.basY = .30*s*yan;
        p.pelR = .18*s*yan; p.pelX = .07*s*yan;
        p.klU = -.55*s*Math.abs(ileri) - .25*s*yan; p.krU = -.35*s*Math.abs(ileri) + .25*s*yan;
        p.klZ = .50*s; p.krZ = -.50*s;
        p.blU = .30*s*ileri - .16*s*yan; p.brU = -.26*s*ileri - .16*s*yan;
        p.pelY = .95-.055*s;
        hizBlend = .5;
      }
      else if (E === 'devril') {
        const s = clamp(u/.45, 0, 1), e = 1-Math.pow(1-s,3);
        p.egim = -1.55*e;
        p.pelY = .95 - .70*e;
        p.govX = -.30*e; p.basX = -.45*e;
        p.blU = .9*e; p.brU = .7*e; p.blA = -.5*e; p.brA = -.4*e;
        p.klU = -1.5*e; p.krU = -1.3*e; p.klZ=.9*e; p.krZ=-.9*e;
        hizBlend = .45;
      }
      else if (E === 'kalk') {
        const e = clamp(u/.85, 0, 1), s = e*e*(3-2*e);
        p.egim = -1.55*(1-s);
        p.pelY = .25 + .70*s;
        p.govX = -.30*(1-s) + .25*Math.sin(s*Math.PI);
        p.blU = .9*(1-s) - .5*Math.sin(s*Math.PI); p.brU = .7*(1-s);
        p.blA = 1.0*Math.sin(s*Math.PI); p.brA = .3*(1-s);
        p.klU = -1.2*(1-s); p.krU = -1.0*(1-s);
        hizBlend = .35;
      }
      else if (E === 'olum') {
        const e = clamp(u/.8,0,1), s = e*e;
        p.egim = -1.5*s; p.pelY = .95-.72*s; p.govX = -.2*s; p.basX = -.5*s;
        p.blU=.8*s; p.brU=.5*s; p.klU=-1.3*s; p.krU=-1.1*s;
        hizBlend = .3;
      }
      else if (E === 'blok') {
        p.krU = -1.05; p.krZ = -.62; p.krA = -.62;
        p.klU = -.62; p.klZ = .48; p.klA = -.85;
        p.kilX = 1.45; p.kilZ = -.22;
        p.govX = .12; p.govY = -.16; p.pelY = .92;
        p.blU = -.22; p.brU = .18; p.blA=.14; p.brA=.20;
        hizBlend = .30;
        if (!blokTutuluyor) this.eylem = null;
      }

      if (UST_EYLEM[E] && hiz > .55) {
        // eylemin yazdigi UST kanallari sakla; locomotion asagida bunlari ezecek
        ustKayit = { klU:p.klU, klZ:p.klZ, klA:p.klA, krU:p.krU, krZ:p.krZ, krA:p.krA,
                     govX:p.govX, govY:p.govY, govZ:p.govZ, basX:p.basX, basY:p.basY,
                     kilX:p.kilX, kilZ:p.kilZ, pelR:p.pelR };
      }
      if (E !== 'blok' && u >= 1) {
        this.eylem = (E === 'devril') ? 'devril_bekle' : null;
        if (E === 'devril') { this.eylem = 'devril_bekle'; this.eT = 0; }
      }
    }
    else if (this.eylem === 'devril_bekle') { /* yerde kalır */ }

    if (!this.eylem || this.eylem === 'blok') {
      if (blokTutuluyor && !this.eylem) { this.basla('blok'); }
    }

    // ── UST/ALT AYRIMI: ust-beden eylemi oynarken ve karakter yuruyorsa,
    // once locomotion'u calistirip ALT kanallari saklariz; eylem ust bedeni
    // yazdiktan sonra alt kanallari geri koyariz. Boylece yururken savurulabilir.
    let altKayit = null;
    const bolunmus = E && UST_EYLEM[E] && hiz > .55;

    // ── locomotion (eylem yokken VEYA bolunmus modda alt beden icin)
    if (!this.eylem || bolunmus) {
      const y = clamp(hiz/5.4, 0, 1);
      if (hiz > .14) {
        // ── ADIM KİLİDİ: faz kat edilen MESAFEDEN türetilir → ayak yerde kaymaz
        const adimBoyu = lerp(.98, 1.58, y);                    // tek adım (m)
        this.adimFaz += dt * hiz * Math.PI / adimBoyu;
        const f = this.adimFaz;
        // kalça açısı adım boyuna göre: sin(g)*bacak ≈ yarım adım
        const g = clamp(Math.asin(clamp(adimBoyu/2/.90, 0, .95)), .18, 1.15);
        const sl = Math.sin(f), sr = Math.sin(f+Math.PI);
        p.blU = sl*g; p.brU = sr*g;
        // diz: salınımda güçlü bükülme + basış fazında hafif yaylanma (yumuşama)
        const diz = (s0) => Math.max(0,-Math.sin(s0-.62))*1.15*y + Math.max(0,Math.sin(s0+1.9))*.20*y;
        p.blA = diz(f); p.brA = diz(f+Math.PI);
        // ayak bileği: topuk vuruşu → burun itişi
        p.blF = (-Math.sin(f-.30)*.30 + Math.max(0,Math.sin(f+2.5))*.55) * y;
        p.brF = (-Math.sin(f+Math.PI-.30)*.30 + Math.max(0,Math.sin(f+Math.PI+2.5))*.55) * y;
        // kollar: karşı salınım; sağ el kılıç taşıdığı için kısıtlı
        p.klU = sr*.66*y - .06; p.klZ = .17+.04*y; p.klA = -.34-.30*y + Math.max(0,sr)*.26*y;
        p.krU = sl*.40*y - .06; p.krZ = -.17-.03*y; p.krA = -.40-.20*y;
        // pelvis: çift tümsek (adım başına bir kez) + yanal ağırlık aktarımı + Trendelenburg
        p.pelY = .95 + Math.abs(Math.sin(f))*.052*y - .030*y;
        p.pelR = sl*.13*y;
        p.pelX = -sl*.045*y;
        p.govZ = sl*.055*y + clamp((this.donHizi||0)*.055, -.30, .30)*y;   // omuz karsi egim + donuse yaslanma
        p.govX = .05+.13*y + clamp(this.ivmeIleri||0,-18,18)*.0135; p.govY = -sl*.16*y;
        p.basX = -.04*y - .05*Math.abs(sl)*y; p.basY = -sl*.05*y; // baş sabitlemesi (zıt faz)
        p.kilX = 2.62-.16*y; p.kilZ = .04*y; p.egim = 0; p.egimY = 0;
        // ayak sesi — basış anında
        const yeni = Math.floor((f+1.6)/Math.PI);
        if (yeni !== this._adim) {
          this._adim = yeni;
          if (y > .12) {
            S.adim();
            // TEMAS OLAYI: basan ayagin altindan toz + kameraya mikro darbe.
            // Adim sesi vardi ama gorsel karsiligi yoktu — ayak "yere degmiyordu".
            const bas2 = (sl > 0) ? this.bR : this.bL;
            bas2.ayak.getWorldPosition(this._a);
            toz.at(this._a.x, this._a.y - .10, this._a.z, 2 + (y*3|0), .55, .85, .55);
            if (this.oyuncu) sarsinti = Math.max(sarsinti, .045 + y*.055);
          }
        }
      } else {
        // ── DURUŞ: nefes + yavaş ağırlık aktarımı + omuz çökmesi
        const f = t*1.35 + this.faz;                              // nefes (≈13/dk)
        const w = Math.sin(t*.42 + this.faz*1.7);                 // ağırlık aktarımı
        const nef = Math.sin(f);
        p.blU = .04*w; p.brU = -.04*w;
        p.blA = .10 + .07*Math.max(0,w); p.brA = .10 + .07*Math.max(0,-w);
        p.blF = -.05; p.brF = -.05;
        p.klU=-.06+nef*.030; p.klZ=.175+nef*.020; p.klA=-.30-nef*.035;
        p.krU=-.06-nef*.026; p.krZ=-.175-nef*.018; p.krA=-.36-nef*.030;
        p.pelY=.945+nef*.014; p.pelR=w*.055; p.pelX=w*.035;
        p.govX=.035+nef*.020 + clamp(this.ivmeIleri||0,-18,18)*.0100; p.govY=-w*.06; p.govZ=-w*.045;
        p.basX=nef*.030-.02; p.basY=Math.sin(t*.31+this.faz)*.24 + w*.10;
        p.kilX=2.62+nef*.02; p.kilZ=0; p.egim=0; p.egimY=0;
      }
    }

    // bolunmus modda: locomotion ust kanallari ezdi → eylemin ust pozunu geri koy.
    // Alt kanallar locomotion'dan kalir. Sonuc: bacaklar yuruyor, ust beden savuruyor.
    if (ustKayit) {
      Object.assign(p, ustKayit);
      // kalca donusu ikisinin ORTALAMASI: hem adim hem savurus katkisi
      p.pelR = ustKayit.pelR * .72 + p.pelR * .28;
    }

    // ── POZ KARIŞTIRMA (akıcılığın sırrı)
    const k = this.anlik ? 1 : (1 - Math.pow(1 - hizBlend, dt*60));
    const c = this.cur;
    for (const key in SIFIR) c[key] = lerp(c[key], p[key], k);

    this.bL.u.rotation.x = c.blU; this.bL.a.rotation.x = c.blA; this.bL.ayak.rotation.x = c.blF;
    this.bR.u.rotation.x = c.brU; this.bR.a.rotation.x = c.brA; this.bR.ayak.rotation.x = c.brF;
    this.kL.u.rotation.set(c.klU, 0, c.klZ); this.kL.a.rotation.x = c.klA;
    this.kR.u.rotation.set(c.krU, 0, c.krZ); this.kR.a.rotation.x = c.krA;
    // ── OMURGA: tek deger uc eklege dagitilir. Gogus ve boyun YAY ile geriden
    // gelir → govde artik tek parca donmuyor, dalga gibi akiyor (follow-through).
    { const kg = 1 - Math.exp(-dt/.055), kb = 1 - Math.exp(-dt/.115);
      this.gecG.x = lerp(this.gecG.x, c.govX, kg);
      this.gecG.y = lerp(this.gecG.y, c.govY, kg);
      this.gecG.z = lerp(this.gecG.z, c.govZ, kg);
      this.gecB.x = lerp(this.gecB.x, c.govX, kb);
      this.gecB.y = lerp(this.gecB.y, c.govY, kb);
      this.gecB.z = lerp(this.gecB.z, c.govZ, kb);
      // katsayilar toplami ~1.0 → toplam bukulme eski tek eklemli haliyle ayni
      this.govde.rotation.set(c.govX*.38, c.govY*.34, c.govZ*.42);
      this.gogus.rotation.set(this.gecG.x*.44, this.gecG.y*.46, this.gecG.z*.40);
      this.boyun.rotation.set(this.gecB.x*.18, this.gecB.y*.20, this.gecB.z*.18);
      // KOPRUCUK: omuz savurusunun bir kesri
      this.kL.kop.rotation.z = c.klZ*.15; this.kL.kop.rotation.x = c.klU*.12;
      this.kR.kop.rotation.z = c.krZ*.15; this.kR.kop.rotation.x = c.krU*.12; }
    this.pelvis.position.set(c.pelX, c.pelY, 0); this.pelvis.rotation.y = c.pelR;
    this.bas.rotation.set(c.basX, c.basY, -c.govZ*.28);
    this.kilic.rotation.set(c.kilX, 0, c.kilZ);
    this.egimG.rotation.x = c.egim; this.egimG.position.y = c.egimY;

    // ── İKİNCİL HAREKET: etek ve saç yaya bağlı; hep bir kare geriden gelir (follow-through)
    const donHiz = (c.pelR + c.govY - this._sonDon) / Math.max(dt, 1e-4); this._sonDon = c.pelR + c.govY;
    const ivme = (hiz - this._sonHiz) / Math.max(dt, 1e-4); this._sonHiz = hiz;
    const yay = (o, hedef, sert, sonum) => {
      o.v += (hedef - o.p) * sert * dt - o.v * sonum * dt;
      o.v = clamp(o.v, -30, 30); o.p += o.v * dt; return o.p; };
    this.etek.rotation.x = yay(this.yE,  -c.govX*.55 - clamp(hiz,0,7)*.028 - clamp(ivme,-25,25)*.005, 165, 16);
    this.etek.rotation.z = yay(this.yEz, -clamp(donHiz,-14,14)*.032, 145, 15);
    this.sacG.rotation.x = yay(this.yS,   .12 + clamp(hiz,0,7)*.038 - c.govX*.75 - c.basX*.8, 200, 17);
    this.sacG.rotation.z = yay(this.ySz, -clamp(donHiz,-14,14)*.050, 180, 16);
    // ── ZIRH SARSINTISI: yuzlerce lamel plaka govdeye ipe baglidir, govde donunce
    // bir kare geriden gelir. Shader yerine kusagin kendisini yayla sallamak
    // ayni etkiyi neredeyse bedava veriyor.
    if (this.zirhKusak) {
      this.zirhKusak.rotation.z = yay(this.yZz, -clamp(donHiz,-16,16)*.021, 210, 17);
      this.zirhKusak.rotation.x = yay(this.yZ, -clamp(ivme,-28,28)*.0035 - c.govX*.10, 240, 18);
    }
    // pelerin zinciri: her segment bir oncekinden daha yumusak → gecikme birikir
    for (let i=0;i<3;i++){
      const sg = this.pSeg[i], sert = 118 - i*30, son = 13.5 - i*2.2;
      const hx = (i===0 ? -c.govX*.60 : -.02) - clamp(hiz,0,7)*(.028+i*.013)
                 - clamp(ivme,-25,25)*(.0035+i*.0018);
      sg.g.rotation.x = yay(sg.yx, hx, sert, son);
      sg.g.rotation.z = yay(sg.yz, -clamp(donHiz,-14,14)*(.026+i*.015), sert*.92, son);
    }

    // ── BAŞ HEDEF KİLİDİ: rakip varsa göz teması kurar (gövde de hafif döner)
    if (this.bakHedef && !this.olu && this.eylem !== 'devril' && this.eylem !== 'devril_bekle') {
      this.kok.getWorldPosition(this._a);
      const dx = this.bakHedef.x - this._a.x, dz = this.bakHedef.z - this._a.z;
      let hy = Math.atan2(dx, dz) - this.kok.rotation.y - c.pelR - c.govY;
      while (hy > Math.PI) hy -= 6.283; while (hy < -Math.PI) hy += 6.283;
      const mes = Math.max(.7, Math.hypot(dx, dz));
      const hx = clamp(-Math.atan2(this.bakHedef.y - (this._a.y + c.pelY + .74), mes), -.42, .42);
      const kk = 1 - Math.pow(.0009, dt);
      this.bakY = lerp(this.bakY, clamp(hy, -1.05, 1.05), kk);
      this.bakX = lerp(this.bakX, hx, kk);
    } else {
      const kk = 1 - Math.pow(.02, dt);
      this.bakY = lerp(this.bakY, 0, kk); this.bakX = lerp(this.bakX, 0, kk);
    }
    // ── GOZ KIRPMA: 2.4-5.6 s'de bir, 0.13 s suren kapanma
    this.kirpT -= dt;
    if (this.kirpT <= 0) { this.kirpT = 2.4 + Math.random()*3.2; this.kirpS = .13; }
    if (this.kirpS > 0) {
      this.kirpS -= dt;
      const kk = Math.sin(clamp(1 - this.kirpS/.13, 0, 1) * Math.PI);   // 0→1→0
      for (const kp of this.kapak) { kp.scale.y = .52 + kk*1.55; kp.position.y = .128 - kk*.020; }
    } else if (this.kapak[0].scale.y !== .52) {
      for (const kp of this.kapak) { kp.scale.y = .52; kp.position.y = .128; }
    }
    // ── BAKIS KACIRMA: goz hicbir zaman tam sabit durmaz
    this.sakT -= dt;
    if (this.sakT <= 0) { this.sakT = .9 + Math.random()*2.4;
      this.sakX = (Math.random()-.5)*.10; this.sakY = (Math.random()-.5)*.22; }
    this.bas.rotation.y += this.bakY + this.sakY*.5; this.bas.rotation.x += this.bakX + this.sakX*.5;
    this.govde.rotation.y += this.bakY * .20;
    this.ayakIK(dt);
    return darbe;
  }
  // ── AYAK IK: egimli zeminde ayaklar araziye oturur.
  // Iki kemikli analitik cozum: d^2 = L1^2 + L2^2 + 2*L1*L2*cos(diz)
  ayakIK(dt){
    if (this.eylem === 'takla' || this.eylem === 'devril' || this.eylem === 'devril_bekle'
        || this.eylem === 'kalk' || this.eylem === 'olum') return;
    const L1 = .44, L2 = .42, TEMAS = .215;
    // ── govde araziye uyar (yokusta one/yana egilir)
    { const yy = this.kok.rotation.y, fx=Math.sin(yy), fz=Math.cos(yy);
      const px = this.kok.position.x, pz = this.kok.position.z;
      const ileri = (H(px+fx*.45, pz+fz*.45) - H(px-fx*.45, pz-fz*.45)) / .90;
      const yan   = (H(px+fz*.45, pz-fx*.45) - H(px-fz*.45, pz+fx*.45)) / .90;
      const kk = 1 - Math.exp(-dt/.16);
      this.zeminG.rotation.x = lerp(this.zeminG.rotation.x, -Math.atan(clamp(ileri,-.7,.7))*.55, kk);
      this.zeminG.rotation.z = lerp(this.zeminG.rotation.z,  Math.atan(clamp(yan,-.7,.7))*.55, kk); }
    for (let s=0;s<2;s++){
      const bac = s ? this.bR : this.bL;
      bac.ayak.getWorldPosition(this._a);
      const yer = H(this._a.x, this._a.z) + TEMAS;
      const batma = yer - this._a.y;
      if (batma <= .002) continue;                       // ayak zaten havada, dokunma
      this._b.set(this._a.x, yer, this._a.z);
      this.pelvis.worldToLocal(this._b);                 // hedefi pelvis uzayina tasi
      const kalca = bac.u.position;
      const dy = kalca.y - this._b.y, dz = kalca.z - this._b.z;
      const d = clamp(Math.hypot(dy, dz), .20, L1+L2-.012);
      const diz = Math.acos(clamp((d*d - L1*L1 - L2*L2)/(2*L1*L2), -1, 1));
      const uyl = Math.atan2(dz, dy) - Math.atan2(L2*Math.sin(diz), L1 + L2*Math.cos(diz));
      const w = clamp(batma/.10, 0, 1) * .80;            // sadece batmisken, yumusak gecisle
      bac.u.rotation.x = lerp(bac.u.rotation.x, uyl, w);
      bac.a.rotation.x = lerp(bac.a.rotation.x, diz, w);
    }
    // ── ayak bilekleri zemin egimine paralel
    { const yy = this.kok.rotation.y, fx=Math.sin(yy), fz=Math.cos(yy);
      for (let s=0;s<2;s++){
        const bac = s ? this.bR : this.bL;
        bac.ayak.getWorldPosition(this._a);
        const eg = (H(this._a.x+fx*.19, this._a.z+fz*.19) - H(this._a.x-fx*.19, this._a.z-fz*.19)) / .38;
        const hedefA = (s ? this.cur.brF : this.cur.blF) - Math.atan(clamp(eg,-.8,.8))*.7;
        bac.ayak.rotation.x = lerp(bac.ayak.rotation.x, hedefA, 1-Math.exp(-dt/.10));
      }
    }
  }
  izBirak(){ this.uc.getWorldPosition(this._a); this.dp.getWorldPosition(this._b);
    this.iz.ekle(this._a, this._b); }
}

const R_TOGAN = { zirh:0x8b8d92, zirhKoyu:0x4a4741, ayna:false, dizlik:false, tug:false,
  pelerin:0x1a1e27, kaftan:0x3d4b66, kaftanAlt:0x323d52, kurk:0xb0aba1, ten:0xc08e63, sac:0x241c18,
  kemer:0x5a4023, deri:0x4b3520, pantolon:0x3a4356, cizme:0x483420, celik:0xc6ccd6, altin:0xb08a3c };
const R_KAYA = { zirh:0x8a7f66, zirhKoyu:0x463b2a, ayna:true, dizlik:true, tug:true, eteklik:true, tugRenk:0x241d16,
  pelerin:0x241f18, kaftan:0x5f5636, kaftanAlt:0x4c452b, kurk:0x958b78, ten:0xc59468, sac:0x2b2119,
  kemer:0x4d3a20, deri:0x3f2e17, pantolon:0x4c4834, cizme:0x453118, celik:0x9a7c4a, altin:0x8a6b3c };

const togan = new Insan(R_TOGAN, 0xe6ecff);
togan.oyuncu = true;   // temas sarsintisi sadece oyuncuda
togan.birlesikSayi = iskeletiBirlestir(togan.kok);
togan.kok.position.set(3, H(3,7), 7); scene.add(togan.kok);
const kaya = new Insan(R_KAYA, 0xf0e0c0);
kaya.birlesikSayi = iskeletiBirlestir(kaya.kok);
kaya.kok.position.set(-13, H(-13,-7), -7); kaya.kok.rotation.y = Math.PI*.8; scene.add(kaya.kok);

// ═══════════ 8. ÇEVRE ═══════════
const kecemat = () => kenar(new THREE.MeshStandardMaterial({color:0x7d7361, roughness:1, normalMap:D_KUMAS.n, normalScale:new THREE.Vector2(1.6,1.6)}), new THREE.Color(0x8fa0d8), .18);
const ahsap = () => kenar(new THREE.MeshStandardMaterial({color:0x5a4227, roughness:.95}), new THREE.Color(0x7f8fc8), .22);
const bacalar = [];
const yurtlar = [];   // patika ve ic isik icin
function yurt(x,z,s=1){
  const g = new THREE.Group();
  // keceyi sarkit: gergi noktalari arasi hafif cokme (mukemmel silindir olmaz)
  const sark = (geo, mik) => { const pa=geo.attributes.position;
    for(let i=0;i<pa.count;i++){ const px=pa.getX(i), py=pa.getY(i), pz=pa.getZ(i);
      const a=Math.atan2(pz,px), r=Math.hypot(px,pz);
      const s2 = 1 - (Math.abs(Math.sin(a*5))*.5+.5)*mik - fbm(px*1.7+9, pz*1.7-4, 2)*mik*.9;
      pa.setX(i, Math.cos(a)*r*s2); pa.setZ(i, Math.sin(a)*r*s2);
      pa.setY(i, py - Math.abs(Math.sin(a*5))*mik*.35); }
    geo.computeVertexNormals(); return geo; };
  const gvG = sark(new THREE.CylinderGeometry(2.55,2.72,2.05,28,3), .022);
  const gv = new THREE.Mesh(gvG, kecemat()); gv.position.y=1.02; g.add(gv);
  const kbG = sark(new THREE.SphereGeometry(2.62,28,12,0,Math.PI*2,0,Math.PI*.40), .030);
  const kb = new THREE.Mesh(kbG, kecemat());
  kb.position.y=2.05; kb.scale.y=.78; g.add(kb);
  // yamalar: farkli tonda kece parcalari
  for(let i=0;i<5;i++){ const a=Math.random()*6.28, yy=.45+Math.random()*1.25;
    const w=.45+Math.random()*.55, hh=.35+Math.random()*.5;
    const ym=new THREE.Mesh(new THREE.PlaneGeometry(w,hh),
      kenar(new THREE.MeshStandardMaterial({color:0x6a6152, roughness:1,
        normalMap:D_KUMAS.n, normalScale:new THREE.Vector2(1.8,1.8), side:THREE.DoubleSide}),
        new THREE.Color(0x8fa0d8), .16));
    const rr=2.60+ (yy-1.0)*.08;
    ym.position.set(Math.cos(a)*rr, yy, Math.sin(a)*rr);
    ym.lookAt(0, yy, 0); ym.rotateY(Math.PI); ym.rotation.z=(Math.random()-.5)*.4;
    ym.castShadow=true; g.add(ym); }
  // tepe cemberi (toono): halka + ic kafes
  const cm = new THREE.Mesh(new THREE.TorusGeometry(.44,.058,7,20), ahsap());
  cm.rotation.x=Math.PI/2; cm.position.y=3.02; g.add(cm);
  for(let i=0;i<6;i++){ const a=i/6*Math.PI;
    const ck=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.86,4), ahsap());
    ck.rotation.set(Math.PI/2, 0, a); ck.position.y=3.02; g.add(ck); }
  for(let i=0;i<14;i++){ const a=i/14*Math.PI*2;
    const k=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,1.32,4), ahsap());
    k.position.set(Math.cos(a)*1.42,2.62,Math.sin(a)*1.42);
    k.rotation.z=Math.cos(a)*.62; k.rotation.x=-Math.sin(a)*.62; g.add(k); }
  // ── YURT ICI PARILTISI ──
  // Bir obayi 'yasaniyor' gosteren en guclu tek isaret: iceride ates var, keceden
  // sizan sicak leke ve aydinlanmis baca deligi. Bu olmadan yurtlar bos kabuk gibi.
  {
    // baca deligi (toono) icten aydinlanir — HDR deger, bloom yakalar
    const bcMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.35,0.62,0.24) });
    bcMat.toneMapped = false;
    const bc2 = new THREE.Mesh(new THREE.CircleGeometry(.38, 16), bcMat);
    bc2.rotation.x = -Math.PI/2; bc2.position.y = 2.98; g.add(bc2);
    // keceden sizan leke: kapinin cevresinde ve alt kusakta sicak parilti
    const szMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62,0.26,0.10),
      transparent:true, opacity:.55, blending:THREE.AdditiveBlending, depthWrite:false });
    szMat.toneMapped = false;
    const sz = new THREE.Mesh(new THREE.PlaneGeometry(1.30,1.75), szMat);
    sz.position.set(0,.80,2.735); g.add(sz);
    g.userData.icAtes = [bcMat, szMat];
  }
  const cr=new THREE.Mesh(new THREE.BoxGeometry(1.12,1.55,.10), ahsap()); cr.position.set(0,.78,2.66); g.add(cr);
  const kn=new THREE.Mesh(new THREE.BoxGeometry(.92,1.34,.06),
    kenar(new THREE.MeshStandardMaterial({color:0x2e2114,roughness:1}), new THREE.Color(0x6f7fb8), .18));
  kn.position.set(0,.74,2.73); g.add(kn);
  // kapi kecesi: yandan toplanip baglanmis agir ortu
  { const kg=new THREE.PlaneGeometry(1.02,1.44,6,8), pa=kg.attributes.position;
    for(let i=0;i<pa.count;i++){ const px=pa.getX(i), py=pa.getY(i);
      pa.setZ(i, Math.sin(px*7.5)*.045 + (py<0?.05:0));
      pa.setX(i, px*(1+(-py/1.44)*.10)); }
    kg.computeVertexNormals();
    const km2=new THREE.Mesh(kg, kenar(new THREE.MeshStandardMaterial({color:0x5f5648,
      roughness:1, normalMap:D_KUMAS.n, normalScale:new THREE.Vector2(2.0,2.0),
      side:THREE.DoubleSide}), new THREE.Color(0x8fa0d8), .16));
    km2.position.set(.30,.80,2.80); km2.rotation.y=-.42; km2.castShadow=true; g.add(km2); }
  for(let i=0;i<10;i++){ const a=i/10*Math.PI*2;
    const kz=new THREE.Mesh(new THREE.CylinderGeometry(.035,.02,.5,4), ahsap());
    kz.position.set(Math.cos(a)*3.5,.18,Math.sin(a)*3.5); g.add(kz);
    const ip=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1.6,3),
      new THREE.MeshStandardMaterial({color:0x6b5c3e,roughness:1}));
    ip.position.set(Math.cos(a)*3.05,1.35,Math.sin(a)*3.05);
    ip.rotation.z=Math.cos(a)*.85; ip.rotation.x=-Math.sin(a)*.85; g.add(ip); }
  g.position.set(x,H(x,z),z); g.scale.setScalar(s); g.rotation.y=Math.random()*6.28;
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(g); STATIK.push(g); bacalar.push(new THREE.Vector3(x,H(x,z)+3.1*s,z));
  yurtlar.push({ x, z, s, g });
}
yurt(-22,15,1.15); yurt(-31,-8,.95); yurt(17,21,1.0); yurt(27,-3,.9); yurt(-7,27,1.05); yurt(9,-26,1.0);
{
  const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),Sv=new THREE.Vector3(),V=new THREE.Vector3();
  const kM=kenar(new THREE.MeshStandardMaterial({color:0x5c5a58,roughness:.98}),new THREE.Color(0x8b9adc),.30);
  const ks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),kM,90);
  const kR=new Float32Array(270);
  for(let i=0;i<90;i++){ const r=13+Math.pow(Math.random(),.6)*150,a=Math.random()*6.28;
    const x=Math.cos(a)*r,z=Math.sin(a)*r; Q.setFromEuler(new THREE.Euler(Math.random()*3,Math.random()*3,Math.random()*3));
    const s=.25+Math.random()*Math.random()*1.5;
    M4.compose(V.set(x,H(x,z)+s*.35,z),Q,Sv.set(s,s*.72,s*.9)); ks.setMatrixAt(i,M4);
    const v=.78+Math.random()*.42; kR[i*3]=v*.62;kR[i*3+1]=v*.60;kR[i*3+2]=v*.58; }
  ks.instanceColor=new THREE.InstancedBufferAttribute(kR,3); ks.castShadow=ks.receiveShadow=true; scene.add(ks);
  const cM=kenar(new THREE.MeshStandardMaterial({color:0x6d6a3c,roughness:1,flatShading:true}),new THREE.Color(0x93a6e0),.26);
  const cs=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.55,0),cM,130);
  const cR=new Float32Array(390);
  for(let i=0;i<130;i++){ const r=17+Math.pow(Math.random(),.5)*160,a=Math.random()*6.28;
    const x=Math.cos(a)*r,z=Math.sin(a)*r; Q.setFromEuler(new THREE.Euler(0,Math.random()*3,0));
    const s=.5+Math.random()*.8;
    M4.compose(V.set(x,H(x,z)+s*.28,z),Q,Sv.set(s*1.25,s*.72,s*1.25)); cs.setMatrixAt(i,M4);
    const v=.7+Math.random()*.5,ye=Math.random()<.35;
    cR[i*3]=(ye?.42:.62)*v;cR[i*3+1]=(ye?.46:.55)*v;cR[i*3+2]=(ye?.26:.30)*v; }
  cs.instanceColor=new THREE.InstancedBufferAttribute(cR,3); cs.castShadow=cs.receiveShadow=true; scene.add(cs);
}
// talim kuklası
const kukla = new THREE.Group();
{
  const d=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,2.4,7), ahsap()); d.position.y=1.2; kukla.add(d);
  const g=new THREE.Mesh(new THREE.CylinderGeometry(.42,.36,1.0,9),
    kenar(new THREE.MeshStandardMaterial({color:0xa08a54,roughness:1}),new THREE.Color(0x8090cc),.30));
  g.position.y=1.75; kukla.add(g);
  const k=new THREE.Mesh(new THREE.BoxGeometry(1.7,.16,.16), ahsap()); k.position.y=1.95; kukla.add(k);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.26,9,7),
    kenar(new THREE.MeshStandardMaterial({color:0x8d7a4a,roughness:1}),new THREE.Color(0x8090cc),.30));
  b.position.y=2.42; kukla.add(b);
  kukla.position.set(-2,H(-2,-9),-9);
  kukla.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  cocuklariBirlestir(kukla);
  scene.add(kukla);
}
// Burkut
const kazik=new THREE.Mesh(new THREE.CylinderGeometry(.15,.18,3.2,7), ahsap());
kazik.position.set(8,H(8,-12)+1.6,-12); kazik.castShadow=true; scene.add(kazik);
const burkut=new THREE.Group();
{
  const g=new THREE.Mesh(new THREE.SphereGeometry(.30,9,7), MAT(0x5a4326,.9)); g.scale.set(1,.95,1.35); burkut.add(g);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.17,8,6), MAT(0xa08652,.9)); b.position.set(0,.26,.22); burkut.add(b);
  const gg=new THREE.Mesh(new THREE.ConeGeometry(.06,.18,5), MAT(0xd8b24a,.5,.3));
  gg.rotation.x=Math.PI*.5; gg.position.set(0,.24,.40); burkut.add(gg);
  const kn=y=>{const k=new THREE.Mesh(new THREE.BoxGeometry(.10,.36,.62), MAT(0x4a3520,.95));
    k.position.set(.28*y,.02,-.04); burkut.add(k); return k;};
  burkut.kL=kn(1); burkut.kR=kn(-1);
  burkut.position.set(8,H(8,-12)+3.35,-12);
  burkut.traverse(o=>{if(o.isMesh)o.castShadow=true;}); scene.add(burkut);
}
// ateş
const atesI=new THREE.PointLight(0xff7326,3.2,19,2); atesI.position.set(13,H(13,9)+1.4,9); scene.add(atesI);
{
  const t=new THREE.Group();
  for(let i=0;i<9;i++){const a=i/9*6.28;
    const s=new THREE.Mesh(new THREE.DodecahedronGeometry(.28+Math.random()*.12,0), MAT(0x4e4a45,1));
    s.position.set(Math.cos(a)*1.25,.12,Math.sin(a)*1.25);
    s.rotation.set(Math.random(),Math.random(),Math.random()); s.castShadow=true; t.add(s);}
  // HDR cekirdek: 1.0 ustu deger → tonlama sonrasi dogal olarak beyaza doyar,
  // bloom'a gercek parlaklik bilgisi ulasir.
  const kMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(6.2, 2.9, 1.05) });
  kMat.toneMapped = false;
  const k=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8), kMat);
  k.position.y=.30; t.add(k);
  // ic kor: daha kucuk, cok daha parlak
  const kor = new THREE.Mesh(new THREE.SphereGeometry(.26,10,8),
    Object.assign(new THREE.MeshBasicMaterial({ color: new THREE.Color(10.5, 5.8, 2.3) }),
                  { toneMapped:false }));
  kor.position.y=.26; t.add(kor);
  t.position.set(13,H(13,9),9); scene.add(t);
  window.__ocakCekirdek = [k, kor];
}

// ═══ OBA DOLGUSU: tas, odun, sehpa, cuval, fici, kazik, kagni, koyun ═══
{
  let _s = 1337;
  const rnd = () => (_s = (_s * 16807) % 2147483647) / 2147483647;
  // talim alanini ve oyuncunun basladigi yeri bos birak
  const uygun = (x,z) => Math.hypot(x+2, z+9) > 4.6 && Math.hypot(x-3, z-7) > 3.6;
  const yerBul = (rmin, rmax) => {
    for (let i=0;i<26;i++){
      const a=rnd()*6.283, r=rmin+Math.pow(rnd(),.62)*(rmax-rmin);
      const x=Math.cos(a)*r, z=Math.sin(a)*r;
      if (uygun(x,z)) return [x,z];
    }
    return [rmax*.8, rmax*.8];
  };
  const M=new THREE.Matrix4(), Q=new THREE.Quaternion(), Eu=new THREE.Euler(),
        Pv=new THREE.Vector3(), Sv=new THREE.Vector3();

  // ── TASLAR (620) — zemine yarim gomulu, AO'nun tutunacagi ilk sey
  {
    const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),
      MAT(0x645f56,.96,.03,D_DERI,1.5), 620);
    for (let i=0;i<620;i++){
      const a=rnd()*6.283, r=2.5+Math.pow(rnd(),.5)*66;
      const x=Math.cos(a)*r, z=Math.sin(a)*r, s=.055+Math.pow(rnd(),2.5)*.46;
      Pv.set(x, H(x,z)+s*.26, z);
      Eu.set(rnd()*6.28, rnd()*6.28, rnd()*6.28); Q.setFromEuler(Eu);
      Sv.set(s*(.80+rnd()*.65), s*(.50+rnd()*.45), s*(.80+rnd()*.65));
      im.setMatrixAt(i, M.compose(Pv,Q,Sv));
    }
    im.castShadow = im.receiveShadow = true; scene.add(im);
  }
  // ── KIRIK DAL / KEMIK (240) — yerde yatan ince siluetler
  {
    const gg = new THREE.CylinderGeometry(.030,.022,1,6); gg.rotateZ(Math.PI/2);
    const im = new THREE.InstancedMesh(gg, MAT(0x584a38,.97,.02,D_DERI,1.2), 240);
    for (let i=0;i<240;i++){
      const a=rnd()*6.283, r=3+Math.pow(rnd(),.55)*58;
      const x=Math.cos(a)*r, z=Math.sin(a)*r, l=.35+rnd()*.85;
      Pv.set(x, H(x,z)+.035, z);
      Eu.set(rnd()*.3, rnd()*6.28, rnd()*.22); Q.setFromEuler(Eu);
      Sv.set(l, .8+rnd()*.6, .8+rnd()*.6);
      im.setMatrixAt(i, M.compose(Pv,Q,Sv));
    }
    im.castShadow = true; scene.add(im);
  }

  const odunMat  = MAT(0x4a3722,.96,.03,D_DERI,1.3);
  const cuvalMat = MAT(0x6b5f47,1,.02,D_KUMAS,2.2);
  const demirMat = MAT(0x2f2c28,.62,.66,D_CELIK,.7,true);
  const bezMat   = MAT(0x6d5a44,1,.02,D_KUMAS,2.2); bezMat.side = THREE.DoubleSide;

  // ── ODUN YIGINLARI (11)
  for (let k=0;k<11;k++){
    const yz=yerBul(8,50), g=new THREE.Group(); g.position.set(yz[0],H(yz[0],yz[1]),yz[1]);
    const c=4+((rnd()*5)|0);
    for(let i=0;i<c;i++){
      const l=.65+rnd()*.95, m=new THREE.Mesh(new THREE.CylinderGeometry(.052,.045,l,7), odunMat);
      m.rotation.set(Math.PI/2, rnd()*6.28, 0);
      m.position.set((rnd()-.5)*.55, .055+i*.098, (rnd()-.5)*.55);
      m.castShadow=m.receiveShadow=true; g.add(m);
    }
    scene.add(g); STATIK.push(g);
  }
  // ── KURUTMA SEHPALARI (6) — et/deri asili ahsap iskele
  for (let k=0;k<6;k++){
    const yz=yerBul(11,44), g=new THREE.Group();
    g.position.set(yz[0],H(yz[0],yz[1]),yz[1]); g.rotation.y=rnd()*6.28;
    const gen=1.75, yuk=1.52;
    for (const s of [-1,1]) for (const s2 of [-1,1]) {
      const b=uzuv(.044,.034,yuk*1.08,0x453425,7,D_DERI,.04,1.2);
      b.position.set(gen*.5*s, yuk, s2*.32); b.rotation.set(-s2*.20,0,-s*.13);
      b.castShadow=true; g.add(b);
    }
    const cb=new THREE.Mesh(new THREE.CylinderGeometry(.036,.036,gen+.34,7), odunMat);
    cb.rotation.z=Math.PI/2; cb.position.y=yuk; cb.castShadow=true; g.add(cb);
    for(let i=0;i<7;i++){
      const w=.13+rnd()*.11, h=.32+rnd()*.46;
      const q=new THREE.Mesh(new THREE.PlaneGeometry(w,h,1,3), bezMat);
      q.position.set(-gen*.5+(i/6)*gen, yuk-h*.5-.04, (rnd()-.5)*.12);
      q.rotation.y=(rnd()-.5)*.5; q.castShadow=true; g.add(q);
    }
    scene.add(g); STATIK.push(g);
  }
  // ── CUVAL ISTIFLERI (10)
  for(let k=0;k<10;k++){
    const yz=yerBul(7,40), g=new THREE.Group();
    g.position.set(yz[0],H(yz[0],yz[1]),yz[1]); g.rotation.y=rnd()*6.28;
    const c=2+((rnd()*4)|0);
    for(let i=0;i<c;i++){
      const m=new THREE.Mesh(new THREE.SphereGeometry(.29,12,9), cuvalMat);
      m.scale.set(1,.60,.76);
      m.position.set((rnd()-.5)*.28, .175+i*.29, (rnd()-.5)*.28);
      m.rotation.y=rnd()*6.28; m.castShadow=m.receiveShadow=true; g.add(m);
    }
    scene.add(g); STATIK.push(g);
  }
  // ── FICILAR (6)
  for(let k=0;k<6;k++){
    const yz=yerBul(9,34), g=new THREE.Group(); g.position.set(yz[0],H(yz[0],yz[1]),yz[1]);
    const b=new THREE.Mesh(new THREE.CylinderGeometry(.29,.25,.70,14), MAT(0x4e3a24,.94,.04,D_DERI,1.3));
    b.position.y=.35; b.castShadow=b.receiveShadow=true; g.add(b);
    for(const yy of [.13,.57]){
      const h=new THREE.Mesh(new THREE.TorusGeometry(.293,.021,5,16), demirMat);
      h.rotation.x=Math.PI/2; h.position.y=yy; g.add(h);
    }
    scene.add(g); STATIK.push(g);
  }
  // ── AT BAGLAMA HATLARI (4) — kazikler arasi sarkan ip
  for(let k=0;k<4;k++){
    const yz=yerBul(12,38), aci=rnd()*6.28, g=new THREE.Group();
    g.position.set(yz[0],H(yz[0],yz[1]),yz[1]); g.rotation.y=aci;
    const say=4, ara=1.7;
    const nok=[];
    for(let i=0;i<say;i++){
      const px=(i-(say-1)/2)*ara;
      const k2=uzuv(.052,.040,1.18,0x40301f,8,D_DERI,.05,1.2);
      k2.position.set(px,1.18,0); k2.castShadow=true; g.add(k2);
      nok.push(new THREE.Vector3(px,1.10,0));
      if(i<say-1) nok.push(new THREE.Vector3(px+ara*.5,.86,0));   // sarkma
    }
    const ip=new THREE.Mesh(new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(nok), 28, .016, 5, false), MAT(0x6a5b41,1,.02,D_DERI,1.1));
    ip.castShadow=true; g.add(ip);
    scene.add(g); STATIK.push(g);
  }
  // ── KAGNI (2)
  for(let k=0;k<2;k++){
    const yz=yerBul(14,32), g=new THREE.Group();
    g.position.set(yz[0],H(yz[0],yz[1]),yz[1]); g.rotation.y=rnd()*6.28;
    const kasa=new THREE.Mesh(new THREE.BoxGeometry(1.05,.34,2.05), odunMat);
    kasa.position.y=.72; kasa.castShadow=kasa.receiveShadow=true; g.add(kasa);
    for(let i=0;i<5;i++){
      const c=new THREE.Mesh(new THREE.BoxGeometry(.055,.40,2.0), odunMat);
      c.position.set(-.50+i*.25,.94,0); c.castShadow=true; g.add(c);
    }
    for(const s of [-1,1]){
      const t2=new THREE.Mesh(new THREE.TorusGeometry(.52,.055,6,18), odunMat);
      t2.rotation.y=Math.PI/2; t2.position.set(s*.60,.55,-.35); t2.castShadow=true; g.add(t2);
      for(let i=0;i<6;i++){
        const sp=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,1.0,5), odunMat);
        sp.rotation.set(0,Math.PI/2,i/6*Math.PI); sp.position.set(s*.60,.55,-.35); g.add(sp);
      }
    }
    const ok=new THREE.Mesh(new THREE.CylinderGeometry(.045,.038,1.9,7), odunMat);
    ok.rotation.x=Math.PI/2-.09; ok.position.set(0,.68,1.85); ok.castShadow=true; g.add(ok);
    scene.add(g); STATIK.push(g);
  }
  // ── KOYUNLAR (9) — bozkir obasi hayvansiz olmaz
  const yunMat=MAT(0x8d8578,1,.02,D_KURK,2.0), koyunTen=MAT(0x2e2823,.9,.03,D_TEN,.8);
  for(let k=0;k<9;k++){
    const yz=yerBul(16,46), g=new THREE.Group();
    g.position.set(yz[0],H(yz[0],yz[1]),yz[1]); g.rotation.y=rnd()*6.28;
    const yat=rnd()<.45;
    const govde=new THREE.Mesh(new THREE.SphereGeometry(.34,14,10), yunMat);
    govde.scale.set(.80,.78,1.20); govde.position.y=yat?.26:.52;
    govde.castShadow=govde.receiveShadow=true; g.add(govde);
    const bas=new THREE.Mesh(new THREE.SphereGeometry(.115,12,9), koyunTen);
    bas.scale.set(.85,1.0,1.35); bas.position.set(0,yat?.30:.68,.44); g.add(bas);
    if(!yat) for(const sx of [-1,1]) for(const sz of [-1,1]){
      const b=new THREE.Mesh(new THREE.CylinderGeometry(.036,.028,.34,6), koyunTen);
      b.position.set(sx*.16,.17,sz*.22); b.castShadow=true; g.add(b);
    }
    scene.add(g); STATIK.push(g);
  }
}

// ── ALEV DOKUSU (canvas): sicak cekirdek -> turuncu -> soner
const alevDoku = (()=>{
  const N=64, c=_tuval(N), g=c.getContext('2d');
  const im=g.createImageData(N,N);
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){
    const x=(i/N-.5)*2, y=j/N;
    const gen = .30*Math.sin(y*3.1)+.16;
    const d = Math.abs(x)/Math.max(.02,gen);
    let a = clamp(1-d*d, 0, 1) * clamp(1.15-Math.abs(y-.62)/.52, 0, 1);
    a *= .72 + .28*hash(i*3.7, j*1.9);
    const s = Math.pow(a, .62), o=(j*N+i)*4;
    im.data[o]   = 255*clamp(s*1.5,0,1);
    im.data[o+1] = 255*clamp(s*s*1.15,0,1);
    im.data[o+2] = 255*clamp(Math.pow(s,4.2)*.9,0,1);
    im.data[o+3] = 255*clamp(a*1.25,0,1);
  }
  g.putImageData(im,0,0);
  const tx=new THREE.CanvasTexture(c); tx.colorSpace=THREE.SRGBColorSpace; return tx;
})();

// ── mesale direkleri: ahsap sirik + demir sepet + iki katmanli alev
const mesaleler = [];
{
  const yerler = [];
  for (let i=0;i<10;i++){ const a=i/10*6.28+.35, r=15+((i*7)%5)*2.6;
    yerler.push([Math.cos(a)*r, Math.sin(a)*r]); }
  yerler.push([-5.2,-8.4],[1.4,-11.0],[-9.5,-3.0],[6.0,-6.2]);
  const dMat = MAT(0x3a2a19,.96,.03,D_DERI,1.2), sMat = MAT(0x2b2a2c,.62,.72,D_CELIK,.8,true);
  for (const yer of yerler) {
    const x=yer[0], z=yer[1], y=H(x,z), g=new THREE.Group(); g.position.set(x,y,z);
    const boy = 1.85 + hash(x,z)*.55;
    const sr = uzuv(.055,.042,boy,0x3a2a19,10,D_DERI,.05,1.2); sr.position.y=boy; sr.material=dMat; g.add(sr);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(.115,.075,.20,9,1,true), sMat);
    sp.material.side=THREE.DoubleSide; sp.position.y=boy+.10; g.add(sp);
    for (let k=0;k<3;k++){ const hl=new THREE.Mesh(new THREE.TorusGeometry(.108-k*.018,.010,4,10), sMat);
      hl.rotation.x=Math.PI/2; hl.position.y=boy+.02+k*.08; g.add(hl); }
    const a1 = new THREE.Sprite(new THREE.SpriteMaterial({map:alevDoku, transparent:true,
      blending:THREE.AdditiveBlending, depthWrite:false, opacity:1,
      color:new THREE.Color(5.2, 3.4, 1.7), toneMapped:false}));
    a1.scale.set(.50,.92,1); a1.position.y = boy+.54; g.add(a1);
    const a2 = new THREE.Sprite(new THREE.SpriteMaterial({map:alevDoku, transparent:true,
      blending:THREE.AdditiveBlending, depthWrite:false, opacity:.70,
      color:new THREE.Color(3.4, 1.5, 0.55), toneMapped:false}));
    a2.scale.set(.78,1.34,1); a2.position.y = boy+.66; g.add(a2);
    g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
    scene.add(g); STATIK.push(g);
    mesaleler.push({ g:g, a1:a1, a2:a2, tepe:new THREE.Vector3(x, y+boy+.46, z),
                     faz:hash(x*3.1,z*1.7)*6.28, _d:0 });
  }
}
// ── izgarayi doldur: her mesale + ana ocak birer kaynak
{
  const kay = [];
  for (const m of mesaleler)
    kay.push({ x:m.tepe.x, y:m.tepe.y, z:m.tepe.z, r:1.00, g:.50, b:.19, guc:0.92, menzil:13 });
  kay.push({ x:13, y:H(13,9)+.75, z:9, r:1.00, g:.44, b:.15, guc:2.10, menzil:17 });  // ana ocak
  isimaHesapla(kay);
}
// yurt ic atesleri: her yurdun kapisindan disari vuran sicak isik.
// Yine 'en yakin N' teknigi — sabit shader maliyeti.
const yIsik = [];
for (let i=0;i<2;i++){ const L=new THREE.PointLight(0xff8a3a, 0, 7.5, 2.0); scene.add(L); yIsik.push(L); }
// 5 dinamik isik: her kare en yakin 5 mesaleye atanir (shader maliyeti sabit)
const mIsik = [];
for (let i=0;i<5;i++){ const L=new THREE.PointLight(0xff8434, 0, 18, 2.0); scene.add(L); mIsik.push(L); }

// ═══ SAHNE CANLILIGI: arka plan figurleri ═══
// Tam Insan iskeleti degil (yuzlerce kemik, dovus icin gerekli detay) — bunlar
// sadece uzaktan "hayat var" hissi vermek icin. STATIK havuzuna GIRMEZ (hareketliler),
// ama sayica az oldugu icin cizim cagrisi butcesini (347) etkilemez.
const npcYunMat  = MAT(0x746550,.98,.03,D_KUMAS,2.2);
const npcDeriMat = MAT(0x4a3a26,.94,.05,D_DERI,1.3);
const npcTenMat  = MAT(0x8a6446,.82,.02,D_TEN,.8);
function npcFigur(oturuyor){
  const g = new THREE.Group();
  const pel = new THREE.Group(); pel.position.y = oturuyor ? .30 : .92; g.add(pel);
  const gov = uzuv(.135,.110,.42,0x746550,10,D_KUMAS,.10,1.3); gov.material=npcYunMat;
  gov.position.y = .36; gov.scale.z = .84; pel.add(gov);
  const bas = kure(.082,0x8a6446,1,1.06,1); bas.material=npcTenMat; bas.position.y=.55; pel.add(bas);
  const kep = new THREE.Mesh(new THREE.ConeGeometry(.078,.09,10), npcDeriMat);
  kep.position.y=.60; pel.add(kep);
  // kollar: bir tanesi ates/degnek hareketi yapacak sekilde ayrilir
  const kolSol = new THREE.Group(); kolSol.position.set(.135,.46,0); pel.add(kolSol);
  kolSol.add(Object.assign(uzuv(.036,.028,.24,0x746550,7,D_KUMAS,.08,1.3),{material:npcYunMat}));
  const kolSag = new THREE.Group(); kolSag.position.set(-.135,.46,0); pel.add(kolSag);
  const onKol = new THREE.Group(); onKol.position.y = -.24; kolSag.add(onKol);
  onKol.add(Object.assign(uzuv(.030,.024,.22,0x8a6446,7,D_TEN,.05,.8),{material:npcTenMat}));
  let degnek = null;
  if (oturuyor) {
    for (const s of [-1,1]) { const bac = uzuv(.048,.038,.34,0x4a3a26,8,D_DERI,.06,1.2);
      bac.material = npcDeriMat; bac.position.set(.06*s,-.02,.14); bac.rotation.x = -1.15;
      pel.add(bac); }
    degnek = uzuv(.014,.008,.42,0x3a2a18,6); degnek.position.y=-.42; onKol.add(degnek);
    degnek.rotation.x = .3;
  } else {
    for (const s of [-1,1]) { const bac = uzuv(.052,.040,.46,0x4a3a26,8,D_DERI,.06,1.2);
      bac.material = npcDeriMat; bac.position.set(.06*s,-.46,0); pel.add(bac); }
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.pel = pel; g.userData.kolSag = kolSag; g.userData.onKol = onKol;
  g.userData.bas = bas; g.userData.faz = Math.random()*6.28;
  return g;
}
const npcler = [];
{
  const cx=13, cz=9;                                                // ana ates konumu
  const c1 = npcFigur(true); c1.position.set(cx-1.35, H(cx-1.35,cz+.55), cz+.55);
  c1.rotation.y = 2.1; scene.add(c1); npcler.push({ g:c1, tip:'otur' });
  const c2 = npcFigur(true); c2.position.set(cx+.35, H(cx+.35,cz-1.45), cz-1.45);
  c2.rotation.y = -.9; scene.add(c2); npcler.push({ g:c2, tip:'otur' });
  const c3 = npcFigur(false); c3.position.set(-3.4, H(-3.4,-13.6), -13.6);
  c3.rotation.y = .6; scene.add(c3); npcler.push({ g:c3, tip:'nobet' });
}

// ═══════════ STATIK GEOMETRI BIRLESTIRME ═══════════
// 1232 cizim cagrisi vardi; bunun ~800'u hic hareket etmeyen esyalardan geliyordu.
// Ayni malzemeyi paylasan her sey tek bir geometriye kaynatilir.
// Her MAT() cagrisi yeni malzeme NESNESI uretir; uuid'e gore gruplamak
// hicbir seyi birlestirmiyordu. Gorunusun kendisini anahtar yapiyoruz.
function malzemeImza(m){
  return [m.type, m.color ? m.color.getHexString() : '-',
    m.roughness, m.metalness, m.side, m.transparent ? 1 : 0, m.opacity,
    m.map ? m.map.uuid : '-', m.normalMap ? m.normalMap.uuid : '-',
    m.roughnessMap ? m.roughnessMap.uuid : '-',
    m.normalScale ? m.normalScale.x.toFixed(3) : '-',
    m.userData.kR || '-', m.userData.kG || '-'].join('|');
}
// Bir grubun DOGRUDAN mesh cocuklarini imzaya gore kaynatir.
// Kemik hiyerarsisi korunur → animasyon bozulmaz.
function cocuklariBirlestir(grup){
  const havuz = new Map();
  const gidecek = [];
  for (const c of grup.children){
    if (!c.isMesh || c.isInstancedMesh || c.isSprite) continue;
    if (c.userData.hareketli) continue;                       // ayri animate edilenler
    const mat = Array.isArray(c.material) ? c.material[0] : c.material;
    const k = malzemeImza(mat) + '|' + (c.castShadow ? 1 : 0);
    if (!havuz.has(k)) havuz.set(k, { mat, golge:c.castShadow, list:[] });
    let g = c.geometry.clone();
    if (g.index) g = g.toNonIndexed();
    for (const ad of Object.keys(g.attributes))
      if (ad !== 'position' && ad !== 'normal' && ad !== 'uv') g.deleteAttribute(ad);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv',
      new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2), 2));
    c.updateMatrix(); g.applyMatrix4(c.matrix);
    havuz.get(k).list.push(g); gidecek.push(c);
  }
  if (gidecek.length < 2) return 0;
  for (const c of gidecek) grup.remove(c);
  let s = 0;
  for (const { mat, golge, list } of havuz.values()){
    const bir = mergeGeometries(list, false);
    for (const g of list) g.dispose();
    if (!bir) continue;
    const m = new THREE.Mesh(bir, mat);
    m.castShadow = golge; m.receiveShadow = true;
    grup.add(m); s++;
  }
  return s;
}
// Karakterin butun kemiklerinde tekrarla (govde, bas, kol, bacak, kilic...)
function iskeletiBirlestir(kok){
  let toplam = 0;
  const gruplar = [];
  kok.traverse(o => { if (o.isGroup || o.isObject3D && !o.isMesh) gruplar.push(o); });
  for (const g of gruplar) toplam += cocuklariBirlestir(g);
  return toplam;
}

function statikleriBirlestir(){
  const havuz = new Map();
  const tasinacak = [];
  for (const kok of STATIK){
    kok.updateMatrixWorld(true);
    kok.traverse(o => {
      if (o.isSprite || o.isPoints || o.isLight) { tasinacak.push(o); return; }
      if (!o.isMesh || o.isInstancedMesh) return;
      let g = o.geometry.clone();
      if (g.index) g = g.toNonIndexed();
      for (const ad of Object.keys(g.attributes))
        if (ad !== 'position' && ad !== 'normal' && ad !== 'uv') g.deleteAttribute(ad);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute('uv',
        new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2), 2));
      g.applyMatrix4(o.matrixWorld);
      const mat = Array.isArray(o.material) ? o.material[0] : o.material;
      const anahtar = malzemeImza(mat) + '|' + (o.castShadow ? 1 : 0);
      if (!havuz.has(anahtar)) havuz.set(anahtar, { mat, golge:o.castShadow, list:[] });
      havuz.get(anahtar).list.push(g);
    });
  }
  for (const o of tasinacak) scene.attach(o);          // alevler dunya uzayina tasinir
  for (const kok of STATIK) scene.remove(kok);
  let kayan = 0;
  for (const { mat, golge, list } of havuz.values()){
    const bir = mergeGeometries(list, false);
    for (const g of list) g.dispose();
    if (!bir) continue;
    const m = new THREE.Mesh(bir, mat);
    m.castShadow = golge; m.receiveShadow = true;
    scene.add(m); kayan++;
  }
  STATIK.length = 0;
  return kayan;
}

// ═══════════ 9. PARÇACIKLAR ═══════════
function noktaDoku(renk){ const c=document.createElement('canvas'); c.width=c.height=32;
  const g=c.getContext('2d'), gr=g.createRadialGradient(16,16,0,16,16,16);
  gr.addColorStop(0,renk+'1)'); gr.addColorStop(.4,renk+'.5)'); gr.addColorStop(1,renk+'0)');
  g.fillStyle=gr; g.fillRect(0,0,32,32); return new THREE.CanvasTexture(c); }
function havuz(n, mat){
  const g=new THREE.BufferGeometry(), p=new Float32Array(n*3), d=[];
  for(let i=0;i<n;i++){ p[i*3+1]=-999; d.push({o:0,x:0,y:0,z:0,vx:0,vy:0,vz:0}); }
  g.setAttribute('position', new THREE.BufferAttribute(p,3));
  const pts=new THREE.Points(g, mat); pts.frustumCulled=false; scene.add(pts);
  return { g, p, d, i:0, n,
    at(x,y,z,say,hiz,yer,om){ for(let k=0;k<say;k++){ const q=this.d[this.i];
      q.x=x+(Math.random()-.5)*.4; q.y=y+(Math.random()-.5)*.3; q.z=z+(Math.random()-.5)*.4;
      q.vx=(Math.random()-.5)*hiz; q.vy=Math.random()*hiz*.8+hiz*.2; q.vz=(Math.random()-.5)*hiz;
      q.g=yer; q.o=om*(.6+Math.random()*.7); this.i=(this.i+1)%this.n; } },
    tik(dt){ const p=this.p;
      for(let i=0;i<this.n;i++){ const q=this.d[i];
        if(q.o>0){ q.o-=dt; q.x+=q.vx*dt; q.y+=q.vy*dt; q.z+=q.vz*dt; q.vy-=(q.g||0)*dt;
          q.vx*=.985; q.vz*=.985; p[i*3]=q.x; p[i*3+1]=q.y; p[i*3+2]=q.z; }
        else p[i*3+1]=-999; }
      this.g.attributes.position.needsUpdate=true; } };
}
const kivilcim = havuz(300, new THREE.PointsMaterial({ toneMapped:false,
  color:new THREE.Color(3.0,2.4,1.4), map:noktaDoku('rgba(255,226,160,'),
  size:.30, transparent:true, opacity:1, depthWrite:false, blending:THREE.AdditiveBlending }));
const toz = havuz(420, new THREE.PointsMaterial({ map:noktaDoku('rgba(212,196,158,'),
  size:.60, transparent:true, opacity:.55, depthWrite:false }));
const atesKiv = havuz(220, new THREE.PointsMaterial({ toneMapped:false,
  color:new THREE.Color(3.6,1.9,0.7), map:noktaDoku('rgba(255,168,78,'),
  size:.22, transparent:true, opacity:.70, depthWrite:false, blending:THREE.AdditiveBlending }));
const duman = havuz(260, new THREE.PointsMaterial({ map:noktaDoku('rgba(58,54,68,'),
  size:2.1, color:0x6a6474, transparent:true, opacity:.085, depthWrite:false }));

// ── havada asılı toz zerreleri (atmosfer)
const ZERRE = 900;
const zerreG = new THREE.BufferGeometry();
{
  const zp = new Float32Array(ZERRE*3);
  for (let i=0;i<ZERRE;i++){ zp[i*3]=(Math.random()-.5)*70; zp[i*3+1]=Math.random()*16; zp[i*3+2]=(Math.random()-.5)*70; }
  zerreG.setAttribute('position', new THREE.BufferAttribute(zp,3));
}
const zerreler = new THREE.Points(zerreG, new THREE.PointsMaterial({
  map: noktaDoku('rgba(214,206,190,'), size:.085, transparent:true, opacity:.55,
  depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true }));
zerreler.frustumCulled = false; scene.add(zerreler);

// ── ALCAK YER PUSU: yatay yumusak katmanlar, derinlik hissi verir
const pusDoku = (()=>{
  const N=128, c=_tuval(N), g=c.getContext('2d'), im=g.createImageData(N,N);
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){
    const f = fbm(i*.045+3.3, j*.045-1.7, 5);
    const kenarSol = Math.min(i,N-1-i)/ (N*.42), kenarUst = Math.min(j,N-1-j)/(N*.42);
    const mask = clamp(kenarSol,0,1)*clamp(kenarUst,0,1);
    const a = clamp((f-.36)*2.4, 0, 1) * mask, o=(j*N+i)*4;
    im.data[o]=im.data[o+1]=im.data[o+2]=255;
    im.data[o+3]=255*a;
  }
  g.putImageData(im,0,0);
  const tx=new THREE.CanvasTexture(c); tx.wrapS=tx.wrapT=THREE.RepeatWrapping; return tx;
})();
// NOT: 5 adet aydinlatilmamis sis duzlemi vardi (MeshBasicMaterial). Isik almadigi
// icin "siste isik" degil "duz gri tul" ekliyordu. Hacimsel isik pasi devreye
// girdiginde hem gereksiz hem zararli hale geldi — kaldirildi, cizim cagrisi da dustu.
const pusKatlari = [];

// ── icerik hazir: birlestir ve golge yukunu dusur
{
  // alev sprite'larinin taban konumunu sakla (artik dunya uzayindalar)
  for (const m of mesaleler) { m.a1b = m.a1.position.clone(); m.a2b = m.a2.position.clone(); }
  const kac = statikleriBirlestir();
  for (const m of mesaleler) { m.a1b = m.a1.position.clone(); m.a2b = m.a2.position.clone(); }
  // kalabalik ornekli geometri golge YAYMASIN (cim, tas, dal — 46 bin nesne)
  scene.traverse(o => { if (o.isInstancedMesh && o.count > 150) o.castShadow = false; });
  console.log('birlestirilen cizim grubu:', kac, '| karakter:', togan.birlesikSayi, kaya.birlesikSayi);
}

// ═══════════ 10. POST ═══════════
// derinlik dokusu: SSAO icin. Iki hedef de AYNI dokuyu paylasir ki
// EffectComposer tampon takasi yapsa bile derinlik hep ayni yerde olsun.
const _pr = renderer.getPixelRatio();
const anaRT = new THREE.WebGLRenderTarget(innerWidth*_pr, innerHeight*_pr, { type: THREE.HalfFloatType });
anaRT.depthTexture = new THREE.DepthTexture(innerWidth*_pr, innerHeight*_pr);
anaRT.depthTexture.type = THREE.UnsignedIntType;
const composer = new EffectComposer(renderer, anaRT);
composer.renderTarget2.depthTexture = anaRT.depthTexture;
composer._pixelRatio = _pr; composer._width = innerWidth; composer._height = innerHeight;
composer.addPass(new RenderPass(scene, camera));

// ── ORTAM KAPANMASI: nesnelerin zeminle bulustugu yeri karartir.
// "CG mi gercek mi" ayrimindaki en guclu tek ipucu budur.
const aoPass = new ShaderPass({
  uniforms: {
    tDiffuse:{value:null}, tDepth:{value:anaRT.depthTexture},
    projTers:{value:new THREE.Matrix4()}, proj:{value:new THREE.Matrix4()},
    coz:{value:new THREE.Vector2(1,1)},
    yaricap:{value:.52}, guc:{value:1.25}, egilim:{value:.045}, karisim:{value:.88}
  },
  vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
    uniform sampler2D tDiffuse, tDepth;
    uniform mat4 projTers, proj;
    uniform vec2 coz;
    uniform float yaricap, guc, egilim, karisim;
    varying vec2 vUv;
    vec3 gorusPoz(vec2 uv){
      float d = texture2D(tDepth, uv).x;
      vec4 c = projTers * vec4(uv*2.0-1.0, d*2.0-1.0, 1.0);
      return c.xyz / c.w;
    }
    void main(){
      vec4 renk = texture2D(tDiffuse, vUv);
      float d0 = texture2D(tDepth, vUv).x;
      if (d0 >= 0.99995) { gl_FragColor = renk; return; }      // gokyuzu
      vec3 pz = gorusPoz(vUv);
      vec2 px = 1.0/coz;
      // komsu derinliklerden normal — kenarda yakin olani sec (siluet bozulmasin)
      vec3 pr = gorusPoz(vUv+vec2(px.x,0.0)), pl = gorusPoz(vUv-vec2(px.x,0.0));
      vec3 pu = gorusPoz(vUv+vec2(0.0,px.y)), pd = gorusPoz(vUv-vec2(0.0,px.y));
      vec3 dx = (abs(pr.z-pz.z) < abs(pl.z-pz.z)) ? (pr-pz) : (pz-pl);
      vec3 dy = (abs(pu.z-pz.z) < abs(pd.z-pz.z)) ? (pu-pz) : (pz-pd);
      vec3 nrm = normalize(cross(dx, dy));
      float gr = fract(sin(dot(vUv*coz, vec2(12.9898,78.233)))*43758.5453);
      float kap = 0.0;
      const int N = 9;
      for (int i=0;i<N;i++){
        float a = (float(i)+gr)*2.3999632;                      // altin aci spirali
        float r = yaricap * sqrt((float(i)+0.5)/float(N));
        vec3 ornek = pz + vec3(cos(a),sin(a),0.0)*r + nrm*r*0.42;
        vec4 kl = proj * vec4(ornek, 1.0);
        vec2 uv2 = (kl.xy/kl.w)*0.5+0.5;
        if (uv2.x<0.0||uv2.x>1.0||uv2.y<0.0||uv2.y>1.0) continue;
        vec3 q = gorusPoz(uv2);
        vec3 fark = q - pz;
        float uz = length(fark);
        float ort = max(0.0, dot(nrm, fark/max(uz,1e-4)) - egilim);
        kap += ort * (yaricap / max(yaricap, uz));              // menzil azalmasi
      }
      float ao = clamp(1.0 - kap*guc/float(N), 0.0, 1.0);
      ao = mix(1.0, ao, karisim);
      gl_FragColor = vec4(renk.rgb * ao, renk.a);
    }`
});
aoPass.material.depthWrite = false; aoPass.material.depthTest = false;
composer.addPass(aoPass);
// ═══ HACIMSEL ISIK ═══
// Karanlik sahneyi okunur yapan sey isigin HAVADA gorunmesidir. Onceki huzmePass
// sadece aydan gelen ekran-uzayi radyal bulanikligiydi; mesaleler havayi hic
// aydinlatmiyordu. Burada kameradan sahne derinligine isin yurutulur ve her adimda
// en yakin 6 isigin katkisi toplanir. Sahne TEKRAR CIZILMEZ — mevcut derinlik yeter.
const HACIM_N = 6;                                   // eszamanli isik sayisi
const hacimPass = new ShaderPass({
  uniforms: {
    tDiffuse:{value:null}, tDepth:{value:anaRT.depthTexture},
    projTers:{value:new THREE.Matrix4()}, kamMat:{value:new THREE.Matrix4()},
    kamPoz:{value:new THREE.Vector3()},
    isikPoz:{value:Array.from({length:HACIM_N},()=>new THREE.Vector3())},
    isikRenk:{value:Array.from({length:HACIM_N},()=>new THREE.Vector3())},
    isikMenzil:{value:new Float32Array(HACIM_N)},
    zeminY:{value:0}, yogunluk:{value:0.125}, adimSay:{value:10}, enUzak:{value:64},
    gokRenk:{value:new THREE.Vector3(0.052,0.070,0.125)}, gokYog:{value:0.10},
    pusRenk:{value:new THREE.Vector3(0.045,0.058,0.098)}, pusGuc:{value:0.62}
  },
  vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
    uniform sampler2D tDiffuse, tDepth;
    uniform mat4 projTers, kamMat; uniform vec3 kamPoz;
    uniform vec3 isikPoz[${HACIM_N}]; uniform vec3 isikRenk[${HACIM_N}];
    uniform float isikMenzil[${HACIM_N}];
    uniform float zeminY, yogunluk, enUzak, gokYog, pusGuc;
    uniform vec3 gokRenk, pusRenk; uniform int adimSay;
    varying vec2 vUv;
    void main(){
      vec4 taban = texture2D(tDiffuse, vUv);
      float dz = texture2D(tDepth, vUv).x;
      // pikselin goruş-uzayi konumu → dunya konumu
      vec4 gk = projTers * vec4(vUv*2.0-1.0, dz*2.0-1.0, 1.0);
      vec3 gp = gk.xyz / gk.w;
      vec3 dp = (kamMat * vec4(gp, 1.0)).xyz;
      vec3 yon = dp - kamPoz;
      float sahneMes = length(yon);
      yon /= max(sahneMes, 1e-4);
      float mes = min(sahneMes, enUzak);
      float adim = mes / float(adimSay);
      // Serpistirme: duz rastgele hash statik gurultu birakiyordu. Interleaved-gradient
      // noise (AAA standardi) ayni bant kirmayi cok daha ince, film grenine benzer bir
      // desenle yapar — ayni maliyet, cok daha az goze batar.
      vec2 pk = gl_FragCoord.xy;
      float serp = fract(52.9829189 * fract(0.06711056*pk.x + 0.00583715*pk.y));
      vec3 top = vec3(0.0);
      for (int i = 0; i < 24; i++){
        if (i >= adimSay) break;
        float ilerleme = adim * (float(i) + serp);
        vec3 s = kamPoz + yon * ilerleme;
        // yukseklik yogunlugu: sis yere yakin toplanir
        float yog = exp(-max(0.0, s.y - zeminY) * 0.30);
        // ── YUKSEKLIK SISI: gokyuzu sacilmasi. Ayri pas gerekmiyor, ayni isin
        // yurutmesinde bedava geliyor. Yere yakin yogun, yukarida seyrek.
        for (int L = 0; L < ${HACIM_N}; L++){
          vec3 dl = isikPoz[L] - s;
          float d2 = dot(dl, dl);
          float mr = isikMenzil[L];
          if (mr <= 0.01) continue;
          float kes = clamp(1.0 - d2 / (mr*mr), 0.0, 1.0);
          top += isikRenk[L] * (kes * kes / (1.0 + d2 * 0.42)) * yog;
        }
      }
      // ── HAVA PERSPEKTIFI (analitik, TUM mesafe) ──
      // Isin yurutmesi 64 m'de kesiliyor; oradan hesaplanan pus 300 m'deki daglara
      // ulasmiyordu ve uzak siluetler duz koyu lekeler halinde kaliyordu.
      // Beer-Lambert ile mesafeye gore KARISTIRMA yapmak hem dogru hem daha ucuz:
      // uzak nesneler pus RENGINE doner, sadece parlamaz.
      float tamMes = min(sahneMes, 1200.0);
      float pus = 1.0 - exp(-tamMes * 0.0034);
      vec3 sonuc = mix(taban.rgb, pusRenk, clamp(pus * pusGuc, 0.0, 0.90));
      gl_FragColor = vec4(sonuc + top * adim * yogunluk, taban.a);
    }`
});
hacimPass.material.depthWrite = false; hacimPass.material.depthTest = false;
composer.addPass(hacimPass);

// ═══ EKRAN-UZAYI YANSIMALAR ═══
// Kup harita tek noktadan cekiliyor: birikinti 3 m otedeki mesaleyi degil bulanik
// bir ortalamayi yansitiyor, paralaks olmayinca yansima sahte duruyor. Burada
// ekran uzayinda isin yurutup GERCEK sahneyi yansitiyoruz.
const ssrPass = new ShaderPass({
  uniforms: {
    tDiffuse:{value:null}, tDepth:{value:anaRT.depthTexture},
    proj:{value:new THREE.Matrix4()}, projTers:{value:new THREE.Matrix4()},
    coz:{value:new THREE.Vector2(1,1)}, yukariGorus:{value:new THREE.Vector3(0,1,0)},
    guc:{value:0.85}, menzil:{value:26.0}
  },
  vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
    uniform sampler2D tDiffuse, tDepth;
    uniform mat4 proj, projTers; uniform vec2 coz; uniform vec3 yukariGorus;
    uniform float guc, menzil;
    varying vec2 vUv;
    vec3 gp(vec2 uv){
      float d = texture2D(tDepth, uv).x;
      vec4 c = projTers * vec4(uv*2.0-1.0, d*2.0-1.0, 1.0);
      return c.xyz / c.w;
    }
    void main(){
      vec4 taban = texture2D(tDiffuse, vUv);
      float islak = clamp(taban.a, 0.0, 1.0);
      float d0 = texture2D(tDepth, vUv).x;
      if (islak < 0.22 || d0 >= 0.9995) { gl_FragColor = vec4(taban.rgb, 1.0); return; }
      vec3 pz = gp(vUv);
      vec2 px = 1.0/coz;
      vec3 pr = gp(vUv+vec2(px.x,0.0)), pl = gp(vUv-vec2(px.x,0.0));
      vec3 pu = gp(vUv+vec2(0.0,px.y)), pd = gp(vUv-vec2(0.0,px.y));
      vec3 dx = (abs(pr.z-pz.z) < abs(pl.z-pz.z)) ? (pr-pz) : (pz-pl);
      vec3 dy = (abs(pu.z-pz.z) < abs(pd.z-pz.z)) ? (pu-pz) : (pz-pd);
      vec3 nrm = normalize(cross(dx, dy));
      // sadece YUKARI bakan yuzeyler yansitir (su birikintisi). Bu ayni zamanda
      // havadaki alev sprite'larinin yanlislikla maskeye girmesini de engelliyor.
      float yukari = dot(nrm, yukariGorus);
      if (yukari < 0.55) { gl_FragColor = vec4(taban.rgb, 1.0); return; }
      vec3 R = reflect(normalize(pz), nrm);
      if (R.z > 0.0) { gl_FragColor = vec4(taban.rgb, 1.0); return; }   // kameraya dogru
      float adim = menzil / 20.0;
      float serp = fract(52.9829189 * fract(0.06711056*gl_FragCoord.x + 0.00583715*gl_FragCoord.y));
      vec3 s = pz + nrm*0.03 + R*adim*serp;
      vec3 yansi = vec3(0.0); float bul = 0.0;
      for (int i = 0; i < 20; i++){
        s += R * adim;
        vec4 kl = proj * vec4(s, 1.0);
        vec2 uv2 = kl.xy/kl.w * 0.5 + 0.5;
        if (uv2.x < 0.0 || uv2.x > 1.0 || uv2.y < 0.0 || uv2.y > 1.0) break;
        vec3 q = gp(uv2);
        float fark = q.z - s.z;                      // + ise sahne yuzeyi isinin onunde
        if (fark > 0.02 && fark < adim*2.2){
          yansi = texture2D(tDiffuse, uv2).rgb;
          // ekran kenarina yaklasinca sondur (SSR'in klasik zayifligi:
          // ekran disindaki bilgi yok, sert kesim goze batar)
          vec2 kk = abs(uv2*2.0 - 1.0);
          bul = clamp((1.0 - max(kk.x, kk.y)) * 3.0, 0.0, 1.0);
          break;
        }
      }
      // Fresnel: siyirtma acisinda yansima cok daha guclu (gercek su boyle davranir)
      float fres = pow(1.0 - clamp(-normalize(pz).z * yukari, 0.0, 1.0), 3.0);
      gl_FragColor = vec4(taban.rgb + yansi * (guc * islak * bul * (0.30 + 0.70*fres)), 1.0);
    }`
});
ssrPass.material.depthWrite = false; ssrPass.material.depthTest = false;
composer.addPass(ssrPass);

// ── ALAN DERINLIGI: mevcut derinlik dokusunu kullanir, sahneyi tekrar cizmez
const dofPass = new ShaderPass({
  uniforms:{ tDiffuse:{value:null}, tDepth:{value:anaRT.depthTexture},
             projTers:{value:new THREE.Matrix4()}, coz:{value:new THREE.Vector2(1,1)},
             odak:{value:8}, menzil:{value:34}, enBulanik:{value:4}, onGuc:{value:.35} },
  vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
    uniform sampler2D tDiffuse, tDepth; uniform mat4 projTers; uniform vec2 coz;
    uniform float odak, menzil, enBulanik, onGuc; varying vec2 vUv;
    float gorusZ(vec2 uv){
      float d = texture2D(tDepth, uv).x;
      vec4 c = projTers * vec4(uv*2.0-1.0, d*2.0-1.0, 1.0);
      return -c.z / c.w;
    }
    void main(){
      float z = gorusZ(vUv);
      float k = clamp(abs(z - odak) / menzil, 0.0, 1.0);
      if (z < odak) k *= onGuc;                        // on plan daha az bulanik
      float yari = pow(k, 1.35) * enBulanik;
      if (yari < 0.35) { gl_FragColor = texture2D(tDiffuse, vUv); return; }
      vec3 top = vec3(0.0); float ag = 0.0;
      for (int i=0;i<10;i++){
        float a = float(i)*2.3999632;
        float r = sqrt((float(i)+0.5)/10.0) * yari;
        vec2 uv2 = vUv + vec2(cos(a), sin(a)) * r / coz;
        float z2 = gorusZ(uv2);
        // arkadaki bulanik pikselin one sizmasini engelle
        float w = (z2 > odak - 0.5) ? 1.0 : 0.25;
        top += texture2D(tDiffuse, uv2).rgb * w; ag += w;
      }
      gl_FragColor = vec4(top/max(ag,0.001), 1.0);
    }`
});
dofPass.material.depthWrite = false; dofPass.material.depthTest = false;
composer.addPass(dofPass);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), .62, .72, 1.15));
// ── AY HÜZMELERİ: ekran-uzayı ışık saçılması (Elden Ring imzası)
const huzmePass = new ShaderPass({
  uniforms:{ tDiffuse:{value:null}, isikPos:{value:new THREE.Vector2(.5,.8)},
             guc:{value:0.0}, yogunluk:{value:.62}, sonme:{value:.955} },
  vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
    uniform sampler2D tDiffuse; uniform vec2 isikPos;
    uniform float guc, yogunluk, sonme; varying vec2 vUv;
    void main(){
      vec4 taban = texture2D(tDiffuse, vUv);
      if (guc <= 0.001) { gl_FragColor = taban; return; }
      vec2 dlt = (vUv - isikPos) * (1.0/14.0) * yogunluk;
      vec2 uv = vUv; float dec = 1.0; vec3 top = vec3(0.0);
      for (int i=0;i<14;i++){
        uv -= dlt;
        vec3 s = texture2D(tDiffuse, uv).rgb;
        float parlak = max(0.0, dot(s, vec3(.299,.587,.114)) - 0.80);
        top += s * parlak * dec;
        dec *= sonme;
      }
      gl_FragColor = vec4(taban.rgb + top * (guc/14.0) * 2.6, taban.a);
    }`
});
composer.addPass(huzmePass);

const gradePass = new ShaderPass({
  uniforms:{ tDiffuse:{value:null}, vig:{value:1}, doy:{value:.72}, t:{value:0}, ka:{value:.0021}, poz:{value:1.42} },
  vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse; uniform float vig, doy, t, ka, poz; varying vec2 vUv;
    void main(){ vec2 p=(vUv-.5)*vec2(1.10,1.);
      // KROMATİK SAPMA: kenara gittikçe artan lens ayrışması (R/B farklı UV'den okunur)
      float kk = dot(p,p) * ka;
      vec2 yonR = p * kk, yonB = p * kk * 1.6;
      vec4 c; c.r = texture2D(tDiffuse, vUv - yonR).r;
      c.g = texture2D(tDiffuse, vUv).g;
      c.b = texture2D(tDiffuse, vUv + yonB).b;
      c.a = 1.0;
      // ── LINEAR UZAYDA RENKLENDIRME (tonlamadan ONCE) ──
      c.rgb = max(c.rgb, 0.0) * poz;
      float l = dot(c.rgb, vec3(.299,.587,.114));
      c.rgb = mix(vec3(l), c.rgb, doy);                                         // doygunluk
      // ELDEN RING: golgeler soguk-mavi, isiklar sicak-kehribar. HDR'de carpimsal
      // tonlama toplamsaldan guvenli (parlak bolgelerde renk kacirmaz).
      float ton = smoothstep(0.0, 0.85, l);
      c.rgb *= mix(vec3(0.90,0.96,1.16), vec3(1.14,1.02,0.86), ton);
      // ── FILMIK TONLAMA (ACES uyarlamasi) — post zincirinin SONU ──
      // Golgede yumusak (toe), orta tonda sert, en parlakta yumusak (shoulder).
      // Parlak bolgelerin dogal sekilde beyaza doymasina izin verilir.
      { vec3 x = c.rgb * 0.62;
        c.rgb = clamp((x*(2.51*x+0.03)) / (x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
      // ── GORUNTU UZAYI: ACES'in yumusak toe'su siyahlari kaldiriyor, geri bastir
      c.rgb = pow(c.rgb, vec3(1.28));
      c.rgb *= mix(1., smoothstep(1.22,.36,length(p)), vig);                     // vinyet
      float grain = fract(sin(dot(vUv*vec2(1.0,1.0)+t, vec2(12.9898,78.233)))*43758.5453);
      c.rgb += (grain-0.5)*0.016;
      gl_FragColor=c; }`
});
composer.addPass(gradePass);
composer.addPass(new SMAAPass());   // tirtikli kenarlar 'amatör WebGL' diye bagiriyordu

// ═══════════ 11. GİRDİ ═══════════
const tus = {}; let blokBasili = false;
addEventListener('keydown', e => { sesBaslat(); const k=e.key.toLowerCase(); tus[k]=true;
  if (k===' ') { e.preventDefault(); diyalogAcik ? diyalogIlerle() : null; }
  if (k==='e') { diyalogAcik ? diyalogIlerle() : etkilesim(); }
  if (k==='shift' && !diyalogAcik) taklaYap();
  if (k==='enter' && diyalogAcik) diyalogIlerle();
});
addEventListener('keyup', e => tus[e.key.toLowerCase()]=false);
const cv = document.getElementById('c');
let kamYaw=Math.PI, kamPitch=.20, kamMes=8.0;
const kilitBilgi = document.getElementById('kilitBilgi');
cv.addEventListener('contextmenu', e => e.preventDefault());
function kilitli(){ return document.pointerLockElement === cv; }
cv.addEventListener('pointerdown', e => {
  sesBaslat();
  if (!kilitli()) { cv.requestPointerLock(); return; }      // ilk tık: fareyi kilitle
  if (e.button === 2) { blokBasili = true; return; }
  if (e.button === 0 && !diyalogAcik) vurYap();
});
addEventListener('pointerup', e => { if (e.button===2) blokBasili=false; });
document.addEventListener('pointerlockchange', () => {
  if (kilitBilgi) kilitBilgi.style.opacity = kilitli() ? 0 : 1;
  if (!kilitli()) blokBasili = false;
});
addEventListener('mousemove', e => {
  if (!kilitli()) return;
  kamYaw   -= e.movementX * .0026;
  kamPitch  = clamp(kamPitch + e.movementY * .0021, .02, 1.12);
});
cv.addEventListener('wheel', e => { kamMes = clamp(kamMes*(1+Math.sign(e.deltaY)*.12), 3.4, 24);
  e.preventDefault(); }, {passive:false});

// ═══════════ 12. DİYALOG ═══════════
const dEl=document.getElementById('diyalog'), dAd=document.getElementById('dad'),
      dMt=document.getElementById('dmetin'), ipEl=document.getElementById('ipucu'),
      gorevEl=document.getElementById('gorev');
let diyalogAcik=false, dS=[], dI=0, dY=0, dT='', dBitti=null;
function konus(satirlar, bitti){ dS=satirlar; dI=-1; dBitti=bitti||null;
  diyalogAcik=true; dEl.classList.add('acik'); diyalogIlerle(); }
function diyalogIlerle(){
  if (dY < dT.length) { dY = dT.length; dMt.textContent = dT; return; }
  dI++;
  if (dI >= dS.length) { diyalogAcik=false; dEl.classList.remove('acik');
    const f=dBitti; dBitti=null; if(f) f(); return; }
  dAd.textContent = dS[dI][0]; dAd.style.display = dS[dI][0] ? '' : 'none';
  dT = dS[dI][1]; dY = 0; dMt.textContent = '';
}
function gorev(m){ gorevEl.textContent = m; }

// ═══════════ 13. DÖVÜŞ / AKIŞ ═══════════
let sarsinti=0, hitstop=0, kuklaHiz=0, kuklaAci=0, agirCekim=0, riposteT=-9, sinematik=4.2;
let asama='talim', vurusSayisi=0, sparVurus=0, parrySayisi=0;
// Bolum ilerledikce gun agarir. Kitapta 'Sessiz Talim' safaktan once baslar,
// bolum safakla biter — oynanis bunu takip eder.
const ZAMAN_ASAMA = { talim:0, kaya_geldi:0.10, spar:0.18, devrilme:0.30,
                      ders:0.42, parry_sinavi:0.62, bitti:1.0 };
function asamaAyarla(yeni){ asama = yeni; zamanHedef = ZAMAN_ASAMA[yeni] ?? zamanHedef; }
let kayaHedefX=null, kayaHedefZ=null, kayaBekle=0, kayaMod='dur';
let togKombo=0, togKomboT=-9;
const HUD = { can:document.getElementById('can'), denge:document.getElementById('denge'),
  kcan:document.getElementById('kcan'), kutu:document.getElementById('dovusHud') };

// ── KOMBO: hafif1 → hafif2 → hafif3(bitirici). Toparlanma sirasinda basilan
// tus TAMPONLANIR; pencere kacinca zincir sifirlanir.
let komboTampon = 0;
function vurYap(){
  if (togan.eylem === 'devril_bekle' || diyalogAcik) return;
  const E = togan.eylem;
  // toparlanma penceresinde basilirsa tamponla (girdi yutulmasin)
  if (togan.mesgul()) {
    const T = { hafif1:.50, hafif2:.54, hafif3:.76, saplama:.62, riposte:.52 }[E];
    if (T && togan.eT / T > .52) komboTampon = saat;
    return;
  }
  // savusturma sonrasi kisa pencere → OLUMCUL KARSI VURUS
  if (saat - riposteT < 1.15) { riposteT = -9; togKombo = 0; togan.basla('riposte'); return; }
  // ileri tusu basiliysa saplama (uzun menzil, dar aci)
  if (tus['w'] && !tus['a'] && !tus['d']) { togKombo = 0; togKomboT = saat; togan.basla('saplama'); return; }
  const zincirde = (saat - togKomboT) < 1.05;
  togKombo = zincirde ? Math.min(2, togKombo + 1) : 0;
  togKomboT = saat;
  togan.basla(['hafif1','hafif2','hafif3'][togKombo]);
}
function taklaYap(){
  if (togan.mesgul() || togan.eylem==='devril_bekle') return;
  togan.basla('takla');
  // yon tusu varsa o yone, yoksa bakilan yone
  let ix=0, iz=0;
  if (tus['w']) iz-=1; if (tus['s']) iz+=1; if (tus['a']) ix-=1; if (tus['d']) ix+=1;
  const ile = new THREE.Vector3(Math.sin(togan.kok.rotation.y),0,Math.cos(togan.kok.rotation.y));
  if (ix || iz) {
    const nn=Math.hypot(ix,iz); ix/=nn; iz/=nn;
    ile.set(Math.sin(kamYaw)*iz + Math.cos(kamYaw)*ix, 0, Math.cos(kamYaw)*iz - Math.sin(kamYaw)*ix).normalize();
    hedefYaw = Math.atan2(ile.x, ile.z);
  }
  taklaVek.copy(ile).multiplyScalar(9.6); taklaSure = .56;
  toz.at(togan.kok.position.x, togan.kok.position.y+.15, togan.kok.position.z, 8, 1.6, 2.4, .7);
}
const taklaVek = new THREE.Vector3(); let taklaSure = 0;

function darbeUygula(vuran, hedef, guc, tur){
  const d = vuran.kok.position.distanceTo(hedef.kok.position);
  const ileri = new THREE.Vector3(Math.sin(vuran.kok.rotation.y),0,Math.cos(vuran.kok.rotation.y));
  const yon = hedef.kok.position.clone().sub(vuran.kok.position).setY(0).normalize();
  const onunde = ileri.dot(yon) > .35;
  if (d > 2.85 || !onunde) { return false; }
  const carpmaY = hedef.kok.position.y + 1.25;
  // PARRY?
  if (hedef.eylem === 'parry' && hedef.eT < .22) {
    S.parry(); sarsinti = .8; hitstop = .13;
    kivilcim.at(carpmaY!==0?hedef.kok.position.x:0, carpmaY, hedef.kok.position.z, 26, 9, 16, .55);
    vuran.basla('hasar'); vuran.denge = Math.max(0, vuran.denge - 40);
    if (hedef === togan) { riposteT = saat; agirCekim = .34; fovTekme = -2.4; }
    return 'parry';
  }
  // BLOK?
  if (hedef.eylem === 'blok' || hedef.eylem === 'blokDarbe') {
    S.celik(); sarsinti = .55; hitstop = .12;
    // kivilcimlar kilicin oldugu yerden, saldirinin yonune dogru saciliyor
    kivilcim.at(hedef.kok.position.x + yon.x*.35, carpmaY + .10, hedef.kok.position.z + yon.z*.35,
                22, 8, 15, .5);
    if (hedef === togan) { fovTekme = 3.0; kamYumV.addScaledVector(yon, 5.0); }
    hedef.denge = Math.max(0, hedef.denge - guc*.55);
    hedef.basla('blokDarbe');
    const gi = yon.clone().multiplyScalar(guc*.020);
    hedef.kok.position.x += gi.x; hedef.kok.position.z += gi.z;   // siper altinda geri kayma
    if (hedef.denge <= 0) { hedef.basla('hasar'); hedef.denge = 45; }
    return 'blok';
  }
  // TAKLA i-frame?
  if (hedef.eylem === 'takla' && hedef.eT > .06 && hedef.eT < .40) { S.islik(); return 'kacti'; }
  // TAM İSABET — bitirici ve karsi vurus daha tok
  const tok = (tur === 'hafif3' || tur === 'riposte' || tur === 'agir');
  S.darbe(); sarsinti = tok ? .95 : .55; hitstop = tok ? .20 : .13;
  if (tok && vuran === togan) agirCekim = .30;
  if (vuran === togan) { fovTekme = 5.2; kamYumV.addScaledVector(yon, 7.5); }
  { let ha = Math.atan2(-yon.x, -yon.z) - hedef.kok.rotation.y;      // darbenin geldigi yon
    while (ha > Math.PI) ha -= 6.283; while (ha < -Math.PI) ha += 6.283;
    hedef.hasarYon = ha; }
  kivilcim.at(hedef.kok.position.x, carpmaY, hedef.kok.position.z, 18, 7, 15, .45);
  toz.at(hedef.kok.position.x, hedef.kok.position.y+.2, hedef.kok.position.z, 6, 1.4, 2, .6);
  hedef.can = Math.max(0, hedef.can - guc);
  hedef.denge = Math.max(0, hedef.denge - guc*1.4);
  hedef.basla('hasar');
  const it = yon.multiplyScalar(guc*.045);
  hedef.kok.position.x += it.x; hedef.kok.position.z += it.z;
  return 'isabet';
}

// ── Kaya YZ
// ═══ KAYA'NIN DUELLO YAPAY ZEKASI ═══
// Onceden: yaklas + her 2 saniyede bir salla. Simdi: cember cizer, savurmayi
// gorup savusturur/bloklar, zincir vurus yapar, feint atar, Togan isabet
// aldikca ofkelenip hizlanir (kitapta da once ogretmen, sonra ciddilesir).
let kZincir = 0, kOfke = 0, kYon = 1, kBlokSure = 0;
function kayaYZ(dt){
  if (asama !== 'spar' && asama !== 'parry_sinavi') { kaya._blok = false; return; }
  const dx = togan.kok.position.x - kaya.kok.position.x;
  const dz = togan.kok.position.z - kaya.kok.position.z;
  const d = Math.max(.001, Math.hypot(dx, dz));
  const ux = dx/d, uz = dz/d;
  kaya.kok.rotation.y = lerp(kaya.kok.rotation.y, Math.atan2(dx,dz), 1-Math.pow(.0006,dt));
  kOfke = clamp(sparVurus/3, 0, 1);
  kBlokSure -= dt; kaya._blok = kBlokSure > 0;

  // FEINT: yuklenmeyi yarida kes — Togan bosuna savunmaya gecsin
  if (kaya._feint && kaya.eylem && kaya.eT > .17) { kaya.eylem = null; kaya._feint = false; }

  // SAVUNMA TEPKISI: savurmayi gorunce (insan tepki suresi ~0.2 s penceresi)
  const tSaldiri = togan.eylem==='hafif1' || togan.eylem==='hafif2' || togan.eylem==='agir';
  if (!kaya.mesgul() && tSaldiri && togan.eT > .14 && togan.eT < .32 && d < 3.2 && kayaBekle <= 0) {
    if (Math.random() < .30 + kOfke*.34) {
      if (Math.random() < .40) { kaya.basla('parry'); kayaBekle = .40; }
      else { kBlokSure = .55; kayaBekle = .32; }
      kayaMod = 'savun'; kaya._hiz = 0; return;
    }
  }
  if (kaya.mesgul()) { kaya._hiz = 0; return; }
  kayaBekle -= dt;

  let hh = 0, vx = 0, vz = 0;
  if (asama === 'parry_sinavi') {
    if (d > 2.6) { vx=ux; vz=uz; hh=2.6; kayaMod='yaklas'; }
    else if (kayaBekle <= 0) { kaya.basla('agir'); kayaBekle = 2.2; kayaMod='dur'; }
    else kayaMod = 'dur';
  }
  else if (kayaMod === 'zincir' && kayaBekle <= 0) {
    if (d < 3.0) { kaya.basla(Math.random()<.5?'hafif1':'hafif2');
      kZincir--; kayaBekle = .26 - kOfke*.08;
      if (kZincir <= 0) { kayaMod = 'dolan'; kayaBekle = .55 + Math.random()*.7; } }
    else { vx=ux; vz=uz; hh=3.4; }
  }
  else if (d > 3.4) { vx=ux; vz=uz; hh=3.0 + kOfke*.7; kayaMod='yaklas'; }
  else if (d < 1.65) { vx=-ux; vz=-uz; hh=2.5; kayaMod='geri'; }
  else if (kayaBekle <= 0) {
    const r = Math.random();
    if (r < .15) {                                   // feint
      kaya.basla('hafif1'); kaya._feint = true; kayaBekle = .70 - kOfke*.2; kayaMod='dur';
    } else if (r < .72 + kOfke*.15) {                // 1-2 vuruslu zincir
      kZincir = 1 + (Math.random() < .35 + kOfke*.3 ? 1 : 0);
      kayaMod = 'zincir'; kayaBekle = 0;
    } else {                                          // yon degistirip dolan
      kYon = Math.random() < .5 ? 1 : -1;
      kayaMod = 'dolan'; kayaBekle = .7 + Math.random()*1.0;
    }
  }
  else {                                              // CEMBER: rakibin etrafinda dolan
    vx = -uz*kYon*.94 - ux*.12; vz = ux*kYon*.94 - uz*.12;
    hh = 1.8 + kOfke*.7; kayaMod = 'dolan';
  }
  if (hh > 0) {
    kaya.kok.position.x += vx*hh*dt; kaya.kok.position.z += vz*hh*dt;
    kaya.kok.position.x = clamp(kaya.kok.position.x,-150,150);
    kaya.kok.position.z = clamp(kaya.kok.position.z,-150,150);
  }
  kaya.kok.position.y = H(kaya.kok.position.x, kaya.kok.position.z);
  kaya._hiz = hh;
}

function etkilesim(){
  if (diyalogAcik) return;
  const d = togan.kok.position.distanceTo(kaya.kok.position);
  if (d > 3.6) return;
  if (asama === 'kaya_geldi') {
    konus([
      ['Kaya','Bir kez de ete kemiğe karşı salla. Belki kime vurduğunu hatırlarsın.'],
      ['Kaya','Hazırsan başla. Vur bana.'],
    ], () => { asamaAyarla('spar'); HUD.kutu.classList.add('acik');
      gorev('Kaya\'ya üç kez isabet ettir · Sol tık vur · Sağ tık blok · Shift takla'); });
  } else if (asama === 'ders') {
    konus([
      ['Kaya','Sana üç iz göstereyim.'],
      ['Kaya','Birincisi rakibin durduğu yer. İkincisi vuracağını sandığın yer. Üçüncüsü öfkenin seni sürüklediği yer.'],
      ['Kaya','Sen hep üçüncüye basıyorsun.'],
      ['Kaya','Şimdi savuştur. Vurduğum an sağ tıkla — öfkeyle değil, dinleyerek.'],
    ], () => { asamaAyarla('parry_sinavi'); parrySayisi=0; kayaBekle=1.4;
      gorev('Kaya\'nın darbesini SAĞ TIK ile savuştur (3 kez)'); });
  } else if (asama === 'bitti') {
    konus([['Kaya','Düşmek talimin sonu değil. Ana ateşin kokusu geliyor — Anya Ana bekler.']]);
  }
}

// ═══════════ 14. DÖNGÜ ═══════════
let saat=0, sonZ=performance.now(), hedefYaw=Math.PI;
let kalite = 1.0;
function kaliteUygula(){
  renderer.setPixelRatio(Math.min(devicePixelRatio, .62 + kalite*.68));
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  ssrPass.enabled   = kalite > .68;                        // once yansimalar dusar
  hacimPass.enabled = kalite > .52;                        // hacimsel isik
  hacimPass.uniforms.adimSay.value = kalite > .84 ? 14 : (kalite > .66 ? 10 : 7);
  aoPass.enabled  = kalite > .70;      // sonra ortam kapanmasi
  dofPass.enabled = kalite > .60;      // sonra alan derinligi
  huzmePass.enabled = kalite > .48;    // en son ay huzmeleri
  ayI.shadow.mapSize.setScalar(kalite > .78 ? 2048 : 1024);
  if (ayI.shadow.map) { ayI.shadow.map.dispose(); ayI.shadow.map = null; }
}
// ═══ ZAMAN SURUCUSU ═══ gece(0) → safak(1). Her kare tum isik sistemini gunceller.
let zamanHedef = 0;
const _ayR = new THREE.Color(0xc6d2f8), _gunR = new THREE.Color(0xffc98e);
const _ortG0 = new THREE.Color(0x5d6880), _ortG1 = new THREE.Color(0x9fb0d0);
const _ortY0 = new THREE.Color(0x413828), _ortY1 = new THREE.Color(0x7a5f3c);
const _sisG = new THREE.Vector3(0.052,0.070,0.125), _sisS = new THREE.Vector3(0.20,0.15,0.13);
const _pusG = new THREE.Vector3(0.045,0.058,0.098), _pusS = new THREE.Vector3(0.42,0.32,0.27);
function zamanGuncelle(dt, P){
  ZAMAN.value = lerp(ZAMAN.value, zamanHedef, 1 - Math.exp(-dt/6.0));   // yavas, farkedilmeyen gecis
  const z = ZAMAN.value;
  gokMat.uniforms.zaman.value = z;
  gokMat.uniforms.gunesYon.value.copy(gunesYonu(z));
  // ANA ISIK: soguk ay (arkadan) → sicak alcak gunes (dogudan)
  const yon = (z < .5 ? AY_YON.clone().lerp(gunesYonu(z), z*2) : gunesYonu(z)).normalize();
  ayI.position.set(P.x + yon.x*180, P.y + yon.y*180 + 40*(1-z), P.z + yon.z*180);
  ayI.color.copy(_ayR).lerp(_gunR, z);
  ayI.intensity = lerp(3.9, 5.8, z);
  // ORTAM: safakta gokyuzu genel aydinlatmayi devralir
  ortamI.color.copy(_ortG0).lerp(_ortG1, z);
  ortamI.groundColor.copy(_ortY0).lerp(_ortY1, z);
  ortamI.intensity = lerp(0.78, 2.35, z);
  scene.environmentIntensity = lerp(0.62, 1.15, z);
  // HACIMSEL SIS: soguk mavi → altin
  hacimPass.uniforms.gokRenk.value.copy(_sisG).lerp(_sisS, z);       // adim-basina sacilma
  hacimPass.uniforms.gokYog.value = lerp(0.10, 0.16, z);
  hacimPass.uniforms.pusRenk.value.copy(_pusG).lerp(_pusS, z);        // mesafe pusunun RENGI
  hacimPass.uniforms.pusGuc.value = lerp(0.62, 0.80, z);
  // MESALELER safakta gorece baskinligini kaybeder
  mesaleGuc = lerp(1.0, 0.45, z);
}
let mesaleGuc = 1.0;
const V3 = new THREE.Vector3(), V4 = new THREE.Vector3(), V5 = new THREE.Vector3();
// ── kamera durumu: yayli kol, gecikmeli bakis, FOV, darbe yumrugu
const kamHed = new THREE.Vector3(), kamIst = new THREE.Vector3(), kamBak = new THREE.Vector3();
const kamIleri = new THREE.Vector3(), kamYum = new THREE.Vector3(), kamYumV = new THREE.Vector3();
let fovTekme = 0;
// ── ivmeli hareket: 0'dan tam hiza tek karede sicramak "oyuncak" hissi veriyordu
const hedefHizV = new THREE.Vector3(), anlikHizV = new THREE.Vector3();
function tik(){
  const simdi=performance.now();
  let dt = Math.min(.05,(simdi-sonZ)/1000); sonZ=simdi;
  if (hitstop > 0) { hitstop -= dt; dt *= .12; }
  else if (agirCekim > 0) { agirCekim -= dt; dt *= .30; }
  renderer.info.reset();
  saat += dt;
  gokMat.uniforms.t.value = saat;
  ZEMIN_TABAN.value = H(togan.kok.position.x, togan.kok.position.z);
  // ortam haritasi ~1.6 s'de bir tazelenir (her kare cok pahali olurdu)
  kupSayac -= dt;
  if (kupSayac <= 0) { kupSayac = 1.2;
    cevreYenile(togan.kok.position.x, togan.kok.position.y + 2.2, togan.kok.position.z); }
  { const nx = Math.round(togan.kok.position.x/DET_KILIT)*DET_KILIT;
    const nz = Math.round(togan.kok.position.z/DET_KILIT)*DET_KILIT;
    if (nx !== detayCx || nz !== detayCz) { detayCx=nx; detayCz=nz; window.__detayKur(nx,nz); } }
  if (cimMat.userData.s) cimMat.userData.s.uniforms.t.value = saat;

  // ── oyuncu hareketi
  const kilitli = diyalogAcik || togan.eylem==='devril_bekle' || sinematik > 0;
  // UST/ALT AYRIMI: kilic savururken hareket artik TAMAMEN kilitli degil, yavaslatilmis.
  const ustMesgul = togan.eylem && UST_EYLEM[togan.eylem];
  const hareketVar = !kilitli && (!togan.mesgul() || ustMesgul);
  hedefHizV.set(0,0,0);
  if (hareketVar) {
    const kos = (tus['control'] ? 2.4 : 5.4) * (ustMesgul ? .42 : 1);
    let ix=0, iz=0;
    if (tus['w']) iz-=1; if (tus['s']) iz+=1; if (tus['a']) ix-=1; if (tus['d']) ix+=1;
    if (ix||iz) {
      const nn=Math.hypot(ix,iz); ix/=nn; iz/=nn;
      const ilx=Math.sin(kamYaw), ilz=Math.cos(kamYaw);
      const sgx=Math.cos(kamYaw), sgz=-Math.sin(kamYaw);
      V3.set(ilx*iz+sgx*ix, 0, ilz*iz+sgz*ix).normalize();
      hedefHizV.copy(V3).multiplyScalar(kos);
    }
  }
  // kalkis frenden yavas: agirlik hissi
  {
    const hizlaniyor = hedefHizV.lengthSq() >= anlikHizV.lengthSq();
    anlikHizV.lerp(hedefHizV, 1 - Math.exp(-dt / (hizlaniyor ? .20 : .13)));
    if (anlikHizV.lengthSq() < 1e-4) anlikHizV.set(0,0,0);
  }
  let hiz = anlikHizV.length();
  if (hareketVar && hiz > .06) {
    togan.kok.position.x += anlikHizV.x*dt; togan.kok.position.z += anlikHizV.z*dt;
    // savururken yon degistirme kisitli (savurusun yonu bozulmasin)
    if (!ustMesgul) hedefYaw = Math.atan2(anlikHizV.x, anlikHizV.z);
  }
  // govde ivmenin TERSINE egilir (kalkista one, frende geriye)
  togan.ivmeIleri = clamp((hiz - (togan._sonHizK||0)) / Math.max(dt,1e-4), -22, 22);
  togan._sonHizK = hiz;
  if (taklaSure > 0) {
    taklaSure -= dt;
    togan.kok.position.x += taklaVek.x*dt; togan.kok.position.z += taklaVek.z*dt;
    taklaVek.multiplyScalar(1-2.6*dt);
  }
  if (togan.ileriIt !== 0) {                     // savururken one suzulme / yuklenirken geri
    const yy = togan.kok.rotation.y;
    togan.kok.position.x += Math.sin(yy) * togan.ileriIt * dt;
    togan.kok.position.z += Math.cos(yy) * togan.ileriIt * dt;
  }
  const P = togan.kok.position;
  P.x = clamp(P.x,-150,150); P.z = clamp(P.z,-150,150); P.y = H(P.x,P.z);
  // dövüşte Kaya'ya bak
  if ((asama==='spar'||asama==='parry_sinavi') && hiz<.1) {
    const dx=kaya.kok.position.x-P.x, dz=kaya.kok.position.z-P.z;
    hedefYaw = Math.atan2(dx,dz);
  }
  let f = hedefYaw - togan.kok.rotation.y;
  while(f>Math.PI) f-=6.283; while(f<-Math.PI) f+=6.283;
  const donAdim = f*Math.min(1, dt*11);
  togan.kok.rotation.y += donAdim;
  // donerken ice yaslanma (motosiklet gibi) — hiza gore olceklenir
  togan.donHizi = lerp(togan.donHizi||0, donAdim/Math.max(dt,1e-4), 1-Math.exp(-dt/.10));

  // ── baş kilidi: yakındaki rakibe/kuklaya bak (canlılık)
  {
    const dKaya = P.distanceTo(kaya.kok.position), dKukla = P.distanceTo(kukla.position);
    const dovus = asama==='spar' || asama==='parry_sinavi' || asama==='ders';
    togan.bakHedef = (dovus || dKaya < 7) ? V4.set(kaya.kok.position.x, kaya.kok.position.y+1.62, kaya.kok.position.z)
                   : (dKukla < 5.5)       ? V4.set(kukla.position.x, kukla.position.y+1.80, kukla.position.z) : null;
    kaya.bakHedef = (dovus || dKaya < 9) ? V5.set(P.x, P.y+1.62, P.z) : null;
  }
  const _don = window.__dbg && window.__dbg.sabitEy;
  if (_don) { togan.eylem = window.__dbg.sabitEy; togan.eT = window.__dbg.sabitEt; togan.anlik = true; }
  if (komboTampon > 0 && !togan.mesgul() && saat - komboTampon < .34) { komboTampon = 0; vurYap(); }
  else if (komboTampon > 0 && saat - komboTampon >= .34) komboTampon = 0;
  const tDarbe = togan.guncelle(saat, dt, hiz, blokBasili && !kilitli);
  if (_don) { togan.ileriIt = 0; anlikHizV.set(0,0,0);      // dondurulmusken karakter kaymasin
    if (window.__dbg._p) togan.kok.position.copy(window.__dbg._p); else window.__dbg._p = togan.kok.position.clone(); }
  if (tDarbe) {
    // kuklaya mı Kaya'ya mı?
    const dk = P.distanceTo(kukla.position);
    if ((asama==='talim'||asama==='kaya_geldi') && dk < 2.9) {
      S.tahta(); sarsinti=.45; hitstop=.07; kuklaHiz=3.0;
      toz.at(kukla.position.x,kukla.position.y+1.75,kukla.position.z,14,1.8,2.4,.8);
      kivilcim.at(kukla.position.x,kukla.position.y+1.8,kukla.position.z,8,4,12,.3);
      if (asama==='talim') { vurusSayisi++;
        gorev(`Kuklaya vur: ${Math.min(3,vurusSayisi)}/3`);
        if (vurusSayisi>=3) { asamaAyarla('kaya_geldi'); kayaGel(); } }
    } else if (asama==='spar') {
      const s = darbeUygula(togan, kaya, 16, 'hafif');
      if (s==='isabet') { sparVurus++; gorev(`Kaya'ya isabet: ${Math.min(3,sparVurus)}/3`);
        if (sparVurus>=3) devrilmeSahnesi(); }
    } else if (asama==='parry_sinavi') {
      darbeUygula(togan, kaya, 12, 'hafif');
    } else { S.islik(); }
  }

  // ── Kaya
  kayaYZ(dt);
  const kDarbe = kaya.guncelle(saat, dt, kaya._hiz||0, kaya._blok === true);
  if (kDarbe) {
    const s = darbeUygula(kaya, togan, asama==='parry_sinavi'?10:14, kDarbe);
    if (s === 'parry' && asama === 'parry_sinavi') {
      parrySayisi++; gorev(`Savuşturma: ${Math.min(3,parrySayisi)}/3`);
      if (parrySayisi>=3) parrySinaviBitti();
    }
  }
  togan.denge = Math.min(100, togan.denge + 14*dt);
  kaya.denge = Math.min(100, kaya.denge + 12*dt);
  if (HUD.kutu.classList.contains('acik')) {
    HUD.can.style.width = togan.can+'%';
    HUD.denge.style.width = togan.denge+'%';
    HUD.kcan.style.width = kaya.can+'%';
  }

  // ── kukla yaylanma
  kuklaHiz += (-kuklaAci*46 - kuklaHiz*5.4)*dt;
  kuklaAci += kuklaHiz*dt; kukla.rotation.z = kuklaAci*.09;

  // ── Burkut / ateş / parçacıklar
  burkut.rotation.y = Math.sin(saat*.5)*.5;
  const ka = -.25 + Math.max(0, Math.sin(saat*1.1))*.35;
  burkut.kL.rotation.z = -ka; burkut.kR.rotation.z = ka;
  atesI.intensity = (2.9 + Math.sin(saat*9)*.7 + Math.sin(saat*23)*.35) * mesaleGuc;
  // ── arka plan figurleri: nefes, ates karistirma, nobetci bas cevirme
  for (const npc of npcler) {
    const f = saat*1.0 + npc.g.userData.faz, u = npc.g.userData;
    u.pel.position.y += 0;
    u.pel.rotation.x = Math.sin(f*1.7)*.018;                        // nefes
    if (npc.tip === 'otur') {
      const kir = Math.max(0, Math.sin(f*.55));                      // ara sira ates karistirma
      u.kolSag.rotation.x = -.30 - kir*.55;
      u.onKol.rotation.x = -.20 - kir*.85;
      u.bas.rotation.x = Math.sin(f*.9)*.06 - kir*.10;
    } else {
      u.bas.rotation.y = Math.sin(f*.28)*.85;                        // nobetci cevre tarar
      u.bas.rotation.x = Math.sin(f*.9+2.)*.04;
    }
  }
  // ── yurt ic atesleri: en yakin 2 yurda isik ata, parilti titretilsin
  {
    for (const y of yurtlar) {
      const dx = y.x - camera.position.x, dz = y.z - camera.position.z;
      y._d = dx*dx + dz*dz;
      if (y.g.userData.icAtes) {
        const f = saat*5.4 + y.x*0.7 + y.z*1.3;
        const tt = .82 + Math.sin(f)*.12 + Math.sin(f*2.3)*.06;
        y.g.userData.icAtes[0].color.setRGB(1.35*tt, 0.62*tt, 0.24*tt);
        y.g.userData.icAtes[1].opacity = (.42 + .16*Math.sin(f*1.7)) * mesaleGuc;
      }
    }
    yurtlar.sort((a,b) => a._d - b._d);
    for (let i=0;i<yIsik.length;i++){
      const y = yurtlar[i];
      if (!y) { yIsik[i].intensity = 0; continue; }
      const f = saat*5.4 + y.x*0.7 + y.z*1.3;
      yIsik[i].position.set(y.x, H(y.x,y.z) + 1.0, y.z + 2.9*y.s);
      yIsik[i].intensity = (6.5 + Math.sin(f)*1.4) * mesaleGuc;
    }
  }
  // ── mesaleler: alev titresimi + en yakin 5'ine isik ata
  {
    for (let i=0;i<mesaleler.length;i++) {
      const m = mesaleler[i], f = saat*7.2 + m.faz;
      const tt = .82 + Math.sin(f)*.13 + Math.sin(f*2.7)*.07 + Math.sin(f*6.1)*.04;
      m.a1.scale.set(.50*tt, .92*tt*(1+Math.sin(f*3.3)*.10), 1);
      m.a2.scale.set(.78*tt, 1.34*tt*(1+Math.sin(f*2.1+1.4)*.13), 1);
      m.a1.position.x = m.a1b.x + Math.sin(f*1.7)*.022;
      m.a2.position.x = m.a2b.x + Math.sin(f*1.3+.8)*.036;
      m._d = m.tepe.distanceToSquared(camera.position);
      if (Math.random() < dt*1.2) atesKiv.at(m.tepe.x, m.tepe.y+.1, m.tepe.z, 1, .55, .95, 1.5);
    }
    mesaleler.sort((a,b)=>a._d-b._d);
    for (let i=0;i<mIsik.length;i++){
      const m = mesaleler[i]; if (!m) { mIsik[i].intensity = 0; continue; }
      const f = saat*7.2 + m.faz;
      mIsik[i].position.copy(m.tepe);
      mIsik[i].intensity = (19 + Math.sin(f)*4.2 + Math.sin(f*3.9)*2.1) * mesaleGuc;
    }
  }
  if (Math.random() < dt*44) atesKiv.at(13,H(13,9)+.35,9,1,1.1,-1.1,1.6);
  if (Math.random() < dt*20 && bacalar.length) { const b=bacalar[(Math.random()*bacalar.length)|0];
    duman.at(b.x,b.y,b.z,1,.5,-.9,4.5); }
  if (hiz>3 && Math.random()<dt*10) toz.at(P.x,P.y+.06,P.z,1,.7,1.6,.5);
  kivilcim.tik(dt); toz.tik(dt); atesKiv.tik(dt); duman.tik(dt);

  // ── diyalog daktilo
  if (diyalogAcik && dY < dT.length) { dY = Math.min(dT.length, dY + dt*46);
    dMt.textContent = dT.slice(0, Math.floor(dY)); }
  // ── ipucu
  const yakin = P.distanceTo(kaya.kok.position) < 3.6;
  const konusabilir = yakin && !diyalogAcik && (asama==='kaya_geldi'||asama==='ders'||asama==='bitti');
  ipEl.style.opacity = konusabilir ? 1 : 0;

  // ── kamera
  if (sinematik > 0) {
    // acilis: obanin uzerinden karakterin omzuna suzulen kamera
    sinematik -= dt;
    const u2 = clamp(1 - sinematik/4.2, 0, 1);
    const e2 = u2*u2*(3-2*u2);
    const mes = lerp(26, kamMes, e2), yuk = lerp(13.5, 2.6, e2*e2);
    const aci = kamYaw + lerp(1.15, 0, e2);
    camera.position.set(P.x + Math.sin(aci)*mes, P.y + yuk, P.z + Math.cos(aci)*mes);
    kamBak.set(P.x, P.y + 1.4, P.z); camera.lookAt(kamBak);
    camera.fov = lerp(38, 52, e2); camera.updateProjectionMatrix();
  }
  else if (window.__dbg && window.__dbg.don) { /* gelistirme: kamera dondurulmus */ } else {
    const hy = 1.58 + (togan.eylem==='devril_bekle' ? -.95 : 0);
    // ileriye bakis: bakis noktasi hiz yonune kayar → gidilen yer gorunur
    kamIleri.lerp(V4.set(anlikHizV.x*.19, 0, anlikHizV.z*.19), 1-Math.exp(-dt/.30));
    kamHed.set(P.x+kamIleri.x, P.y+hy, P.z+kamIleri.z);
    const yat = Math.cos(kamPitch)*kamMes;
    kamIst.set(kamHed.x+Math.sin(kamYaw)*yat, kamHed.y+Math.sin(kamPitch)*kamMes, kamHed.z+Math.cos(kamYaw)*yat);
    // arazi carpismasi: hedeften kameraya ornekle, tepe arkasina gecme
    { let oran = 1;
      for (let i=1;i<=7;i++){ const s=i/7;
        const x=lerp(kamHed.x,kamIst.x,s), z=lerp(kamHed.z,kamIst.z,s), y=lerp(kamHed.y,kamIst.y,s);
        if (y < H(x,z)+.95) { oran = Math.max(.20,(i-1)/7); break; } }
      if (oran < 1) kamIst.lerpVectors(kamHed, kamIst, oran); }
    if (kamBak.lengthSq() < 1e-6) { kamBak.copy(kamHed); camera.position.copy(kamIst); }
    camera.position.lerp(kamIst, 1-Math.exp(-dt/.13));            // yayli kol
    kamBak.lerp(kamHed, 1-Math.exp(-dt/.22));                     // gecikmeli bakis
    // darbe yumrugu
    kamYum.addScaledVector(kamYumV, dt); kamYumV.multiplyScalar(Math.exp(-dt*13));
    kamYum.multiplyScalar(Math.exp(-dt*8.5)); camera.position.add(kamYum);
    // el kamerasi + sarsinti
    sarsinti *= Math.pow(.0008, dt);
    const el = .009 + Math.min(hiz,6)*.0024;
    camera.position.x += Math.sin(saat*1.7)*el + (Math.random()-.5)*sarsinti;
    camera.position.y += Math.sin(saat*2.3+1.1)*el*.8 + (Math.random()-.5)*sarsinti;
    camera.position.z += Math.sin(saat*1.3+2.2)*el + (Math.random()-.5)*sarsinti;
    const zAlt = H(camera.position.x, camera.position.z) + 1.05;
    if (camera.position.y < zAlt) camera.position.y = zAlt;
    camera.lookAt(kamBak);
    // FOV: kosuda genisler, agir yuklenmede sikisir, vurusta tekmelenir
    let fh = 52 + Math.min(hiz,6)*.95 + fovTekme;
    if (togan.eylem === 'agir' && togan.eT < .40) fh -= 3.4;
    camera.fov += (fh - camera.fov) * (1-Math.exp(-dt/.13));
    camera.updateProjectionMatrix();
    fovTekme *= Math.pow(.0015, dt);
  }
  { const kd = V3.set(camera.position.x-P.x, 0, camera.position.z-P.z).normalize();
    karIsik.position.set(P.x + kd.x*2.4 + 1.0, P.y + 3.1, P.z + kd.z*2.4); }
  zamanGuncelle(dt, P);
  ayI.target.position.copy(P); ayI.target.updateMatrixWorld();

  // ── ay hüzmeleri: ayın ekran konumunu bul
  {
    const ayYon = new THREE.Vector3(-0.30, 0.46, -0.84).normalize();
    const ayNok = camera.position.clone().addScaledVector(ayYon, 1600);
    const pr = ayNok.project(camera);
    const gorunur = pr.z < 1 && Math.abs(pr.x) < 1.5 && Math.abs(pr.y) < 1.5;
    huzmePass.uniforms.isikPos.value.set(pr.x*.5+.5, pr.y*.5+.5);
    const hedefGuc = gorunur ? .85 : 0;
    huzmePass.uniforms.guc.value = lerp(huzmePass.uniforms.guc.value, hedefGuc, 1-Math.pow(.02, dt));
  }
  // ── yer pusu: kamerayi takip eder, yavasca suruklenir
  for (let i=0;i<pusKatlari.length;i++){
    const k = pusKatlari[i];
    k.m.position.set(camera.position.x, P.y + k.y, camera.position.z);
    k.m.material.map = k.m.material.map || pusDoku;
    k.m.material.map.offset.set(saat*.0042*k.hiz + k.faz*.11, saat*.0027*k.hiz);
  }
  {
    const u = ssrPass.uniforms;
    u.proj.value.copy(camera.projectionMatrix);
    u.projTers.value.copy(camera.projectionMatrixInverse);
    u.coz.value.set(innerWidth*renderer.getPixelRatio(), innerHeight*renderer.getPixelRatio());
    u.yukariGorus.value.set(0,1,0).transformDirection(camera.matrixWorldInverse);
  }
  // ── hacimsel isik: en yakin 5 mesale + ana ocak
  {
    const u = hacimPass.uniforms;
    u.projTers.value.copy(camera.projectionMatrixInverse);
    u.kamMat.value.copy(camera.matrixWorld);
    u.kamPoz.value.copy(camera.position);
    u.zeminY.value = P.y;
    for (let i = 0; i < HACIM_N; i++){
      if (i < mIsik.length) {
        const L = mIsik[i];
        u.isikPoz.value[i].copy(L.position);
        const k = L.intensity * .055;
        u.isikRenk.value[i].set(L.color.r*k, L.color.g*k, L.color.b*k);
        u.isikMenzil.value[i] = L.intensity > .01 ? L.distance : 0;
      } else {                                        // son yuva: ana ocak
        u.isikPoz.value[i].copy(atesI.position);
        const k = atesI.intensity * .075;
        u.isikRenk.value[i].set(atesI.color.r*k, atesI.color.g*k, atesI.color.b*k);
        u.isikMenzil.value[i] = atesI.distance;
      }
    }
  }
  dofPass.uniforms.projTers.value.copy(camera.projectionMatrixInverse);
  { const pr2 = renderer.getPixelRatio();
    dofPass.uniforms.coz.value.set(innerWidth*pr2, innerHeight*pr2);
    aoPass.uniforms.coz.value.set(innerWidth*pr2, innerHeight*pr2); }
  dofPass.uniforms.enBulanik.value = Math.max(2.0, innerHeight*_pr*0.0052);
  { const odakHedef = (window.__dbg && window.__dbg.don)
      ? camera.position.distanceTo(togan.kok.position)
      : camera.position.distanceTo(kamBak.lengthSq() ? kamBak : togan.kok.position);
    dofPass.uniforms.odak.value = lerp(dofPass.uniforms.odak.value, odakHedef, 1-Math.exp(-dt/.25)); }
  aoPass.uniforms.proj.value.copy(camera.projectionMatrix);
  aoPass.uniforms.projTers.value.copy(camera.projectionMatrixInverse);
  gradePass.uniforms.t.value = saat * .37;
  // ── toz zerreleri kamerayı takip eder (sonsuz atmosfer)
  {
    const zp = zerreG.attributes.position.array;
    const cx = camera.position.x, cz = camera.position.z, cy = P.y;
    for (let i=0;i<ZERRE;i++){
      zp[i*3]   += (Math.sin(saat*.35 + i)*.28 + .22) * dt;
      zp[i*3+1] += Math.sin(saat*.6 + i*1.7)*.10 * dt;
      let dx = zp[i*3]-cx, dz = zp[i*3+2]-cz;
      if (dx >  35) zp[i*3]   -= 70; if (dx < -35) zp[i*3]   += 70;
      if (dz >  35) zp[i*3+2] -= 70; if (dz < -35) zp[i*3+2] += 70;
      if (zp[i*3+1] > cy+16) zp[i*3+1] = cy;
      if (zp[i*3+1] < cy-1)  zp[i*3+1] = cy+16;
    }
    zerreG.attributes.position.needsUpdate = true;
  }
  composer.render();
  window.__hazir = true;
  window.__vur = vurYap; window.__takla = taklaYap;
  // GERCEK kare hizi: oyun saatiyle degil performance.now() ile olculur
  { const now = performance.now();
    window.__kare = (window.__kare||0)+1;
    if (!window.__fpsT) window.__fpsT = now;
    if (now - window.__fpsT > 1000) {
      window.__fps = Math.round(window.__kare*1000/(now-window.__fpsT));
      window.__msKare = +((now-window.__fpsT)/window.__kare).toFixed(1);
      if (window.__fpsEl) window.__fpsEl.textContent =
        window.__fps + ' FPS  ·  ' + window.__msKare + ' ms  ·  ' +
        renderer.info.render.calls + ' cizim  ·  k' + kalite.toFixed(2);
      window.__fpsT = now; window.__kare = 0;
      // ── uyarlanabilir kalite: zayif makinede takilmasin, guclu makinede kismasin
      const ms = window.__msKare;
      if (ms > 26 && kalite > .55)      { kalite = Math.max(.55, kalite - .14); kaliteUygula(); }
      else if (ms < 13 && kalite < 1.0) { kalite = Math.min(1.0, kalite + .07); kaliteUygula(); }
    } }
  if (!window.__dbg) window.__dbg = { THREE, scene, camera, renderer, togan, kaya, kukla, ao:aoPass, isi:ISI_PAY, patika:PATIKA_U, hacim:hacimPass, ssr:ssrPass, pus:pusKatlari, zerre:zerreler, dof:dofPass, huzme:huzmePass, grade:gradePass, composer,
    // yakın çekim: __dbg.bak(mesafe, yukseklik, aci) — sadece geliştirme/ekran görüntüsü için
    sahne(ad){ asama = ad; if (ad==='spar'||ad==='parry_sinavi') dovusHud.classList.add('acik'); },
    sinematikAtla(){ sinematik = 0; },
    zaman(z){ zamanHedef = z; ZAMAN.value = z; },   // 0=gece 1=safak (test icin ani)
    sabit(ey, u){ const T={hafif1:.54,hafif2:.58,agir:.92,takla:.58,parry:.36,blok:1,devril:1.0}[ey]||.5;
      this.sabitEy=ey; this.sabitEt=u*T; },
    serbest(){ this.sabitEy=null; this._p=null; togan.anlik=false; togan.eylem=null; },
    bak(m=2.6, y=1.15, a=0.6, k=null){ const h=(k||togan).kok.position;
      camera.position.set(h.x+Math.sin(a)*m, h.y+y, h.z+Math.cos(a)*m);
      camera.lookAt(h.x, h.y+1.05, h.z); this.don=true; } };
  requestAnimationFrame(tik);
}

// ═══════════ 15. SAHNE OLAYLARI ═══════════
function kayaGel(){
  gorev('');
  konus([
    ['','Kılıç üçüncü kez göğsüne gömülünce kuklanın tahta omurgası çatladı.'],
    ['','Aşağıda Kartal-Yurdu uyuyordu. Tek Göz kuzey sırtlarının üzerinde asılıydı.'],
    ['Kaya','Demiri değil, kendini yoruyorsun.'],
  ], () => { gorev('Kaya\'ya yaklaş ve E ile konuş'); });
  const hx = togan.kok.position.x - 2.6, hz = togan.kok.position.z - 2.0;
  kayaYurusu = { x:hx, z:hz };
}
let kayaYurusu = null;
function devrilmeSahnesi(){
  asamaAyarla('devrilme');
  HUD.kutu.classList.remove('acik'); gorev('');
  kaya.basla('agir');
  setTimeout(() => {
    S.dusme(); sarsinti = 1.1; hitstop = .16;
    togan.basla('devril'); togan.can = Math.max(20, togan.can-18);
    toz.at(togan.kok.position.x, togan.kok.position.y+.2, togan.kok.position.z, 22, 2.2, 2.2, 1.1);
    setTimeout(() => {
      konus([
        ['','Bütün ağırlığını son darbeye verdi. Kaya yana kaydı; bileğine vurdu, omzunu göğsüne bindirdi.'],
        ['','Togan\'ın ayağı çamurda dönünce gökyüzü birden önüne açıldı. Sırtüstü yere çarptı.'],
        ['Kaya','Bu bir Sungur kılıcı değil. Sapını sen tutuyorsun, vuran öfken.'],
        ['Kaya','Ayağa kalk.'],
        ['Togan','Düştüm. Gördün.'],
        ['Kaya','Düşmek talimin sonu değil.'],
      ], () => { togan.eylem=null; togan.basla('kalk'); asamaAyarla('ders');
        gorev('Kaya ile konuş — E'); });
    }, 1100);
  }, 620);
}
function parrySinaviBitti(){
  asamaAyarla('bitti');
  HUD.kutu.classList.remove('acik');
  konus([
    ['Kaya','Demek hâlâ duyabiliyorsun.'],
    ['Togan','Neyi?'],
    ['Kaya','Senden başka birini.'],
    ['Kaya','Karşında kim var Togan? Ben mi? Korgan mı? Yoksa bir yıldır mezara koyamadığın biri mi?'],
    ['','Kaya tahta kılıçları topladı. Giderken adımları öfkeliden çok yorgundu.'],
    ['Togan','Bir hayalet neresinden vurulur?'],
  ], () => gorev('Kartal-Yurdu\'nda dolaş — ana ateş sağda'));
}

// Kaya yürüyüşü (sahne olayı)
(function kayaYurut(){
  setInterval(() => {
    if (!kayaYurusu || kaya.mesgul()) return;
    const dx = kayaYurusu.x - kaya.kok.position.x, dz = kayaYurusu.z - kaya.kok.position.z;
    const d = Math.hypot(dx,dz);
    if (d < .5) { kayaYurusu = null; kaya._hiz = 0; return; }
    kaya._hiz = 2.7;
    kaya.kok.position.x += dx/d*2.7/60; kaya.kok.position.z += dz/d*2.7/60;
    kaya.kok.position.y = H(kaya.kok.position.x, kaya.kok.position.z);
    kaya.kok.rotation.y = Math.atan2(dx,dz);
  }, 1000/60);
})();

tik();
setTimeout(() => konus([
  ['','BİRİNCİ KİTAP · BÖLÜM 1 — Sessiz Talim ve Kül Rengi Anılar'],
  ['','Talim alanının toprağı, aylardır aynı yerde dönüp duran ayaklarının altında sertleşmişti.'],
  ['Togan','Kaçıncı darbe olduğunu bilmiyorum. Şafak hâlâ ne kadar uzak?'],
], () => gorev('Kuklaya git ve üç kez vur — Sol tık')), 700);

addEventListener('resize', () => {
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
});
