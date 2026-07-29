// VERRIDIA — BÖLÜM 1: Sessiz Talim ve Kül Rengi Anılar (TOGAN)
// Kitaba sadık, oynanabilir 3B sahne. %100 prosedürel: hiçbir model/doku dosyası yok.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// ═══════════ gürültü / arazi ═══════════
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return hash(ix, iy) * (1 - u) * (1 - v) + hash(ix + 1, iy) * u * (1 - v)
       + hash(ix, iy + 1) * (1 - u) * v + hash(ix + 1, iy + 1) * u * v;
}
function fbm(x, y, o = 4) { let s = 0, a = .5, f = 1;
  for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s; }
// Kartal-Yurdu: dağ geçidinde bir düzlük, kenarlarda sırtlar
const H = (x, z) => {
  const r = Math.hypot(x * .85, z);
  const dis = THREE.MathUtils.clamp((r - 46) / 150, 0, 1);
  const sirt = fbm(x * .006, z * .006, 5) * 210 + fbm(x * .022, z * .022, 4) * 30;
  const duz  = fbm(x * .03, z * .03, 3) * 1.7;
  return duz + sirt * dis * dis;
};

// ═══════════ renderer ═══════════
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.72;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x3d3a5e, 0.0013);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 4000);

// ═══════════ GÖKYÜZÜ — şafak öncesi, Tek Göz + Kızıl Sürü ═══════════
const gokMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, uniforms: { t: { value: 0 } },
  vertexShader: `varying vec3 vW; void main(){ vW=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
  varying vec3 vW; uniform float t;
  float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<6;i++){s+=a*vn(p); p*=2.03; a*=.5;} return s; }
  void main(){
    vec3 d=normalize(vW);
    float y=clamp(d.y*.5+.5,0.,1.);
    vec3 tepe=vec3(0.10,0.12,0.28), orta=vec3(0.30,0.25,0.46), ufuk=vec3(0.86,0.50,0.40);
    vec3 col=mix(ufuk,orta,smoothstep(0.0,0.26,y));
    col=mix(col,tepe,smoothstep(0.24,0.82,y));
    col += vec3(0.85,0.42,0.22)*pow(max(0.,1.-abs(d.y)*8.),3.0)*0.7;
    float bl=fbm(vec2(atan(d.z,d.x)*2.2, d.y*6.5 - t*0.004));
    col=mix(col,col*1.24+vec3(0.07,0.05,0.10),smoothstep(0.55,0.88,bl)*smoothstep(0.03,0.36,d.y)*0.8);
    vec2 sp=d.xz/max(0.10,abs(d.y)+0.30)*135.0;
    vec2 cel=floor(sp), fr=fract(sp);
    float dd=length(fr-vec2(h(cel+3.1),h(cel+7.7)));
    col += vec3(0.90,0.93,1.0)*smoothstep(0.986,1.0,h(cel))*smoothstep(0.22,0.0,dd)*1.5*smoothstep(-0.02,0.24,d.y);
    // KIZIL SÜRÜ — ufka yakın
    vec3 ks=normalize(vec3(0.70,0.20,-0.68));
    float dk=max(0.,dot(d,ks));
    col += vec3(0.68,0.09,0.14)*pow(dk,22.0)*(0.22+0.85*fbm(d.xy*9.0));
    col += vec3(1.0,0.22,0.24)*smoothstep(0.975,1.0,h(cel+55.0))*smoothstep(0.30,0.0,dd)*pow(dk,9.0)*2.6;
    // TEK GÖZ — kuzey sırtlarının üzerinde
    vec3 ay=normalize(vec3(-0.30,0.46,-0.84));
    float da=dot(d,ay);
    col += vec3(0.40,0.45,0.72)*pow(max(0.,da),560.0)*0.9;
    float disk=smoothstep(0.99920,0.99950,da);
    col=mix(col, vec3(0.90,0.92,0.99)*(0.86+0.14*vn(d.xy*280.0)), disk);
    float iris=smoothstep(0.999730,0.999820,da)*(1.-smoothstep(0.999875,0.999925,da));
    col=mix(col, vec3(0.07,0.10,0.25), iris*0.92);
    col=mix(col, vec3(0.02,0.02,0.05), smoothstep(0.999875,0.999925,da)*0.85);
    gl_FragColor=vec4(col,1.);
  }`
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(2200, 56, 36), gokMat));

// ═══════════ IŞIK ═══════════
const ayIsik = new THREE.DirectionalLight(0xccd8ff, 3.4);
ayIsik.position.set(-90, 110, -150);
ayIsik.castShadow = true;
ayIsik.shadow.mapSize.set(2048, 2048);
const sc_ = ayIsik.shadow.camera;
sc_.left = -70; sc_.right = 70; sc_.top = 70; sc_.bottom = -70; sc_.far = 400;
ayIsik.shadow.bias = -0.0006; ayIsik.shadow.normalBias = 0.02;
scene.add(ayIsik);
scene.add(new THREE.HemisphereLight(0x93a0dd, 0x6b573c, 2.9));

// ═══════════ ARAZİ ═══════════
const tg = new THREE.PlaneGeometry(900, 900, 220, 220); tg.rotateX(-Math.PI / 2);
{
  const P = tg.attributes.position, R = new Float32Array(P.count * 3);
  const saman = new THREE.Color(0xa08a52), kuru = new THREE.Color(0x796844),
        toprak = new THREE.Color(0x5c472f), kaya = new THREE.Color(0x5e5e66);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), y = H(x, z); P.setY(i, y);
    const eg = Math.abs(H(x + 2, z) - y) + Math.abs(H(x, z + 2) - y);
    const yama = fbm(x * .03 + 11, z * .03 - 7, 3), mik = fbm(x * .5, z * .5, 2);
    // talim alanı: merkez sertleşmiş toprak
    const merkez = 1 - THREE.MathUtils.clamp(Math.hypot(x, z) / 26, 0, 1);
    let c = saman.clone().lerp(kuru, THREE.MathUtils.clamp(yama * 1.4 - .2, 0, 1));
    c.lerp(toprak, Math.max(THREE.MathUtils.clamp(eg * .16, 0, .7), merkez * .85));
    if (eg > 5) c.lerp(kaya, THREE.MathUtils.clamp((eg - 5) * .12, 0, .8));
    c.multiplyScalar(.80 + .32 * mik);
    R[i*3] = c.r; R[i*3+1] = c.g; R[i*3+2] = c.b;
  }
  tg.setAttribute('color', new THREE.BufferAttribute(R, 3)); tg.computeVertexNormals();
}
const arazi = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .97 }));
arazi.receiveShadow = true; scene.add(arazi);

// ═══════════ ÇİM ═══════════
function bicak() {
  const g = new THREE.BufferGeometry(), v = [], uv = [];
  const s = [[.055,0],[.045,.4],[.028,.72],[0,1]];
  for (let i = 0; i < s.length-1; i++) { const [w0,y0]=s[i],[w1,y1]=s[i+1];
    v.push(-w0,y0,0, w0,y0,0, w1,y1,0); uv.push(0,y0, 1,y0, 1,y1);
    v.push(-w0,y0,0, w1,y1,0, -w1,y1,0); uv.push(0,y0, 1,y1, 0,y1); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv,2));
  g.computeVertexNormals(); return g;
}
const cimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 1 });
cimMat.onBeforeCompile = s => { s.uniforms.t = { value: 0 }; cimMat.userData.s = s;
  s.vertexShader = 'uniform float t;\nvarying float vY;\n' + s.vertexShader
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      vY = uv.y; float ph=float(gl_InstanceID)*0.61;
      float w = sin(t*1.4+ph)*0.22 + sin(t*2.9+ph*1.8)*0.08;
      transformed.x += w*pow(uv.y,1.7)*0.9; transformed.z += w*0.4*pow(uv.y,1.7);`);
  s.fragmentShader = 'varying float vY;\n' + s.fragmentShader
    .replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb *= mix(0.42, 1.30, vY);`);
};
const CIM = 26000, cim = new THREE.InstancedMesh(bicak(), cimMat, CIM);
{
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();
  const R = new Float32Array(CIM*3);
  for (let i = 0; i < CIM; i++) {
    const r = 6 + Math.pow(Math.random(), .5) * 190, a = Math.random()*Math.PI*2;
    const x = Math.cos(a)*r, z = Math.sin(a)*r;
    Q.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.random()*Math.PI);
    const merkez = Math.hypot(x,z) < 24 ? .25 : 1;              // talim alanı çıplak
    const s = (.65 + Math.random()*.85) * merkez;
    M.compose(V.set(x, H(x,z)-.05, z), Q, S.set(s*(.8+Math.random()*.5), s, s));
    cim.setMatrixAt(i, M);
    const t = .72+Math.random()*.5, ye = Math.random()<.25;
    R[i*3] = (ye?.40:.72)*t; R[i*3+1] = (ye?.47:.62)*t; R[i*3+2] = (ye?.24:.31)*t;
  }
  cim.instanceColor = new THREE.InstancedBufferAttribute(R,3);
}
scene.add(cim);

// ═══════════ İNSAN — eklemli prosedürel karakter (gerçek animasyon) ═══════════
function kutu(w,h,d,c){ const g=new THREE.BoxGeometry(w,h,d);
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({color:c, roughness:.85, metalness:.08})); }

class Insan {
  constructor(renk) {
    const R = renk;
    this.kok = new THREE.Group();
    this.pelvis = new THREE.Group(); this.pelvis.position.y = 0.92; this.kok.add(this.pelvis);

    this.govde = new THREE.Group(); this.pelvis.add(this.govde);
    const g = kutu(.42,.56,.26, R.kaftan); g.position.y = .30; this.govde.add(g);
    const kalca = kutu(.40,.20,.25, R.kemer); kalca.position.y = .02; this.pelvis.add(kalca);
    const yaka = kutu(.46,.11,.30, R.kurk); yaka.position.y = .57; this.govde.add(yaka);

    this.bas = new THREE.Group(); this.bas.position.y = .66; this.govde.add(this.bas);
    const kafa = kutu(.24,.26,.23, R.ten); kafa.position.y = .13; this.bas.add(kafa);
    const sac = kutu(.27,.13,.26, R.sac); sac.position.y = .245; this.bas.add(sac);

    const kolYap = (yon) => {
      const ust = new THREE.Group(); ust.position.set(.26*yon, .50, 0); this.govde.add(ust);
      const u = kutu(.13,.30,.14, R.kaftan); u.position.y = -.15; ust.add(u);
      const alt = new THREE.Group(); alt.position.y = -.30; ust.add(alt);
      const a = kutu(.115,.28,.125, R.ten); a.position.y = -.14; alt.add(a);
      return { ust, alt };
    };
    this.kolL = kolYap(1); this.kolR = kolYap(-1);

    const bacakYap = (yon) => {
      const ust = new THREE.Group(); ust.position.set(.12*yon, -.02, 0); this.pelvis.add(ust);
      const u = kutu(.16,.44,.17, R.pantolon); u.position.y = -.22; ust.add(u);
      const alt = new THREE.Group(); alt.position.y = -.44; ust.add(alt);
      const a = kutu(.145,.40,.15, R.cizme); a.position.y = -.20; alt.add(a);
      const ayak = kutu(.16,.10,.26, R.cizme); ayak.position.set(0,-.40,.05); alt.add(ayak);
      return { ust, alt };
    };
    this.bacakL = bacakYap(1); this.bacakR = bacakYap(-1);

    // kılıç (sağ elde)
    this.kilic = new THREE.Group(); this.kolR.alt.add(this.kilic);
    this.kilic.position.set(0,-.28,0);
    const bicak = kutu(.055,.92,.02, R.celik); bicak.position.y = .46; this.kilic.add(bicak);
    const balcak = kutu(.20,.045,.055, R.altin); this.kilic.add(balcak);
    const sap = kutu(.05,.20,.05, 0x3a2a18); sap.position.y = -.11; this.kilic.add(sap);
    this.kilic.rotation.z = Math.PI;   // aşağı bakar (dinlenme)

    this.kok.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.faz = Math.random()*6.28; this.durum = 'bekle'; this.saldiriT = -1;
  }
  guncelle(t, hiz) {
    const B = this.bacakL, C = this.bacakR, K = this.kolL, L = this.kolR;
    if (this.saldiriT >= 0) {                                  // ── kılıç savurma
      const u = (t - this.saldiriT) / .55;
      if (u >= 1) { this.saldiriT = -1; }
      else {
        const e = u < .35 ? -(u/.35)*1.5 : -1.5 + ((u-.35)/.65)*3.2;
        L.ust.rotation.x = e; L.ust.rotation.z = -0.35; L.alt.rotation.x = -0.5 + u*0.4;
        this.kilic.rotation.z = Math.PI * (1 - Math.min(1, u*2.2));
        this.govde.rotation.y = -0.35 * Math.sin(u*Math.PI);
        K.ust.rotation.x = 0.5*Math.sin(u*Math.PI);
        B.ust.rotation.x = -0.15; C.ust.rotation.x = 0.15;
        return;
      }
    }
    const y = Math.min(1, hiz / 4.2);
    if (y > 0.02) {                                            // ── yürüme / koşu
      const f = t * (5.5 + y*4.5) + this.faz;
      const g = 0.75 * y;
      B.ust.rotation.x = Math.sin(f) * g;
      C.ust.rotation.x = Math.sin(f + Math.PI) * g;
      B.alt.rotation.x = Math.max(0, -Math.sin(f - .7)) * 1.0 * y;
      C.alt.rotation.x = Math.max(0, -Math.sin(f + Math.PI - .7)) * 1.0 * y;
      K.ust.rotation.x = Math.sin(f + Math.PI) * .55 * y;
      L.ust.rotation.x = Math.sin(f) * .40 * y;
      K.alt.rotation.x = -.25*y; L.alt.rotation.x = -.30*y;
      this.pelvis.position.y = .92 + Math.abs(Math.sin(f)) * .055 * y;
      this.govde.rotation.y = Math.sin(f) * .10 * y;
      this.govde.rotation.x = .10 * y;
      this.kilic.rotation.z = Math.PI;
    } else {                                                   // ── nefes / bekleme
      const f = t * 1.5 + this.faz;
      B.ust.rotation.x = C.ust.rotation.x = 0;
      B.alt.rotation.x = C.alt.rotation.x = 0;
      K.ust.rotation.x = -.06 + Math.sin(f)*.035; L.ust.rotation.x = -.06 - Math.sin(f)*.035;
      K.ust.rotation.z = .10; L.ust.rotation.z = -.10;
      K.alt.rotation.x = -.22; L.alt.rotation.x = -.26;
      this.pelvis.position.y = .92 + Math.sin(f)*.018;
      this.govde.rotation.y = 0; this.govde.rotation.x = .02;
      this.bas.rotation.y = Math.sin(t*.4 + this.faz)*.18;
      this.kilic.rotation.z = Math.PI;
    }
  }
  saldir(t) { if (this.saldiriT < 0) { this.saldiriT = t; return true; } return false; }
}

const TOGAN_R = { kaftan:0x3d5170, kurk:0xa9a49a, ten:0xc08e63, sac:0x241c18,
                  kemer:0x5a4023, pantolon:0x35405a, cizme:0x4a3520, celik:0xc9ced6, altin:0xb08b3e };
const KAYA_R  = { kaftan:0x5c5334, kurk:0x8e8574, ten:0xc59468, sac:0x2b2119,
                  kemer:0x4d3a20, pantolon:0x4a4632, cizme:0x453118, celik:0x8a6b3c, altin:0x8a6b3c };

const togan = new Insan(TOGAN_R);
togan.kok.position.set(4, H(4,6), 6);
scene.add(togan.kok);
const kaya = new Insan(KAYA_R);
kaya.kok.position.set(-9, H(-9,-4), -4);
kaya.kok.rotation.y = Math.PI*0.75;
scene.add(kaya.kok);

// ═══════════ KAMP: yurt, kukla, kazık, ateş ═══════════
function yurt(x, z, s = 1) {
  const g = new THREE.Group();
  const govde = new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.75,2.0,14),
    new THREE.MeshStandardMaterial({ color:0xa79c86, roughness:.95 }));
  govde.position.y = 1.0; g.add(govde);
  const cati = new THREE.Mesh(new THREE.ConeGeometry(2.95,1.7,14),
    new THREE.MeshStandardMaterial({ color:0x968b76, roughness:.95 }));
  cati.position.y = 2.75; g.add(cati);
  const kapi = new THREE.Mesh(new THREE.BoxGeometry(.9,1.3,.12),
    new THREE.MeshStandardMaterial({ color:0x3a2a18, roughness:1 }));
  kapi.position.set(0,.65,2.72); g.add(kapi);
  for (let i = 0; i < 8; i++) {                       // ip/kazık detayı
    const a = i/8*Math.PI*2;
    const ip = new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.1,4),
      new THREE.MeshStandardMaterial({ color:0x5a4a30 }));
    ip.position.set(Math.cos(a)*2.9, .55, Math.sin(a)*2.9); g.add(ip);
  }
  g.position.set(x, H(x,z), z); g.scale.setScalar(s);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(g); return g;
}
yurt(-20, 14, 1.15); yurt(-30, -6, .95); yurt(16, 20, 1.0); yurt(26, -2, .9); yurt(-6, 26, 1.05);

// talim kuklası
const kukla = new THREE.Group();
{
  const direk = new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,2.4,7),
    new THREE.MeshStandardMaterial({ color:0x4a3520, roughness:1 }));
  direk.position.y = 1.2; kukla.add(direk);
  const govde = new THREE.Mesh(new THREE.CylinderGeometry(.42,.36,1.0,9),
    new THREE.MeshStandardMaterial({ color:0xa08a54, roughness:1 }));
  govde.position.y = 1.75; kukla.add(govde);
  const kol = new THREE.Mesh(new THREE.BoxGeometry(1.7,.16,.16),
    new THREE.MeshStandardMaterial({ color:0x4a3520, roughness:1 }));
  kol.position.y = 1.95; kukla.add(kol);
  const bas = new THREE.Mesh(new THREE.SphereGeometry(.26,9,7),
    new THREE.MeshStandardMaterial({ color:0x8d7a4a, roughness:1 }));
  bas.position.y = 2.42; kukla.add(bas);
  kukla.position.set(-2, H(-2,-9), -9);
  kukla.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(kukla);
}

// Burkut'un kazığı + kartal
const kazik = new THREE.Mesh(new THREE.CylinderGeometry(.15,.18,3.2,7),
  new THREE.MeshStandardMaterial({ color:0x4f3a22, roughness:1 }));
kazik.position.set(7, H(7,-11)+1.6, -11); kazik.castShadow = true; scene.add(kazik);
const burkut = new THREE.Group();
{
  const g = new THREE.Mesh(new THREE.SphereGeometry(.30,9,7),
    new THREE.MeshStandardMaterial({ color:0x5a4326, roughness:.9 }));
  g.scale.set(1,.95,1.35); burkut.add(g);
  const bas = new THREE.Mesh(new THREE.SphereGeometry(.17,8,6),
    new THREE.MeshStandardMaterial({ color:0xa08652, roughness:.9 }));
  bas.position.set(0,.26,.22); burkut.add(bas);
  const gaga = new THREE.Mesh(new THREE.ConeGeometry(.06,.18,5),
    new THREE.MeshStandardMaterial({ color:0xd8b24a }));
  gaga.rotation.x = Math.PI*.5; gaga.position.set(0,.24,.40); burkut.add(gaga);
  const kanat = (y) => { const k = new THREE.Mesh(new THREE.BoxGeometry(.10,.36,.62),
      new THREE.MeshStandardMaterial({ color:0x4a3520, roughness:.95 }));
    k.position.set(.28*y,.02,-.04); k.rotation.z = -.25*y; burkut.add(k); return k; };
  burkut.kanatL = kanat(1); burkut.kanatR = kanat(-1);
  burkut.position.set(7, H(7,-11)+3.35, -11);
  burkut.traverse(o => { if (o.isMesh) o.castShadow = true; });
  scene.add(burkut);
}

// ana ateş
const atesIsik = new THREE.PointLight(0xff8033, 9, 34, 2.0);
atesIsik.position.set(12, H(12,8)+1.4, 8); scene.add(atesIsik);
{
  const tas = new THREE.Group();
  for (let i=0;i<9;i++){ const a=i/9*Math.PI*2;
    const t = new THREE.Mesh(new THREE.DodecahedronGeometry(.28+Math.random()*.12,0),
      new THREE.MeshStandardMaterial({color:0x4e4a45, roughness:1}));
    t.position.set(Math.cos(a)*1.25, .12, Math.sin(a)*1.25); t.rotation.set(Math.random(),Math.random(),Math.random());
    t.castShadow=true; tas.add(t); }
  const kor = new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),
    new THREE.MeshBasicMaterial({color:0xffa347}));
  kor.position.y = .30; tas.add(kor);
  tas.position.set(12, H(12,8), 8); scene.add(tas);
}
// ateş kıvılcımları
const KIV = 260, kivG = new THREE.BufferGeometry();
const kivP = new Float32Array(KIV*3), kivD = [];
for (let i=0;i<KIV;i++){ kivP[i*3+1]=-99; kivD.push({o:Math.random()*2}); }
kivG.setAttribute('position', new THREE.BufferAttribute(kivP,3));
function nokta(renk){ const c=document.createElement('canvas'); c.width=c.height=32;
  const g=c.getContext('2d'); const gr=g.createRadialGradient(16,16,0,16,16,16);
  gr.addColorStop(0,renk+'1)'); gr.addColorStop(.4,renk+'.5)'); gr.addColorStop(1,renk+'0)');
  g.fillStyle=gr; g.fillRect(0,0,32,32); const t=new THREE.CanvasTexture(c); return t; }
scene.add(new THREE.Points(kivG, new THREE.PointsMaterial({
  map: nokta('rgba(255,176,90,'), size:.42, transparent:true, opacity:.95,
  depthWrite:false, blending:THREE.AdditiveBlending })));

// vuruş tozu
const TOZ = 400, tozG = new THREE.BufferGeometry();
const tozP = new Float32Array(TOZ*3), tozD = [];
for (let i=0;i<TOZ;i++){ tozP[i*3+1]=-99; tozD.push({o:0,x:0,y:0,z:0,vx:0,vy:0,vz:0}); }
tozG.setAttribute('position', new THREE.BufferAttribute(tozP,3));
scene.add(new THREE.Points(tozG, new THREE.PointsMaterial({
  map: nokta('rgba(214,196,156,'), size:.55, transparent:true, opacity:.55, depthWrite:false })));
let tozI = 0;
function tozAt(x,y,z,n){ for(let i=0;i<n;i++){ const d=tozD[tozI];
  d.x=x+(Math.random()-.5)*.5; d.y=y+Math.random()*.4; d.z=z+(Math.random()-.5)*.5;
  d.vx=(Math.random()-.5)*.06; d.vy=.03+Math.random()*.05; d.vz=(Math.random()-.5)*.06;
  d.o=.8+Math.random()*.7; tozI=(tozI+1)%TOZ; } }

// ═══════════ POST ═══════════
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), .30, .45, .82));
composer.addPass(new ShaderPass({
  uniforms:{ tDiffuse:{value:null} },
  vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){ vec4 c=texture2D(tDiffuse,vUv);
      vec2 p=(vUv-0.5)*vec2(1.10,1.0);
      c.rgb *= smoothstep(1.02,0.32,length(p));
      c.rgb = (c.rgb-0.5)*1.10+0.5;
      float l=dot(c.rgb,vec3(0.299,0.587,0.114)); c.rgb=mix(vec3(l),c.rgb,1.12);
      gl_FragColor=c; }`
}));

// ═══════════ GİRDİ + KAMERA ═══════════
const tus = {};
addEventListener('keydown', e => { tus[e.key.toLowerCase()] = true;
  if (e.key === ' ') e.preventDefault();
  if (e.key.toLowerCase() === 'e') etkilesim();
});
addEventListener('keyup', e => tus[e.key.toLowerCase()] = false);
const cv = document.getElementById('c');
let kamYaw = Math.PI, kamPitch = .19, kamMes = 8.5, suru = false, sx = 0, sy = 0;
cv.addEventListener('pointerdown', e => { suru = true; sx = e.clientX; sy = e.clientY; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointerup', () => suru = false);
cv.addEventListener('pointermove', e => { if (!suru) return;
  kamYaw -= (e.clientX-sx)*.006;
  kamPitch = THREE.MathUtils.clamp(kamPitch + (e.clientY-sy)*.004, .02, 1.15);
  sx = e.clientX; sy = e.clientY; });
cv.addEventListener('wheel', e => { kamMes = THREE.MathUtils.clamp(kamMes*(1+Math.sign(e.deltaY)*.12), 3, 26); e.preventDefault(); }, {passive:false});
cv.addEventListener('click', () => { if (!diyalogAcik) vur(); });

// ═══════════ DİYALOG (kitap metni) ═══════════
const dEl = document.getElementById('diyalog'), dAd = document.getElementById('dad'),
      dMetin = document.getElementById('dmetin'), ipucuEl = document.getElementById('ipucu');
let diyalogAcik = false, dSira = [], dIdx = 0, dYaz = 0, dTam = '';
function konus(satirlar) { dSira = satirlar; dIdx = -1; diyalogAcik = true; dEl.classList.add('acik'); sonraki(); }
function sonraki() {
  dIdx++;
  if (dIdx >= dSira.length) { diyalogAcik = false; dEl.classList.remove('acik'); return; }
  dAd.textContent = dSira[dIdx][0]; dAd.style.display = dSira[dIdx][0] ? '' : 'none';
  dTam = dSira[dIdx][1]; dYaz = 0; dMetin.textContent = '';
}
addEventListener('keydown', e => {
  if (!diyalogAcik) return;
  if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'e') {
    if (dYaz < dTam.length) { dYaz = dTam.length; dMetin.textContent = dTam; }
    else sonraki();
  }
});

// ═══════════ SAHNE AKIŞI (kitaba sadık) ═══════════
let asama = 'talim';        // talim → kaya_geldi → ders → serbest
let vurusSayisi = 0;
function vur() {
  if (!togan.saldir(saat)) return;
  setTimeout(() => {
    const d = togan.kok.position.distanceTo(kukla.position);
    if (d < 2.6) {
      tozAt(kukla.position.x, kukla.position.y+1.7, kukla.position.z, 8);
      kukla.rotation.z = -.16; vurusSayisi++;
      if (asama === 'talim' && vurusSayisi >= 3) { asama = 'kaya_geldi'; kayaGel(); }
    }
  }, 220);
}
function kayaGel() {
  konus([
    ['', 'Kılıç üçüncü kez göğsüne gömülünce kuklanın tahta omurgası çatladı.'],
    ['', 'Aşağıda Kartal-Yurdu uyuyordu. Tek Göz kuzey sırtlarının üzerinde asılıydı.'],
    ['Kaya', 'Demiri değil, kendini yoruyorsun.'],
    ['Kaya', 'Bir kez de ete kemiğe karşı salla. Belki kime vurduğunu hatırlarsın.'],
    ['', 'Kaya iki tahta kılıç getirdi. → Ona yaklaş ve E ile konuş.'],
  ]);
  kayaHedef = new THREE.Vector3(togan.kok.position.x - 3.4, 0, togan.kok.position.z - 2.2);
  asama = 'ders';
}
let kayaHedef = null;
function etkilesim() {
  if (diyalogAcik) return;
  const d = togan.kok.position.distanceTo(kaya.kok.position);
  if (d < 3.4) {
    if (asama === 'ders') {
      konus([
        ['Kaya', 'Bu öfke bir Azgut’un işine yarayabilir. Bir Rüzgar-Dinleyen’i ise öldürür.'],
        ['Kaya', 'Sana üç iz göstereyim.'],
        ['Kaya', 'Birincisi rakibin durduğu yer. İkincisi vuracağını sandığın yer. Üçüncüsü öfkenin seni sürüklediği yer.'],
        ['Kaya', 'Sen hep üçüncüye basıyorsun.'],
        ['Togan', 'Neyi duyayım?'],
        ['Kaya', 'Senden başka birini.'],
        ['', 'Kaya tahta kılıçları topladı. Ana ateşin kokusu geliyor — bizon eti, dağ kekiği.'],
      ]);
      asama = 'serbest';
    } else {
      konus([['Kaya', 'Düşmek talimin sonu değil. Ayağa kalk.']]);
    }
  }
}

// ═══════════ DÖNGÜ ═══════════
const V = new THREE.Vector3();
let saat = 0, sonZaman = performance.now();
let hedefYaw = Math.PI;
function tik() {
  const simdi = performance.now(), dt = Math.min(.05, (simdi - sonZaman)/1000);
  sonZaman = simdi; saat += dt;
  gokMat.uniforms.t.value = saat;
  if (cimMat.userData.s) cimMat.userData.s.uniforms.t.value = saat;

  // ── oyuncu hareketi (kameraya göre)
  let hiz = 0;
  if (!diyalogAcik) {
    const kos = tus['shift'] ? 6.6 : 3.4;
    let ix = 0, iz = 0;
    if (tus['w']) iz -= 1; if (tus['s']) iz += 1;
    if (tus['a']) ix -= 1; if (tus['d']) ix += 1;
    if (ix || iz) {
      const n = Math.hypot(ix, iz); ix /= n; iz /= n;
      const ileri = new THREE.Vector3(Math.sin(kamYaw), 0, Math.cos(kamYaw));
      const sag = new THREE.Vector3(Math.cos(kamYaw), 0, -Math.sin(kamYaw));
      V.set(ileri.x*iz + sag.x*ix, 0, ileri.z*iz + sag.z*ix).normalize();
      const p = togan.kok.position;
      p.x += V.x * kos * dt; p.z += V.z * kos * dt;
      p.x = THREE.MathUtils.clamp(p.x, -150, 150); p.z = THREE.MathUtils.clamp(p.z, -150, 150);
      hedefYaw = Math.atan2(V.x, V.z);
      hiz = kos;
      if (Math.random() < dt*8) tozAt(p.x, H(p.x,p.z)+.05, p.z, 1);
    }
  }
  togan.kok.position.y = H(togan.kok.position.x, togan.kok.position.z);
  let fark = hedefYaw - togan.kok.rotation.y;
  while (fark > Math.PI) fark -= Math.PI*2; while (fark < -Math.PI) fark += Math.PI*2;
  togan.kok.rotation.y += fark * Math.min(1, dt*12);
  togan.guncelle(saat, hiz);

  // ── Kaya yürüyüp gelir
  let kHiz = 0;
  if (kayaHedef) {
    const p = kaya.kok.position, dx = kayaHedef.x - p.x, dz = kayaHedef.z - p.z;
    const m = Math.hypot(dx, dz);
    if (m > .4) { p.x += dx/m * 2.6 * dt; p.z += dz/m * 2.6 * dt; kHiz = 2.6;
      kaya.kok.rotation.y = Math.atan2(dx, dz); }
    else kayaHedef = null;
    p.y = H(p.x, p.z);
  } else {
    const dx = togan.kok.position.x - kaya.kok.position.x, dz = togan.kok.position.z - kaya.kok.position.z;
    if (Math.hypot(dx,dz) < 9) kaya.kok.rotation.y += (Math.atan2(dx,dz) - kaya.kok.rotation.y) * dt*2;
  }
  kaya.guncelle(saat, kHiz);

  // ── kukla toparlanır
  kukla.rotation.z += (0 - kukla.rotation.z) * dt * 6;

  // ── Burkut
  burkut.rotation.y = Math.sin(saat*.5)*.5;
  const kanatAcisi = -.25 + Math.max(0, Math.sin(saat*1.1))*.35;
  burkut.kanatL.rotation.z = -kanatAcisi; burkut.kanatR.rotation.z = kanatAcisi;
  burkut.position.y = H(7,-11)+3.35 + Math.sin(saat*1.6)*.03;

  // ── ateş
  atesIsik.intensity = 8 + Math.sin(saat*9)*2 + Math.sin(saat*23)*1;
  const kp = kivG.attributes.position;
  for (let i=0;i<KIV;i++){ const d=kivD[i]; d.o -= dt;
    if (d.o <= 0) { d.o = .5+Math.random()*1.6;
      kp.array[i*3] = 12+(Math.random()-.5)*.9;
      kp.array[i*3+1] = H(12,8)+.3;
      kp.array[i*3+2] = 8+(Math.random()-.5)*.9; }
    else { kp.array[i*3+1] += dt*(1.4+Math.random()*.8);
      kp.array[i*3] += dt*.25; kp.array[i*3+2] += dt*(Math.random()-.5)*.4; } }
  kp.needsUpdate = true;

  // ── toz
  const tp = tozG.attributes.position;
  for (let i=0;i<TOZ;i++){ const d=tozD[i];
    if (d.o > 0) { d.o -= dt; d.x+=d.vx; d.y+=d.vy; d.z+=d.vz; d.vy*=.985;
      tp.array[i*3]=d.x; tp.array[i*3+1]=d.y; tp.array[i*3+2]=d.z; }
    else tp.array[i*3+1] = -99; }
  tp.needsUpdate = true;

  // ── diyalog daktilo
  if (diyalogAcik && dYaz < dTam.length) {
    dYaz = Math.min(dTam.length, dYaz + dt*42);
    dMetin.textContent = dTam.slice(0, Math.floor(dYaz));
  }

  // ── ipucu
  const yakinKaya = togan.kok.position.distanceTo(kaya.kok.position) < 3.4;
  ipucuEl.style.opacity = (!diyalogAcik && yakinKaya) ? 1 : 0;

  // ── kamera (3. şahıs)
  const hedef = togan.kok.position.clone().add(new THREE.Vector3(0, 1.9, 0));
  const yatay = Math.cos(kamPitch) * kamMes;
  camera.position.set(hedef.x + Math.sin(kamYaw)*yatay,
                      hedef.y + Math.sin(kamPitch)*kamMes,
                      hedef.z + Math.cos(kamYaw)*yatay);
  const zeminAlt = H(camera.position.x, camera.position.z) + 1.2;
  if (camera.position.y < zeminAlt) camera.position.y = zeminAlt;
  camera.lookAt(hedef);
  ayIsik.position.set(togan.kok.position.x - 90, 110, togan.kok.position.z - 150);
  ayIsik.target.position.copy(togan.kok.position); ayIsik.target.updateMatrixWorld();

  composer.render();
  window.__hazir = true;
  requestAnimationFrame(tik);
}
scene.add(ayIsik.target);
tik();

// açılış anlatısı
setTimeout(() => konus([
  ['', 'BİRİNCİ KİTAP · BÖLÜM 1 — Sessiz Talim ve Kül Rengi Anılar'],
  ['', 'Talim alanının toprağı, aylardır aynı yerde dönüp duran ayaklarının altında sertleşmişti.'],
  ['Togan', 'Kaçıncı darbe olduğunu bilmiyorum. Şafak hâlâ ne kadar uzak?'],
  ['', 'Kuklaya yürü ve üç kez vur. (WASD yürü · Shift koş · Sol tık vur · E konuş)'],
]), 900);

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
