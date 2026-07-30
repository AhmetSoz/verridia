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

const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;

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
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.30;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x333752, 0.0031);   // ağır, yakın atmosfer
const camera = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, 0.1, 4000);

// ── kenar ışığı (siluet ayrışsın)
function kenar(mat, renk = new THREE.Color(0xa9b6d4), guc = .26) {
  mat.onBeforeCompile = s => {
    s.uniforms.kR = { value: renk }; s.uniforms.kG = { value: guc };
    s.fragmentShader = 'uniform vec3 kR; uniform float kG;\n' + s.fragmentShader
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 4.2);
        gl_FragColor.rgb += kR * fr * kG;`);
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
const gokMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, uniforms: { t: { value: 0 } },
  vertexShader: `varying vec3 vW; void main(){ vW=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `,
  fragmentShader: `varying vec3 vW; uniform float t;
  float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
  float fb(vec2 p){ float s=0.,a=.5; for(int i=0;i<6;i++){s+=a*n(p);p*=2.03;a*=.5;} return s; }
  void main(){
    vec3 d=normalize(vW); float y=clamp(d.y*.5+.5,0.,1.);
    vec3 col=mix(vec3(0.62,0.40,0.35), vec3(0.22,0.21,0.38), smoothstep(0.0,0.27,y));
    col=mix(col, vec3(0.09,0.11,0.26), smoothstep(0.25,0.84,y));
    col+=vec3(0.76,0.38,0.20)*pow(max(0.,1.-abs(d.y)*8.),3.)*0.62;
    float bl=fb(vec2(atan(d.z,d.x)*2.2, d.y*6.5-t*0.004));
    col=mix(col,col*1.26+vec3(0.07,0.05,0.10),smoothstep(0.55,0.88,bl)*smoothstep(0.03,0.36,d.y)*0.8);
    vec2 sp=d.xz/max(0.10,abs(d.y)+0.30)*135.; vec2 ce=floor(sp);
    float dd=length(fract(sp)-vec2(h(ce+3.1),h(ce+7.7)));
    col+=vec3(0.90,0.93,1.0)*smoothstep(0.986,1.0,h(ce))*smoothstep(0.22,0.0,dd)*1.6*smoothstep(-0.02,0.24,d.y);
    vec3 ks=normalize(vec3(0.70,0.20,-0.68)); float dk=max(0.,dot(d,ks));
    col+=vec3(0.68,0.09,0.14)*pow(dk,22.)*(0.22+0.85*fb(d.xy*9.));
    col+=vec3(1.0,0.22,0.24)*smoothstep(0.975,1.0,h(ce+55.))*smoothstep(0.30,0.0,dd)*pow(dk,9.)*2.6;
    vec3 ay=normalize(vec3(-0.30,0.46,-0.84)); float da=dot(d,ay);
    col+=vec3(0.40,0.45,0.72)*pow(max(0.,da),560.)*0.9;
    col=mix(col, vec3(0.90,0.92,0.99)*(0.86+0.14*n(d.xy*280.)), smoothstep(0.99920,0.99950,da));
    col=mix(col, vec3(0.07,0.10,0.25), smoothstep(0.999730,0.999820,da)*(1.-smoothstep(0.999875,0.999925,da))*0.92);
    col=mix(col, vec3(0.02,0.02,0.05), smoothstep(0.999875,0.999925,da)*0.85);
    gl_FragColor=vec4(col,1.); }`
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(2200, 56, 36), gokMat));
// gökyüzü shader'ından PMREM çevre haritası: metal kılıç/toka artık gerçek yansıtıyor
{
  const gs = new THREE.Scene();
  gs.add(new THREE.Mesh(new THREE.SphereGeometry(400, 32, 20), gokMat));
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(gs, 0, 1, 800).texture;
  scene.environmentIntensity = 0.55;
  pm.dispose();
}

// ═══════════ 4. IŞIK ═══════════
const ayI = new THREE.DirectionalLight(0xc8d4f8, 4.4);
ayI.position.set(-90, 110, -150); ayI.castShadow = true;
ayI.shadow.mapSize.set(3072, 3072);
Object.assign(ayI.shadow.camera, { left:-34, right:34, top:34, bottom:-34, far:320 });
ayI.shadow.bias = -0.00035; ayI.shadow.normalBias = 0.014; ayI.shadow.radius = 2.2;
scene.add(ayI, ayI.target);
scene.add(new THREE.HemisphereLight(0x9dacd0, 0x6d5f47, 4.4));
// yüzü karanlıkta bırakmayan yumuşak dolgu (gölge yok, ucuz)
const dolgu = new THREE.DirectionalLight(0x8e9ec6, 1.15); dolgu.position.set(80, 42, 110); scene.add(dolgu);
// karakter anahtarı: kameranın omzundan gelen, sadece yakını aydınlatan sinematik ışık
const karIsik = new THREE.PointLight(0xc2cdea, 34, 12, 2.0); scene.add(karIsik);

// ═══════════ 5. ARAZİ + ÇİM ═══════════
{
  const g = new THREE.PlaneGeometry(900, 900, 200, 200); g.rotateX(-Math.PI/2);
  const P = g.attributes.position, R = new Float32Array(P.count*3);
  const c1 = new THREE.Color(0x8b8062), c2 = new THREE.Color(0x6b6350),
        c3 = new THREE.Color(0x4f4438), c4 = new THREE.Color(0x5a5a60);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), y = H(x,z); P.setY(i, y);
    const eg = Math.abs(H(x+2,z)-y) + Math.abs(H(x,z+2)-y);
    const ya = fbm(x*.03+11, z*.03-7, 3), mi = fbm(x*.5, z*.5, 2);
    const mrk = 1 - clamp(Math.hypot(x,z)/24, 0, 1);
    const c = c1.clone().lerp(c2, clamp(ya*1.4-.2,0,1));
    c.lerp(c3, Math.max(clamp(eg*.16,0,.7), mrk*.88));
    if (eg > 5) c.lerp(c4, clamp((eg-5)*.12,0,.8));
    c.multiplyScalar(.62 + .26*mi);
    R[i*3]=c.r; R[i*3+1]=c.g; R[i*3+2]=c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(R,3)); g.computeVertexNormals();
  const zn = D_DERI.n.clone(); zn.repeat.set(300,300); zn.needsUpdate = true;
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({vertexColors:true, roughness:.98,
    normalMap:zn, normalScale:new THREE.Vector2(.55,.55)}));
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
      diffuseColor.rgb *= mix(0.44, 1.32, vY);`);
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
    const mrk = Math.hypot(x,z) < 22 ? .22 : 1;
    const s = (.7+Math.random()*.9)*mrk;
    M4.compose(V.set(x,H(x,z)-.05,z), Q, S.set(s*(.8+Math.random()*.5), s, s));
    cim.setMatrixAt(i, M4);
    const t = .72+Math.random()*.5, ye = Math.random()<.25;
    R[i*3]=(ye?.40:.66)*t; R[i*3+1]=(ye?.46:.60)*t; R[i*3+2]=(ye?.30:.38)*t;
  }
  cim.instanceColor = new THREE.InstancedBufferAttribute(R,3); scene.add(cim);
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

class Insan {
  constructor(R, izRenk) {
    this.R = R;
    this.kok = new THREE.Group();
    this.egimG = new THREE.Group(); this.kok.add(this.egimG);       // takla için
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
    this.etek = new THREE.Mesh(new THREE.CylinderGeometry(.198,.278,.54,20,4,true), MAT(R.kaftan,1.0,.03,D_KUMAS,2.6,true));
    this.etek.material.side=THREE.DoubleSide; this.etek.position.y=-.21; this.etek.scale.z=.86;
    { const pg=this.etek.geometry.attributes.position;
    for(let i=0;i<pg.count;i++){ const x=pg.getX(i), y=pg.getY(i), z=pg.getZ(i);
      const a=Math.atan2(z,x), r=Math.hypot(x,z);
      const k=1+Math.sin(a*10)*.085*clamp((y+.27)/.54,0,1);
      pg.setX(i,Math.cos(a)*r*k); pg.setZ(i,Math.sin(a)*r*k); }
    this.etek.geometry.computeVertexNormals(); }
  this.govde.add(this.etek);

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
      gk2.scale.set(1,.52,1); gk2.position.set(.046*s,.128,.098); this.bas.add(gk2);           // üst göz kapağı
      const kas = new THREE.Mesh(new THREE.BoxGeometry(.052,.014,.020), MAT(R.sac,.95,.02));
      kas.position.set(.047*s,.150,.106); kas.rotation.z=-.13*s; this.bas.add(kas);
    }
    const br = new THREE.Mesh(new THREE.ConeGeometry(.030,.070,6), MAT(R.ten,.80,.02,D_TEN,.7));
    br.rotation.x=1.72; br.position.set(0,.090,.114); this.bas.add(br);                     // burun
    const az = new THREE.Mesh(new THREE.BoxGeometry(.056,.010,.014), MAT(0x6d4238,.85,.02));
    az.position.set(0,.040,.104); this.bas.add(az);                                          // ağız çizgisi
    const sc = kure(.137,R.sac,1.05,.80,1.08,D_KURK,1.0); sc.position.set(0,.183,-.018); this.bas.add(sc);
    for (let i=0;i<7;i++){ const a=(i/6-.5)*2.1;                                             // saç tutamları
      const tt = uzuv(.026,.010,.12+Math.random()*.06,R.sac,7,D_KURK,.2,1.0);
      tt.position.set(Math.sin(a)*.116,.243,Math.cos(a)*.085-.045);
      tt.rotation.set(.5-Math.random()*.3,0,-Math.sin(a)*.5); this.bas.add(tt); }
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
      const bz = new THREE.Mesh(new THREE.TorusGeometry(.070,.020,6,14),                     // kolluk
        MAT(R.deri||R.kemer,.86,.14,D_DERI,1.1)); bz.rotation.x=Math.PI/2; bz.position.y=-.245; u.add(bz);
      const a=new THREE.Group(); a.position.y=-.30; u.add(a);
      const dr = kure(.058,R.kaftan,1,1,1,D_KUMAS,2.4); a.add(dr);                            // dirsek
      a.add(uzuv(.062,.044,.24,R.kaftan,14,D_KUMAS,.16,2.4));                                 // yen
      const yn = new THREE.Mesh(new THREE.CylinderGeometry(.052,.058,.075,14,1,true),
        MAT(R.kaftanAlt||R.kaftan,1,.03,D_KUMAS,2.4,true));                                   // yen ağzı
      yn.material.side=THREE.DoubleSide; yn.position.y=-.245; a.add(yn);
      a.add(uzuv(.044,.040,.055,R.ten,12,D_TEN,.05,1.0)).position.y=-.245;                    // bilek
      const e=elYap(R,y); e.position.y=-.295; a.add(e);
      return {u,a,el:e}; };
    this.kL = kol(1); this.kR = kol(-1);

    // ── BACAKLAR: uyluk + diz eklemi + baldır + çizme
    const bac = y => { const u=new THREE.Group(); u.position.set(.118*y,-.06,0); this.pelvis.add(u);
      u.add(uzuv(.118,.090,.44,R.pantolon,16,D_KUMAS,.16,2.4));
      const a=new THREE.Group(); a.position.y=-.44; u.add(a);
      const dz = kure(.088,R.pantolon,1,.92,1.02,D_KUMAS,2.4); a.add(dz);                     // diz
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

    this.kok.traverse(o => { if (o.isMesh) { o.castShadow=true; o.receiveShadow=true; } });
    // ── temas gölgesi: ayakları yere oturtan yumuşak leke (gölge haritasının altını doldurur)
    this.golge = new THREE.Mesh(new THREE.PlaneGeometry(1.35,1.35),
      new THREE.MeshBasicMaterial({ map:noktaDoku('rgba(4,4,10,'), transparent:true, opacity:.50,
        depthWrite:false }));
    this.golge.rotation.x = -Math.PI/2; this.golge.position.y = .035;
    this.golge.renderOrder = -1; this.kok.add(this.golge);

    this.poz = Object.assign({}, SIFIR);      // hedef
    this.cur = Object.assign({}, SIFIR);      // mevcut (yumuşak geçer)
    this.faz = Math.random()*6.28;
    this.iz = new Iz(22, izRenk);
    this.eylem = null; this.eT = 0; this.vurdu = false; this.adimFaz = 0; this.ileriIt = 0;
    this.yE={p:0,v:0}; this.yEz={p:0,v:0}; this.yS={p:0,v:0}; this.ySz={p:0,v:0};
    this._sonDon = 0; this._sonHiz = 0; this.bakHedef = null; this.bakX = 0; this.bakY = 0;
    this._a = new THREE.Vector3(); this._b = new THREE.Vector3();
    this.can = 100; this.denge = 100; this.olu = false;
  }

  basla(ad) {   // eylem: hafif1 hafif2 agir takla blok parry hasar devril kalk
    this.eylem = ad; this.eT = 0; this.vurdu = false; this.ileriIt = 0;
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

    if (E) {
      this.eT += dt;
      const T = { hafif1:.54, hafif2:.58, agir:.92, takla:.58, parry:.36, hasar:.38,
                  devril:1.0, kalk:.75, blok:1e9, olum:1.3 }[E] || .5;
      const u = this.eT / T;
      hizBlend = .42;

      if (E === 'hafif1' || E === 'hafif2') {
        // hafif1: sağ-üstten sol-aşağı çapraz kesik · hafif2: sol-aşağıdan sağ-yukarı ters kesik
        const ters = E === 'hafif2';
        const yon = ters ? -1 : 1;
        let s;                                   // 0=hazır 1=savurma sonu
        if (u < .26) s = -(1 - Math.pow(1-u/.26, 2)) * .55;      // geri yüklen (negatif = geri)
        else if (u < .56) s = -.55 + (1 - Math.pow(1-(u-.26)/.30, 3)) * 1.55;  // kes
        else s = 1.00 - (1 - Math.pow(1-(u-.56)/.44, 2)) * 1.00; // toparla
        // kol: omuzdan yatay süpürme (Z), hafif dikey (X)
        p.krZ = -.30 - yon * s * .95;
        p.krU = -.65 + s * .55 - Math.abs(s) * .25;
        p.krA = -.85 + Math.max(0, s) * .70;
        p.klZ = .38 + yon * s * .30; p.klU = -.30 - s * .18; p.klA = -.80;
        // bıçak: yüklenmede omuz arkasına tuck (>PI), kesmede öne uzanır
        p.kilX = 2.62 + (s < 0 ? -s * .75 : -s * 1.55);
        p.kilZ = yon * (.20 + s * .35);
        // gövde/kalça dönüşü + öne adım
        p.govY = -yon * s * .60; p.pelR = -yon * s * .34;
        p.govX = .10 + Math.max(0, s) * .18;
        p.blU = -.18 + Math.max(0, s) * .40; p.brU = .14 - Math.max(0, s) * .22;
        p.blA = .12; p.brA = .22;
        p.pelY = .95 - Math.abs(s) * .045;
        if (u > .22 && u < .70) this.izBirak();
        if (!this.vurdu && u > .40) { this.vurdu = true; darbe = E; }
        this.ileriIt = (u > .24 && u < .52) ? 3.4 : 0;   // savururken öne süzülme
      }
      else if (E === 'agir') {
        let sw, gv, ad;
        if (u < .42) { const k=u/.42, s=k*k; sw = -.4 - s*2.35; gv = .30*s; ad = -.16*s; }
        else if (u < .66) { const k=(u-.42)/.24, s=1-Math.pow(1-k,3);
          sw = -2.75 + s*3.55; gv = .30 - s*.55; ad = -.16 + s*.55; }
        else { const k=(u-.66)/.34, s=k*k*(3-2*k); sw = .80 - s*1.20; gv = -.25+s*.25; ad = .39-s*.39; }
        p.krU = sw; p.krZ = -.14; p.krA = -.35 + Math.max(0,sw)*.55;
        p.klU = sw*.82; p.klZ = .16; p.klA = -.50;         // iki el
        p.govX = .12 + ad*.46; p.govY = gv; p.pelR = gv*.3;
        p.blU = -.32 + ad*.7; p.brU = .26 - ad*.4; p.blA = .16; p.brA = .30;
        // tepede bıçak geriye tuck, inişte öne uzanır
        p.kilX = 2.62 + (sw < -1 ? (-sw-1)*.55 : -(sw+1)*.95);
        p.pelY = .95 - Math.abs(ad)*.10;
        this.ileriIt = (u > .44 && u < .68) ? 2.6 : 0;
        if (u > .38 && u < .78) this.izBirak();
        if (!this.vurdu && u > .58) { this.vurdu = true; darbe = 'agir'; }
      }
      else if (E === 'takla') {
        // İLERİ takla: +X ekseninde POZİTİF dönüş (gövde öne devrilir), pivot kalçada
        const e = clamp(u / .80, 0, 1);
        const s = e < .5 ? 2*e*e : 1 - Math.pow(-2*e+2, 2)/2;      // easeInOut
        const top = Math.sin(clamp(e,0,1) * Math.PI);              // ortada tam toplanma
        p.egim  = Math.PI * 2 * s;
        p.egimY = .62 * top;                                       // kalça pivotu yüksel
        p.pelY  = .95 - .95 * top;                                 // gövde topa girer
        p.blU = -1.55*top; p.blA = 1.95*top;
        p.brU = -1.40*top; p.brA = 1.80*top;
        p.klU = -2.10*top; p.klA = -1.55*top; p.klZ = .55*top;
        p.krU = -1.95*top; p.krA = -1.45*top; p.krZ = -.55*top;
        p.govX = .70*top; p.basX = .45*top;
        p.kilX = 2.62 - .55*top; p.kilZ = -.30*top;
        hizBlend = .55;
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
        const s = Math.sin(clamp(u,0,1)*Math.PI);
        p.govX = -.42*s; p.govY = .22*s; p.basX = -.30*s;
        p.klU = -.55*s; p.krU = -.35*s; p.klZ=.5*s; p.krZ=-.5*s;
        p.blU = .28*s; p.brU = -.24*s; p.pelY = .95-.05*s;
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

      if (E !== 'blok' && u >= 1) {
        this.eylem = (E === 'devril') ? 'devril_bekle' : null;
        if (E === 'devril') { this.eylem = 'devril_bekle'; this.eT = 0; }
      }
    }
    else if (this.eylem === 'devril_bekle') { /* yerde kalır */ }

    if (!this.eylem || this.eylem === 'blok') {
      if (blokTutuluyor && !this.eylem) { this.basla('blok'); }
    }

    // ── locomotion (eylem yokken)
    if (!this.eylem) {
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
        p.govZ = sl*.055*y;                                      // omuz karşı eğim
        p.govX = .05+.13*y; p.govY = -sl*.16*y;
        p.basX = -.04*y - .05*Math.abs(sl)*y; p.basY = -sl*.05*y; // baş sabitlemesi (zıt faz)
        p.kilX = 2.62-.16*y; p.kilZ = .04*y; p.egim = 0; p.egimY = 0;
        // ayak sesi — basış anında
        const yeni = Math.floor((f+1.6)/Math.PI);
        if (yeni !== this._adim) { this._adim = yeni; if (y>.12) S.adim(); }
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
        p.govX=.035+nef*.020; p.govY=-w*.06; p.govZ=-w*.045;
        p.basX=nef*.030-.02; p.basY=Math.sin(t*.31+this.faz)*.24 + w*.10;
        p.kilX=2.62+nef*.02; p.kilZ=0; p.egim=0; p.egimY=0;
      }
    }

    // ── POZ KARIŞTIRMA (akıcılığın sırrı)
    const k = this.anlik ? 1 : (1 - Math.pow(1 - hizBlend, dt*60));
    const c = this.cur;
    for (const key in SIFIR) c[key] = lerp(c[key], p[key], k);

    this.bL.u.rotation.x = c.blU; this.bL.a.rotation.x = c.blA; this.bL.ayak.rotation.x = c.blF;
    this.bR.u.rotation.x = c.brU; this.bR.a.rotation.x = c.brA; this.bR.ayak.rotation.x = c.brF;
    this.kL.u.rotation.set(c.klU, 0, c.klZ); this.kL.a.rotation.x = c.klA;
    this.kR.u.rotation.set(c.krU, 0, c.krZ); this.kR.a.rotation.x = c.krA;
    this.govde.rotation.set(c.govX, c.govY, c.govZ);
    this.pelvis.position.set(c.pelX, c.pelY, 0); this.pelvis.rotation.y = c.pelR;
    this.bas.rotation.set(c.basX, c.basY, -c.govZ*.5);
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
    this.bas.rotation.y += this.bakY; this.bas.rotation.x += this.bakX;
    this.govde.rotation.y += this.bakY * .20;
    return darbe;
  }
  izBirak(){ this.uc.getWorldPosition(this._a); this.dp.getWorldPosition(this._b);
    this.iz.ekle(this._a, this._b); }
}

const R_TOGAN = { kaftan:0x3d4b66, kaftanAlt:0x323d52, kurk:0xb0aba1, ten:0xc08e63, sac:0x241c18,
  kemer:0x5a4023, deri:0x4b3520, pantolon:0x3a4356, cizme:0x483420, celik:0xc6ccd6, altin:0xb08a3c };
const R_KAYA = { kaftan:0x5f5636, kaftanAlt:0x4c452b, kurk:0x958b78, ten:0xc59468, sac:0x2b2119,
  kemer:0x4d3a20, deri:0x3f2e17, pantolon:0x4c4834, cizme:0x453118, celik:0x9a7c4a, altin:0x8a6b3c };

const togan = new Insan(R_TOGAN, 0xe6ecff);
togan.kok.position.set(3, H(3,7), 7); scene.add(togan.kok);
const kaya = new Insan(R_KAYA, 0xf0e0c0);
kaya.kok.position.set(-13, H(-13,-7), -7); kaya.kok.rotation.y = Math.PI*.8; scene.add(kaya.kok);

// ═══════════ 8. ÇEVRE ═══════════
const kecemat = () => kenar(new THREE.MeshStandardMaterial({color:0xb3a68c, roughness:.98}), new THREE.Color(0x8fa0d8), .30);
const ahsap = () => kenar(new THREE.MeshStandardMaterial({color:0x5a4227, roughness:.95}), new THREE.Color(0x7f8fc8), .22);
const bacalar = [];
function yurt(x,z,s=1){
  const g = new THREE.Group();
  const gv = new THREE.Mesh(new THREE.CylinderGeometry(2.55,2.72,2.05,20), kecemat()); gv.position.y=1.02; g.add(gv);
  const kb = new THREE.Mesh(new THREE.SphereGeometry(2.62,20,10,0,Math.PI*2,0,Math.PI*.40), kecemat());
  kb.position.y=2.05; kb.scale.y=.78; g.add(kb);
  const cm = new THREE.Mesh(new THREE.TorusGeometry(.42,.055,5,14), ahsap());
  cm.rotation.x=Math.PI/2; cm.position.y=3.02; g.add(cm);
  for(let i=0;i<14;i++){ const a=i/14*Math.PI*2;
    const k=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,1.32,4), ahsap());
    k.position.set(Math.cos(a)*1.42,2.62,Math.sin(a)*1.42);
    k.rotation.z=Math.cos(a)*.62; k.rotation.x=-Math.sin(a)*.62; g.add(k); }
  const cr=new THREE.Mesh(new THREE.BoxGeometry(1.12,1.55,.10), ahsap()); cr.position.set(0,.78,2.66); g.add(cr);
  const kn=new THREE.Mesh(new THREE.BoxGeometry(.92,1.34,.06),
    kenar(new THREE.MeshStandardMaterial({color:0x2e2114,roughness:1}), new THREE.Color(0x6f7fb8), .18));
  kn.position.set(0,.74,2.73); g.add(kn);
  for(let i=0;i<10;i++){ const a=i/10*Math.PI*2;
    const kz=new THREE.Mesh(new THREE.CylinderGeometry(.035,.02,.5,4), ahsap());
    kz.position.set(Math.cos(a)*3.5,.18,Math.sin(a)*3.5); g.add(kz);
    const ip=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1.6,3),
      new THREE.MeshStandardMaterial({color:0x6b5c3e,roughness:1}));
    ip.position.set(Math.cos(a)*3.05,1.35,Math.sin(a)*3.05);
    ip.rotation.z=Math.cos(a)*.85; ip.rotation.x=-Math.sin(a)*.85; g.add(ip); }
  g.position.set(x,H(x,z),z); g.scale.setScalar(s); g.rotation.y=Math.random()*6.28;
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(g); bacalar.push(new THREE.Vector3(x,H(x,z)+3.1*s,z));
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
const atesI=new THREE.PointLight(0xff8033,9,34,2); atesI.position.set(13,H(13,9)+1.4,9); scene.add(atesI);
{
  const t=new THREE.Group();
  for(let i=0;i<9;i++){const a=i/9*6.28;
    const s=new THREE.Mesh(new THREE.DodecahedronGeometry(.28+Math.random()*.12,0), MAT(0x4e4a45,1));
    s.position.set(Math.cos(a)*1.25,.12,Math.sin(a)*1.25);
    s.rotation.set(Math.random(),Math.random(),Math.random()); s.castShadow=true; t.add(s);}
  const k=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8), new THREE.MeshBasicMaterial({color:0xffa347}));
  k.position.y=.30; t.add(k); t.position.set(13,H(13,9),9); scene.add(t);
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
const kivilcim = havuz(300, new THREE.PointsMaterial({ map:noktaDoku('rgba(255,226,160,'),
  size:.30, transparent:true, opacity:1, depthWrite:false, blending:THREE.AdditiveBlending }));
const toz = havuz(420, new THREE.PointsMaterial({ map:noktaDoku('rgba(212,196,158,'),
  size:.60, transparent:true, opacity:.55, depthWrite:false }));
const atesKiv = havuz(220, new THREE.PointsMaterial({ map:noktaDoku('rgba(255,176,90,'),
  size:.34, transparent:true, opacity:.95, depthWrite:false, blending:THREE.AdditiveBlending }));
const duman = havuz(260, new THREE.PointsMaterial({ size:1.5, color:0xb9b4c8,
  transparent:true, opacity:.15, depthWrite:false }));

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

// ═══════════ 10. POST ═══════════
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), .32, .48, .80));
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
      vec2 dlt = (vUv - isikPos) * (1.0/24.0) * yogunluk;
      vec2 uv = vUv; float dec = 1.0; vec3 top = vec3(0.0);
      for (int i=0;i<24;i++){
        uv -= dlt;
        vec3 s = texture2D(tDiffuse, uv).rgb;
        float parlak = max(0.0, dot(s, vec3(.299,.587,.114)) - 0.62);
        top += s * parlak * dec;
        dec *= sonme;
      }
      gl_FragColor = vec4(taban.rgb + top * (guc/24.0) * 2.6, taban.a);
    }`
});
composer.addPass(huzmePass);

const gradePass = new ShaderPass({
  uniforms:{ tDiffuse:{value:null}, vig:{value:1}, doy:{value:.86}, t:{value:0} },
  vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse; uniform float vig, doy, t; varying vec2 vUv;
    void main(){ vec4 c=texture2D(tDiffuse,vUv); vec2 p=(vUv-.5)*vec2(1.10,1.);
      // ELDEN RING GRADE: gölgeler soğuk-mavi, ışıklar sıcak-kehribar, doygunluk düşük
      float l = dot(c.rgb, vec3(.299,.587,.114));
      c.rgb = mix(vec3(l), c.rgb, doy);
      c.rgb += vec3(-0.012, 0.000, 0.030) * (1.0 - smoothstep(0.0, 0.42, l));   // gölge mavisi
      c.rgb += vec3( 0.045, 0.020,-0.022) * smoothstep(0.42, 1.0, l);           // ışık kehribarı
      c.rgb = (c.rgb - .5) * 1.13 + .5;
      c.rgb *= mix(1., smoothstep(1.22,.40,length(p)), vig);                     // güçlü vinyet
      float grain = fract(sin(dot(vUv*vec2(1.0,1.0)+t, vec2(12.9898,78.233)))*43758.5453);
      c.rgb += (grain-0.5)*0.016;
      gl_FragColor=c; }`
});
composer.addPass(gradePass);

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
let sarsinti=0, hitstop=0, kuklaHiz=0, kuklaAci=0;
let asama='talim', vurusSayisi=0, sparVurus=0, parrySayisi=0;
let kayaHedefX=null, kayaHedefZ=null, kayaBekle=0, kayaMod='dur';
let togKombo=0, togKomboT=-9;
const HUD = { can:document.getElementById('can'), denge:document.getElementById('denge'),
  kcan:document.getElementById('kcan'), kutu:document.getElementById('dovusHud') };

function vurYap(){
  if (togan.mesgul() || togan.eylem==='devril_bekle') return;
  const zincir = (saat - togKomboT) < .95 && togKombo === 1;
  togKombo = zincir ? 0 : 1; togKomboT = saat;
  togan.basla(zincir ? 'hafif2' : 'hafif1');
}
function taklaYap(){
  if (togan.mesgul() || togan.eylem==='devril_bekle') return;
  togan.basla('takla');
  const ile = new THREE.Vector3(Math.sin(togan.kok.rotation.y),0,Math.cos(togan.kok.rotation.y));
  taklaVek.copy(ile).multiplyScalar(9.0); taklaSure = .52;
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
    return 'parry';
  }
  // BLOK?
  if (hedef.eylem === 'blok') {
    S.celik(); sarsinti = .35; hitstop = .09;
    kivilcim.at(hedef.kok.position.x, carpmaY, hedef.kok.position.z, 12, 6, 14, .4);
    hedef.denge = Math.max(0, hedef.denge - guc*.5);
    if (hedef.denge <= 0) { hedef.basla('hasar'); hedef.denge = 45; }
    return 'blok';
  }
  // TAKLA i-frame?
  if (hedef.eylem === 'takla' && hedef.eT > .06 && hedef.eT < .40) { S.islik(); return 'kacti'; }
  // TAM İSABET
  S.darbe(); sarsinti = .55; hitstop = .13;
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
function kayaYZ(dt){
  if (asama !== 'spar' && asama !== 'parry_sinavi') return;
  if (kaya.mesgul()) return;
  kayaBekle -= dt;
  const dx = togan.kok.position.x - kaya.kok.position.x;
  const dz = togan.kok.position.z - kaya.kok.position.z;
  const d = Math.hypot(dx, dz);
  kaya.kok.rotation.y = lerp(kaya.kok.rotation.y, Math.atan2(dx,dz), 1-Math.pow(.001,dt));
  const idealD = 2.4;
  if (d > idealD + .5) { kayaMod = 'yaklas'; }
  else if (d < idealD - .6) { kayaMod = 'geri'; }
  else if (kayaBekle <= 0) {
    if (asama === 'parry_sinavi') { kaya.basla('agir'); kayaBekle = 2.3; kayaMod='dur'; }
    else { kaya.basla(Math.random()<.5?'hafif1':'hafif2'); kayaBekle = 1.5+Math.random()*.9; kayaMod='dur'; }
  } else kayaMod = 'dur';
  let kh = 0;
  if (kayaMod === 'yaklas') { const s=2.9*dt; kaya.kok.position.x += dx/d*s; kaya.kok.position.z += dz/d*s; kh=2.9; }
  if (kayaMod === 'geri')   { const s=2.0*dt; kaya.kok.position.x -= dx/d*s; kaya.kok.position.z -= dz/d*s; kh=2.0; }
  kaya.kok.position.y = H(kaya.kok.position.x, kaya.kok.position.z);
  kaya._hiz = kh;
}

function etkilesim(){
  if (diyalogAcik) return;
  const d = togan.kok.position.distanceTo(kaya.kok.position);
  if (d > 3.6) return;
  if (asama === 'kaya_geldi') {
    konus([
      ['Kaya','Bir kez de ete kemiğe karşı salla. Belki kime vurduğunu hatırlarsın.'],
      ['Kaya','Hazırsan başla. Vur bana.'],
    ], () => { asama='spar'; HUD.kutu.classList.add('acik');
      gorev('Kaya\'ya üç kez isabet ettir · Sol tık vur · Sağ tık blok · Shift takla'); });
  } else if (asama === 'ders') {
    konus([
      ['Kaya','Sana üç iz göstereyim.'],
      ['Kaya','Birincisi rakibin durduğu yer. İkincisi vuracağını sandığın yer. Üçüncüsü öfkenin seni sürüklediği yer.'],
      ['Kaya','Sen hep üçüncüye basıyorsun.'],
      ['Kaya','Şimdi savuştur. Vurduğum an sağ tıkla — öfkeyle değil, dinleyerek.'],
    ], () => { asama='parry_sinavi'; parrySayisi=0; kayaBekle=1.4;
      gorev('Kaya\'nın darbesini SAĞ TIK ile savuştur (3 kez)'); });
  } else if (asama === 'bitti') {
    konus([['Kaya','Düşmek talimin sonu değil. Ana ateşin kokusu geliyor — Anya Ana bekler.']]);
  }
}

// ═══════════ 14. DÖNGÜ ═══════════
let saat=0, sonZ=performance.now(), hedefYaw=Math.PI;
const V3 = new THREE.Vector3(), V4 = new THREE.Vector3(), V5 = new THREE.Vector3();
function tik(){
  const simdi=performance.now();
  let dt = Math.min(.05,(simdi-sonZ)/1000); sonZ=simdi;
  if (hitstop > 0) { hitstop -= dt; dt *= .12; }
  saat += dt;
  gokMat.uniforms.t.value = saat;
  if (cimMat.userData.s) cimMat.userData.s.uniforms.t.value = saat;

  // ── oyuncu hareketi
  let hiz = 0;
  const kilitli = diyalogAcik || togan.eylem==='devril_bekle';
  if (!kilitli && !togan.mesgul()) {
    const kos = tus['control'] ? 2.4 : 5.4;
    let ix=0, iz=0;
    if (tus['w']) iz-=1; if (tus['s']) iz+=1; if (tus['a']) ix-=1; if (tus['d']) ix+=1;
    if (ix||iz) {
      const n=Math.hypot(ix,iz); ix/=n; iz/=n;
      const il=new THREE.Vector3(Math.sin(kamYaw),0,Math.cos(kamYaw));
      const sg=new THREE.Vector3(Math.cos(kamYaw),0,-Math.sin(kamYaw));
      V3.set(il.x*iz+sg.x*ix,0,il.z*iz+sg.z*ix).normalize();
      togan.kok.position.x += V3.x*kos*dt; togan.kok.position.z += V3.z*kos*dt;
      hedefYaw = Math.atan2(V3.x, V3.z); hiz = kos;
    }
  }
  if (taklaSure > 0) {
    taklaSure -= dt;
    togan.kok.position.x += taklaVek.x*dt; togan.kok.position.z += taklaVek.z*dt;
    taklaVek.multiplyScalar(1-2.6*dt);
  }
  if (togan.ileriIt > 0) {                       // savururken öne süzülme (ağırlık hissi)
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
  togan.kok.rotation.y += f*Math.min(1, dt*14);

  // ── baş kilidi: yakındaki rakibe/kuklaya bak (canlılık)
  {
    const dKaya = P.distanceTo(kaya.kok.position), dKukla = P.distanceTo(kukla.position);
    const dovus = asama==='spar' || asama==='parry_sinavi' || asama==='ders';
    togan.bakHedef = (dovus || dKaya < 7) ? V4.set(kaya.kok.position.x, kaya.kok.position.y+1.62, kaya.kok.position.z)
                   : (dKukla < 5.5)       ? V4.set(kukla.position.x, kukla.position.y+1.80, kukla.position.z) : null;
    kaya.bakHedef = (dovus || dKaya < 9) ? V5.set(P.x, P.y+1.62, P.z) : null;
  }
  if (window.__dbg && window.__dbg.sabitEy) {                 // geliştirme: pozu dondur
    togan.eylem = window.__dbg.sabitEy; togan.eT = window.__dbg.sabitEt; togan.anlik = true; togan.ileriIt = 0; }
  const tDarbe = togan.guncelle(saat, dt, hiz, blokBasili && !kilitli);
  if (tDarbe) {
    // kuklaya mı Kaya'ya mı?
    const dk = P.distanceTo(kukla.position);
    if ((asama==='talim'||asama==='kaya_geldi') && dk < 2.9) {
      S.tahta(); sarsinti=.45; hitstop=.07; kuklaHiz=3.0;
      toz.at(kukla.position.x,kukla.position.y+1.75,kukla.position.z,14,1.8,2.4,.8);
      kivilcim.at(kukla.position.x,kukla.position.y+1.8,kukla.position.z,8,4,12,.3);
      if (asama==='talim') { vurusSayisi++;
        gorev(`Kuklaya vur: ${Math.min(3,vurusSayisi)}/3`);
        if (vurusSayisi>=3) { asama='kaya_geldi'; kayaGel(); } }
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
  const kDarbe = kaya.guncelle(saat, dt, kaya._hiz||0, false);
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
  atesI.intensity = 8 + Math.sin(saat*9)*2 + Math.sin(saat*23);
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
  if (window.__dbg && window.__dbg.don) { /* geliştirme: kamera dondurulmuş */ } else {
  const hy = 1.55 + (togan.eylem==='devril_bekle' ? -.9 : 0);
  const hed = V3.set(P.x, P.y+hy, P.z);
  const yat = Math.cos(kamPitch)*kamMes;
  camera.position.set(hed.x+Math.sin(kamYaw)*yat, hed.y+Math.sin(kamPitch)*kamMes, hed.z+Math.cos(kamYaw)*yat);
  sarsinti *= Math.pow(.0008, dt);
  if (sarsinti > .003) { camera.position.x += (Math.random()-.5)*sarsinti;
    camera.position.y += (Math.random()-.5)*sarsinti; camera.position.z += (Math.random()-.5)*sarsinti; }
  const zAlt = H(camera.position.x, camera.position.z) + 1.1;
  if (camera.position.y < zAlt) camera.position.y = zAlt;
  camera.lookAt(hed);
  }
  { const kd = V3.set(camera.position.x-P.x, 0, camera.position.z-P.z).normalize();
    karIsik.position.set(P.x + kd.x*2.4 + 1.0, P.y + 3.1, P.z + kd.z*2.4); }
  ayI.position.set(P.x-70, 100, P.z-120); ayI.target.position.copy(P); ayI.target.updateMatrixWorld();

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
  if (!window.__dbg) window.__dbg = { THREE, scene, camera, renderer, togan, kaya, kukla,
    // yakın çekim: __dbg.bak(mesafe, yukseklik, aci) — sadece geliştirme/ekran görüntüsü için
    sabit(ey, u){ const T={hafif1:.54,hafif2:.58,agir:.92,takla:.58,parry:.36,blok:1,devril:1.0}[ey]||.5;
      this.sabitEy=ey; this.sabitEt=u*T; },
    serbest(){ this.sabitEy=null; togan.anlik=false; togan.eylem=null; },
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
  asama = 'devrilme';
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
      ], () => { togan.eylem=null; togan.basla('kalk'); asama='ders';
        gorev('Kaya ile konuş — E'); });
    }, 1100);
  }, 620);
}
function parrySinaviBitti(){
  asama = 'bitti';
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
