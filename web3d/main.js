// VERRIDIA — Bozkır prototipi v2. %100 PROSEDÜREL: hiçbir doku/model dosyası yok.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// ============ gürültü ============
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return hash(ix, iy) * (1 - u) * (1 - v) + hash(ix + 1, iy) * u * (1 - v)
       + hash(ix, iy + 1) * (1 - u) * v + hash(ix + 1, iy + 1) * u * v;
}
function fbm(x, y, oct = 5) { let s = 0, a = .5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s; }
// Savaş ovası: ortada geniş düzlük, kenarlarda tepeler (ordu görünsün)
const H = (x, z) => {
  const r = Math.hypot(x, z + 120);
  const duzluk = THREE.MathUtils.clamp((r - 120) / 420, 0, 1);      // 0=ova, 1=tepe
  const tepe = fbm(x * .0042, z * .0042, 5) * 190 + fbm(x * .017, z * .017, 4) * 26;
  const ova  = fbm(x * .012, z * .012, 3) * 7 + fbm(x * .05, z * .05, 3) * 1.8;
  return ova + tepe * duzluk * duzluk - 12;
};

// ============ renderer ============
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x8c7d97, 0.00052);
const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.4, 8000);

// ============ GÖKYÜZÜ ============
const gokMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  uniforms: { t: { value: 0 } },
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
    vec3 gece=vec3(0.16,0.20,0.42), orta=vec3(0.46,0.40,0.60), ufuk=vec3(1.10,0.72,0.50);
    vec3 col = mix(ufuk, orta, smoothstep(0.0,0.30,y));
    col = mix(col, gece, smoothstep(0.28,0.85,y));
    // şafak bandı
    col += vec3(1.25,0.72,0.36)*pow(max(0.,1.-abs(d.y)*6.),2.6)*1.05;
    // bulut şeritleri
    float bl = fbm(vec2(atan(d.z,d.x)*2.4, d.y*7.0 - t*0.006));
    col = mix(col, col*1.28+vec3(0.10,0.07,0.12), smoothstep(0.52,0.86,bl)*smoothstep(0.02,0.35,d.y)*0.75);
    // yıldızlar (ince, hücresel)
    vec2 sp = d.xz/max(0.10,abs(d.y)+0.30)*130.0;
    vec2 cel=floor(sp), fr=fract(sp);
    float rn=h(cel);
    float par=smoothstep(0.988,1.0,rn);
    float dd=length(fr-vec2(h(cel+3.1),h(cel+7.7)));
    float par2=smoothstep(0.9975,1.0,h(cel+21.3));
    col += vec3(0.88,0.91,1.0)*par*smoothstep(0.22,0.0,dd)*1.35*smoothstep(-0.02,0.25,d.y);
    col += vec3(1.0)*par2*smoothstep(0.34,0.0,dd)*2.4*smoothstep(-0.02,0.25,d.y);
    // KIZIL SÜRÜ — kızıl yıldız kümesi (bulutlu)
    vec3 ks=normalize(vec3(0.62,0.34,-0.72));
    float dk=max(0.,dot(d,ks));
    float nb=fbm(d.xy*9.0+vec2(t*0.008,0.));
    col += vec3(0.72,0.10,0.16)*pow(dk,20.0)*(0.25+0.85*nb);
    float kz=smoothstep(0.975,1.0,h(cel+55.0))*smoothstep(0.30,0.0,dd)*pow(dk,9.0)*3.0;
    col += vec3(1.0,0.22,0.24)*kz;
    // TEK GÖZ
    vec3 ay=normalize(vec3(-0.42,0.40,-0.82));
    float da=dot(d,ay);
    col += vec3(0.42,0.47,0.72)*pow(max(0.,da),620.0)*0.85;                 // hale
    float disk=smoothstep(0.99930,0.99955,da);
    vec3 ayr = vec3(0.90,0.92,0.99);
    float kr = vn(d.xy*300.0);                                              // krater
    ayr *= 0.86+0.14*kr;
    col = mix(col, ayr, disk);
    float iris=smoothstep(0.999755,0.999830,da)*(1.-smoothstep(0.999880,0.999925,da));
    col = mix(col, vec3(0.08,0.11,0.26), iris*0.92);
    float bebek=smoothstep(0.999880,0.999930,da);
    col = mix(col, vec3(0.02,0.02,0.05), bebek*0.85);
    gl_FragColor=vec4(col,1.);
  }`
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(4000, 64, 40), gokMat));

// ============ IŞIK ============
const ayIsik = new THREE.DirectionalLight(0xffdcb0, 5.2);
ayIsik.position.set(-520, 240, -700);
ayIsik.castShadow = true;
ayIsik.shadow.mapSize.set(3072, 3072);
const sc_ = ayIsik.shadow.camera;
sc_.left = -420; sc_.right = 420; sc_.top = 420; sc_.bottom = -420; sc_.far = 2200;
ayIsik.shadow.bias = -0.0009;
scene.add(ayIsik);
scene.add(new THREE.HemisphereLight(0x9fb6e8, 0x6d5a3c, 1.55));
const dolgu = new THREE.DirectionalLight(0x8fa6e0, .55); dolgu.position.set(480, 300, 460); scene.add(dolgu);

// ============ ARAZİ ============
const BOY = 3400, SEG = 300;
const tg = new THREE.PlaneGeometry(BOY, BOY, SEG, SEG); tg.rotateX(-Math.PI / 2);
const P = tg.attributes.position, RENK = new Float32Array(P.count * 3);
const C = {
  saman: new THREE.Color(0xbda05a), kuru: new THREE.Color(0x8d7742),
  yesil: new THREE.Color(0x5a6a3c), toprak: new THREE.Color(0x584429),
  kaya: new THREE.Color(0x55555c)
};
for (let i = 0; i < P.count; i++) {
  const x = P.getX(i), z = P.getZ(i), y = H(x, z); P.setY(i, y);
  const egim = Math.abs(H(x + 4, z) - y) + Math.abs(H(x, z + 4) - y);
  const yama = fbm(x * .009 + 71, z * .009 - 22, 4);
  const mikro = fbm(x * .35, z * .35, 2);
  let c = C.saman.clone().lerp(C.kuru, THREE.MathUtils.clamp(yama * 1.5 - .25, 0, 1));
  c.lerp(C.yesil, THREE.MathUtils.clamp((yama - .58) * 2.2, 0, .75));
  c.lerp(C.toprak, THREE.MathUtils.clamp(egim * .10, 0, .7));
  if (egim > 9) c.lerp(C.kaya, THREE.MathUtils.clamp((egim - 9) * .09, 0, .8));
  c.multiplyScalar(.82 + .34 * mikro);
  RENK[i * 3] = c.r; RENK[i * 3 + 1] = c.g; RENK[i * 3 + 2] = c.b;
}
tg.setAttribute('color', new THREE.BufferAttribute(RENK, 3)); tg.computeVertexNormals();
const arazi = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98 }));
arazi.receiveShadow = true; scene.add(arazi);

// ============ ÇİM ============
function bicakGeo() {
  const g = new THREE.BufferGeometry();
  const v = [], uvv = [], H0 = 1.0;
  const sec = [[.09, 0], [.075, .35], [.05, .68], [0, 1]];
  for (let i = 0; i < sec.length - 1; i++) {
    const [w0, y0] = sec[i], [w1, y1] = sec[i + 1];
    v.push(-w0, y0 * H0, 0, w0, y0 * H0, 0, w1, y1 * H0, 0);
    uvv.push(0, y0, 1, y0, 1, y1);
    v.push(-w0, y0 * H0, 0, w1, y1 * H0, 0, -w1, y1 * H0, 0);
    uvv.push(0, y0, 1, y1, 0, y1);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvv, 2));
  g.computeVertexNormals();
  return g;
}
const CIM = 32000;
const cimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 1 });
cimMat.onBeforeCompile = s => {
  s.uniforms.t = { value: 0 }; cimMat.userData.s = s;
  s.vertexShader = 'uniform float t;\nvarying float vY;\n' + s.vertexShader
    .replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vY = uv.y;
      float ph = float(gl_InstanceID)*0.613;
      float w  = sin(t*1.35 + ph) * 0.26 + sin(t*2.7 + ph*1.9) * 0.09;
      float k  = pow(uv.y, 1.7);
      transformed.x += w * k * 1.25;
      transformed.z += w * 0.5 * k;`);
  s.fragmentShader = 'varying float vY;\n' + s.fragmentShader
    .replace('#include <color_fragment>', `
      #include <color_fragment>
      diffuseColor.rgb *= mix(0.55, 1.45, vY);`);  // dipte koyu, uçta parlak
};
const cim = new THREE.InstancedMesh(bicakGeo(), cimMat, CIM);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();
const cR = new Float32Array(CIM * 3);
for (let i = 0; i < CIM; i++) {
  const r = 55 + Math.pow(Math.random(), .55) * 560, a = Math.random() * Math.PI * 2;
  const x = Math.cos(a) * r, z = Math.sin(a) * r - 130, y = H(x, z);
  Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI);
  const s = 1.1 + Math.random() * 1.5;
  M.compose(V.set(x, y - .1, z), Q, S.set(s * (.7 + Math.random() * .6), s, s));
  cim.setMatrixAt(i, M);
  const t = .72 + Math.random() * .5, kur = Math.random() < .72;
  const col = kur ? [.78 * t, .66 * t, .34 * t] : [.46 * t, .53 * t, .28 * t];
  cR[i * 3] = col[0]; cR[i * 3 + 1] = col[1]; cR[i * 3 + 2] = col[2];
}
cim.instanceColor = new THREE.InstancedBufferAttribute(cR, 3);
scene.add(cim);

// ============ ORDU ============
function askerGeo() {
  const parts = [];
  const bL = new THREE.CylinderGeometry(.115, .10, .92, 5); bL.translate(0, .46, .155);        // sol bacak
  const bR = new THREE.CylinderGeometry(.115, .10, .92, 5); bR.translate(0, .46, -.155);        // sağ bacak
  const g1 = new THREE.CylinderGeometry(.34, .44, 1.10, 6); g1.translate(0, 1.47, 0);           // gövde
  const g2 = new THREE.SphereGeometry(.25, 8, 6); g2.translate(0, 2.20, 0);                     // baş
  const g3 = new THREE.ConeGeometry(.28, .32, 7); g3.translate(0, 2.42, 0);                     // miğfer
  const g4 = new THREE.CylinderGeometry(.042, .042, 3.7, 4); g4.translate(.44, 2.05, 0);        // mızrak
  const g5 = new THREE.ConeGeometry(.085, .32, 4); g5.translate(.44, 4.05, 0);                  // uç
  const g6 = new THREE.CylinderGeometry(.31, .31, .085, 8); g6.rotateX(Math.PI / 2); g6.translate(-.38, 1.52, 0); // kalkan
  parts.push(bL, bR, g1, g2, g3, g4, g5, g6);
  return mergeGeometries(parts, false);
}
const ASKER = 4200;
const askerMat = new THREE.MeshStandardMaterial({ roughness: .78, metalness: .35 });
askerMat.onBeforeCompile = s => {
  s.uniforms.t = { value: 0 }; askerMat.userData.s = s;
  s.vertexShader = 'uniform float t;\n' + s.vertexShader.replace('#include <begin_vertex>', `
    #include <begin_vertex>
    float ph = float(gl_InstanceID)*1.7;
    // BACAK YÜRÜYÜŞÜ: kalçanın altındaki köşeler adım atar (sol/sağ zıt faz)
    float bacak = smoothstep(0.95, 0.05, position.y);
    float taraf = position.z > 0.0 ? 0.0 : 3.14159;
    float adim  = sin(t*5.4 + ph + taraf);
    transformed.x += adim * bacak * 0.42;
    transformed.y += (1.0 - abs(adim)) * bacak * 0.10;
    // gövde salınımı + mızrak sallanması
    float ust = smoothstep(0.9, 1.8, position.y);
    transformed.y += sin(t*10.8 + ph)*0.045*ust;
    transformed.x += sin(t*5.4 + ph)*0.05*ust;
    transformed.z += sin(t*5.4 + ph + 1.2)*0.03*smoothstep(2.0,4.0,position.y);`);
};
const ordu = new THREE.InstancedMesh(askerGeo(), askerMat, ASKER);
ordu.castShadow = true; ordu.receiveShadow = true;
const oR = new Float32Array(ASKER * 3); let k = 0;
const say = { suvari: 0, okcu: 0, mizrak: 0 };
function blok(cx, cz, sut, sat, ara, renk, tur, yon) {
  for (let i = 0; i < sut && k < ASKER; i++) for (let j = 0; j < sat && k < ASKER; j++) {
    const x = cx + (i - sut / 2) * ara + (Math.random() - .5) * .55;
    const z = cz + (j - sat / 2) * ara + (Math.random() - .5) * .55;
    Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yon + (Math.random() - .5) * .2);
    M.compose(V.set(x, H(x, z), z), Q, S.set(1, 1, 1));
    ordu.setMatrixAt(k, M);
    const t = .78 + Math.random() * .38;
    oR[k * 3] = renk[0] * t; oR[k * 3 + 1] = renk[1] * t; oR[k * 3 + 2] = renk[2] * t;
    k++; say[tur]++;
  }
}
// KARTAL-YURDU (mavi-çelik) — önde, kameraya yakın
blok(-34, -60, 30, 6, 2.3, [.34, .42, .62], 'mizrak', Math.PI);
blok(-34, -92, 26, 4, 2.5, [.40, .48, .68], 'okcu', Math.PI);
blok(-120, -78, 12, 5, 3.2, [.28, .36, .55], 'suvari', Math.PI);
blok(56, -78, 12, 5, 3.2, [.28, .36, .55], 'suvari', Math.PI);
// AZGUT (kızıl-kahve) — karşıda, uzakta
blok(-20, -300, 40, 9, 2.2, [.55, .25, .18], 'mizrak', 0);
blok(-20, -345, 32, 6, 2.4, [.62, .30, .20], 'okcu', 0);
blok(-160, -320, 16, 7, 3.0, [.48, .21, .16], 'suvari', 0);
blok(120, -320, 16, 7, 3.0, [.48, .21, .16], 'suvari', 0);
ordu.instanceColor = new THREE.InstancedBufferAttribute(oR, 3);
ordu.count = k; scene.add(ordu);

// ============ SANCAKLAR ============
const sancakMat = new THREE.MeshStandardMaterial({ color: 0xc9a35c, side: THREE.DoubleSide, roughness: .9 });
sancakMat.onBeforeCompile = s => {
  s.uniforms.t = { value: 0 }; sancakMat.userData.s = s;
  s.vertexShader = 'uniform float t;\n' + s.vertexShader.replace('#include <begin_vertex>', `
    #include <begin_vertex>
    float ph=float(gl_InstanceID)*2.3;
    transformed.z += sin(uv.x*6.0 - t*4.5 + ph)*0.28*uv.x;
    transformed.y += sin(uv.x*4.0 - t*3.2 + ph)*0.10*uv.x;`);
};
const bezG = new THREE.PlaneGeometry(2.6, 1.5, 8, 3); bezG.translate(1.3, 4.4, 0);
const direkG = new THREE.CylinderGeometry(.07, .07, 5.4, 5); direkG.translate(0, 2.7, 0);
const sancak = new THREE.InstancedMesh(bezG, sancakMat, 26);
const direk = new THREE.InstancedMesh(direkG, new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 1 }), 26);
sancak.castShadow = direk.castShadow = true;
const sR = new Float32Array(26 * 3);
let si = 0;
for (const [bx, bz, mavi] of [[-34, -55, 1], [-90, -70, 1], [20, -70, 1], [-120, -78, 1], [56, -78, 1],
                              [-20, -295, 0], [-80, -310, 0], [40, -310, 0], [-160, -320, 0], [120, -320, 0]]) {
  for (let n = 0; n < 2 && si < 26; n++) {
    const x = bx + (n - .5) * 22 + (Math.random() - .5) * 8, z = bz + (Math.random() - .5) * 8;
    Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * .5);
    M.compose(V.set(x, H(x, z), z), Q, S.set(1, 1, 1));
    sancak.setMatrixAt(si, M); direk.setMatrixAt(si, M);
    const c = mavi ? [.36, .48, .78] : [.72, .22, .16];
    sR[si * 3] = c[0]; sR[si * 3 + 1] = c[1]; sR[si * 3 + 2] = c[2];
    si++;
  }
}
sancak.count = direk.count = si;
sancak.instanceColor = new THREE.InstancedBufferAttribute(sR, 3);
scene.add(sancak); scene.add(direk);

// ============ KAMP ATEŞLERİ ============
const atesler = [];
for (let i = 0; i < 9; i++) {
  const x = -260 + Math.random() * 520, z = -30 + Math.random() * 80;
  const y = H(x, z);
  const l = new THREE.PointLight(0xff7a2a, 6.5, 78, 2.0);
  l.position.set(x, y + 1.6, z); scene.add(l); atesler.push(l);
  const kor = new THREE.Mesh(new THREE.SphereGeometry(.55, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffb055 }));
  kor.position.set(x, y + .55, z); scene.add(kor);
}

// ============ TOZ / KIVILCIM ============
function noktaDoku(renk) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, renk + '1)'); grd.addColorStop(.35, renk + '0.5)'); grd.addColorStop(1, renk + '0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}
const TOZ = 1400, tozG = new THREE.BufferGeometry();
const tp = new Float32Array(TOZ * 3), tv = new Float32Array(TOZ);
for (let i = 0; i < TOZ; i++) {
  const r = Math.random() * 620, a = Math.random() * Math.PI * 2;
  const x = Math.cos(a) * r, z = Math.sin(a) * r - 140;
  tp[i * 3] = x; tp[i * 3 + 1] = H(x, z) + Math.random() * 30 + 1; tp[i * 3 + 2] = z;
  tv[i] = .25 + Math.random() * 1.1;
}
tozG.setAttribute('position', new THREE.BufferAttribute(tp, 3));
const toz = new THREE.Points(tozG, new THREE.PointsMaterial({
  map: noktaDoku('rgba(226,205,160,'), size: 1.4, transparent: true, opacity: .22,
  depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
}));
scene.add(toz);


// ============ SUVARI (at + binici) ============
function atliGeo() {
  const p = [];
  const govde = new THREE.CylinderGeometry(.42,.38,2.3,6); govde.rotateZ(Math.PI/2); govde.translate(0,1.55,0);
  const boyun = new THREE.CylinderGeometry(.20,.28,1.0,5); boyun.rotateZ(-0.6); boyun.translate(1.05,2.05,0);
  const bas   = new THREE.BoxGeometry(.62,.30,.26); bas.translate(1.52,2.32,0);
  const b1 = new THREE.CylinderGeometry(.11,.09,1.5,4); b1.translate(.75,.75,.26);
  const b2 = new THREE.CylinderGeometry(.11,.09,1.5,4); b2.translate(.75,.75,-.26);
  const b3 = new THREE.CylinderGeometry(.11,.09,1.5,4); b3.translate(-.72,.75,.26);
  const b4 = new THREE.CylinderGeometry(.11,.09,1.5,4); b4.translate(-.72,.75,-.26);
  const kuyruk = new THREE.ConeGeometry(.16,.9,4); kuyruk.rotateZ(2.5); kuyruk.translate(-1.35,1.7,0);
  const rGov = new THREE.CylinderGeometry(.26,.34,1.05,6); rGov.translate(-.05,2.55,0);
  const rBas = new THREE.SphereGeometry(.22,7,6); rBas.translate(-.05,3.22,0);
  const rMig = new THREE.ConeGeometry(.25,.28,7); rMig.translate(-.05,3.42,0);
  const kilic = new THREE.BoxGeometry(1.9,.10,.05); kilic.rotateZ(.5); kilic.translate(.75,3.25,.30);
  p.push(govde,boyun,bas,b1,b2,b3,b4,kuyruk,rGov,rBas,rMig,kilic);
  return mergeGeometries(p,false);
}
const SUV = 320;
const suvMat = new THREE.MeshStandardMaterial({ roughness:.8, metalness:.3 });
suvMat.onBeforeCompile = function(s){
  s.uniforms.t = { value: 0 }; suvMat.userData.s = s;
  s.vertexShader = 'uniform float t;\n' + s.vertexShader.replace('#include <begin_vertex>', `
    #include <begin_vertex>
    float ph = float(gl_InstanceID)*2.1;
    // DÖRTNAL: ön/arka bacaklar zıt faz, x konumuna göre ayrılır
    float bacak = smoothstep(1.55, 0.10, position.y);
    float on = position.x > 0.0 ? 0.0 : 3.14159;
    float g = sin(t*9.0 + ph + on);
    transformed.x += g * bacak * 0.55;
    transformed.y += max(0.0, sin(t*9.0 + ph + on + 1.57)) * bacak * 0.30;
    // gövde+binici sıçraması
    float ust = smoothstep(1.2, 2.4, position.y);
    transformed.y += (0.5 + 0.5*sin(t*9.0 + ph))*0.22*ust;
    // yele/kuyruk savrulması
    transformed.z += sin(t*11.0 + ph)*0.07*smoothstep(2.0,3.6,position.y);`);
};
const suvari = new THREE.InstancedMesh(atliGeo(), suvMat, SUV);
suvari.castShadow = true; scene.add(suvari);
const suvData = [];
for (let i=0;i<SUV;i++){
  const sol = i < SUV/2;
  const taraf = i % 2 === 0 ? 1 : 0;
  const kolon = Math.floor((i%(SUV/2))/9), sira = (i%(SUV/2))%9;
  const bx = (sol?-1:1) * (145 + kolon*3.4) + (Math.random()-.5)*4;
  const bz = (taraf? -40 : -420) + sira*3.6 + (Math.random()-.5)*4;
  suvData.push({ x0:bx, z0:bz, yon: taraf?-1:1, hiz: 44+Math.random()*12,
                 gec: Math.random()*.7, faz: Math.random()*6.28, taraf });
}
const suvR = new Float32Array(SUV*3);
suvData.forEach(function(d,i){ const c = d.taraf?[.34,.44,.68]:[.60,.26,.18]; const q=.8+Math.random()*.35;
  suvR[i*3]=c[0]*q; suvR[i*3+1]=c[1]*q; suvR[i*3+2]=c[2]*q; });
suvari.instanceColor = new THREE.InstancedBufferAttribute(suvR,3);

// ============ OK YAGMURU ============
function okGeo(){
  const g=[]; const sap=new THREE.CylinderGeometry(.035,.035,1.5,4); sap.rotateZ(Math.PI/2);
  const uc=new THREE.ConeGeometry(.075,.30,4); uc.rotateZ(-Math.PI/2); uc.translate(.88,0,0);
  const tuy=new THREE.BoxGeometry(.26,.20,.02); tuy.translate(-.70,0,0);
  g.push(sap,uc,tuy); return mergeGeometries(g,false);
}
const OK = 1300;
const oklar = new THREE.InstancedMesh(okGeo(),
  new THREE.MeshStandardMaterial({ color:0xd8c79a, roughness:.85 }), OK);
scene.add(oklar);
const okData = [];
for (let i=0;i<OK;i++){
  const taraf = i < OK/2 ? 1 : 0;
  const bx = (Math.random()-.5)*200, bz = taraf? -100 : -345;
  const hx = bx + (Math.random()-.5)*150, hz = taraf? -325 : -75;
  okData.push({ bx:bx, bz:bz, hx:hx, hz:hz, by: H(bx,bz)+3.4, hy: H(hx,hz)+.4,
                t0: (taraf?0.2:1.7) + Math.random()*.9, sure: 2.5+Math.random()*.5, yuk: 48+Math.random()*26 });
}

// ============ SAVAS TOZU ============
const STOZ = 1500, stG = new THREE.BufferGeometry();
const stP = new Float32Array(STOZ*3), stD = [];
for(let i=0;i<STOZ;i++){ stP[i*3+1]=-9999; stD.push({ omur:0,x:0,y:0,z:0,vx:0,vy:0,vz:0 }); }
stG.setAttribute('position', new THREE.BufferAttribute(stP,3));
const savasToz = new THREE.Points(stG, new THREE.PointsMaterial({
  map: noktaDoku('rgba(216,193,152,'), size: 4.2, transparent:true, opacity:.19,
  depthWrite:false, sizeAttenuation:true }));
scene.add(savasToz);
let stIdx = 0;
function tozBirak(x,y,z,guc){
  for(let n=0;n<guc;n++){
    const d = stD[stIdx];
    d.x=x+(Math.random()-.5)*3; d.y=y+Math.random()*1.2; d.z=z+(Math.random()-.5)*3;
    d.vx=(Math.random()-.5)*.45; d.vy=.22+Math.random()*.55; d.vz=(Math.random()-.5)*.45;
    d.omur = 2.6+Math.random()*2.4;
    stIdx=(stIdx+1)%STOZ;
  }
}

// ============ KIVILCIM ============
const KIV=800, kvG=new THREE.BufferGeometry();
const kvP=new Float32Array(KIV*3), kvD=[];
for(let i=0;i<KIV;i++){ kvP[i*3+1]=-9999; kvD.push({omur:0,x:0,y:0,z:0,vx:0,vy:0,vz:0}); }
kvG.setAttribute('position',new THREE.BufferAttribute(kvP,3));
const kivilcim=new THREE.Points(kvG,new THREE.PointsMaterial({
  map:noktaDoku('rgba(255,214,140,'), size:2.6, transparent:true, opacity:.95,
  depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true}));
scene.add(kivilcim);
let kvIdx=0;
function kivilcimSac(x,y,z,n){
  for(let i=0;i<n;i++){ const d=kvD[kvIdx];
    d.x=x; d.y=y; d.z=z;
    d.vx=(Math.random()-.5)*16; d.vy=2+Math.random()*10; d.vz=(Math.random()-.5)*16;
    d.omur=.5+Math.random()*.7; kvIdx=(kvIdx+1)%KIV; }
}

// ============ POST ============
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .26, .42, .86));
composer.addPass(new ShaderPass({
  uniforms: { tDiffuse: { value: null }, vig: { value: .92 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float vig; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 p = (vUv-0.5)*vec2(1.12,1.0);
      c.rgb *= mix(1.0, smoothstep(0.98,0.30,length(p)), vig);   // vinyet
      // kontrast + hafif doygunluk (netlik hissi)
      c.rgb = (c.rgb - 0.5) * 1.14 + 0.5;
      float lum = dot(c.rgb, vec3(0.299,0.587,0.114));
      c.rgb = mix(vec3(lum), c.rgb, 1.16);
      c.rgb = pow(max(c.rgb, 0.0), vec3(0.98,1.00,1.04));
      gl_FragColor = c;
    }`
}));

// ============ HUD ============
u1.textContent = say.suvari; u2.textContent = say.okcu; u3.textContent = say.mizrak;

// ============ DONGU ============
const M2=new THREE.Matrix4(), Q2=new THREE.Quaternion(), V2=new THREE.Vector3(), UP=new THREE.Vector3(0,1,0);
const BIR=new THREE.Vector3(1,1,1), XEK=new THREE.Vector3(1,0,0);
const DONGU = 13.0;
const t0 = performance.now();
let zamanKaydir = 0;
window.__setTime = function(v){ zamanKaydir = v - (performance.now()-t0)/1000; };
let sarsinti = 0;
// --- serbest kamera (oyun kontrolü) ---
const kam = { serbest:false, hx:-10, hz:-160, yaw:0.15, pitch:0.42, mesafe:150 };
const tus = {};
addEventListener('keydown', function(e){
  const k = e.key.toLowerCase();
  tus[k] = true;
  if (k === ' ') { kam.serbest = !kam.serbest; e.preventDefault(); mod(); }
  if (k === 'r') { kam.hx=-10; kam.hz=-160; kam.yaw=0.15; kam.pitch=0.42; kam.mesafe=150; }
});
addEventListener('keyup', function(e){ tus[e.key.toLowerCase()] = false; });
const cv = document.getElementById('c');
let suru = false, sx = 0, sy = 0;
cv.addEventListener('pointerdown', function(e){ suru = true; sx = e.clientX; sy = e.clientY;
  kam.serbest = true; mod(); cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointerup', function(e){ suru = false; });
cv.addEventListener('pointermove', function(e){
  if (!suru) return;
  kam.yaw   -= (e.clientX - sx) * 0.005;
  kam.pitch  = Math.max(0.10, Math.min(1.35, kam.pitch + (e.clientY - sy) * 0.004));
  sx = e.clientX; sy = e.clientY;
});
cv.addEventListener('wheel', function(e){
  kam.serbest = true; mod();
  kam.mesafe = Math.max(22, Math.min(520, kam.mesafe * (1 + Math.sign(e.deltaY)*0.12)));
  e.preventDefault();
}, { passive:false });
function mod(){
  const el = document.getElementById('mod');
  if (el) el.textContent = kam.serbest ? 'SERBEST KAMERA' : 'SİNEMATİK';
}

function tik(){
  const gt = (performance.now()-t0)/1000 + zamanKaydir;
  const sv = ((gt % DONGU) + DONGU) % DONGU;
  gokMat.uniforms.t.value = gt;
  const mats = [cimMat, askerMat, sancakMat];
  for(let i=0;i<mats.length;i++) if(mats[i].userData.s) mats[i].userData.s.uniforms.t.value = gt;
  if(suvMat.userData.s) suvMat.userData.s.uniforms.t.value = gt;
  for(let i=0;i<atesler.length;i++) atesler[i].intensity = 5.2 + Math.sin(gt*7+i*2.1)*1.6;

  // SUVARI HUCUMU
  for(let i=0;i<SUV;i++){
    const d = suvData[i];
    const ilerle = Math.max(0, sv - 1.1 - d.gec);
    const mesafe = Math.min(ilerle * d.hiz, 310);
    const yanYon = (d.x0<0?1:-1) * .58;
    const x = d.x0 + yanYon * mesafe;
    const z = d.z0 + d.yon * mesafe;
    const y = H(x,z) + Math.abs(Math.sin(gt*8 + d.faz))*.42;
    // GERÇEK hareket yönüne bak: modelin burnu +X, yaw = atan2(dx, dz) - PI/2
    const aci = Math.atan2(yanYon, d.yon) - Math.PI*0.5;
    Q2.setFromAxisAngle(UP, aci);
    M2.compose(V2.set(x,y,z), Q2, BIR);
    suvari.setMatrixAt(i, M2);
    if(ilerle>0 && mesafe<310 && Math.random()<.10) tozBirak(x, H(x,z), z, 1);
  }
  suvari.instanceMatrix.needsUpdate = true;

  // OK YAGMURU
  for(let i=0;i<OK;i++){
    const o = okData[i];
    const u = (sv - o.t0)/o.sure;
    if(u<0 || u>1){ M2.makeTranslation(0,-9999,0); oklar.setMatrixAt(i,M2); continue; }
    const x = o.bx + (o.hx-o.bx)*u, z = o.bz + (o.hz-o.bz)*u;
    const y = o.by + (o.hy-o.by)*u + o.yuk * Math.sin(Math.PI*u);
    const u2 = Math.min(1, u+0.02);
    const nx = o.bx+(o.hx-o.bx)*u2, nz = o.bz+(o.hz-o.bz)*u2;
    const ny = o.by+(o.hy-o.by)*u2 + o.yuk*Math.sin(Math.PI*u2);
    V2.set(nx-x, ny-y, nz-z).normalize();
    Q2.setFromUnitVectors(XEK, V2);
    M2.compose(new THREE.Vector3(x,y,z), Q2, BIR);
    oklar.setMatrixAt(i,M2);
    if(u>0.985 && Math.random()<.04) tozBirak(x,H(x,z),z,1);
  }
  oklar.instanceMatrix.needsUpdate = true;

  // CARPISMA
  if(sv>5.2 && sv<6.2){
    for(let n=0;n<6;n++){
      const x=(Math.random()-.5)*240, z=-215+(Math.random()-.5)*80;
      kivilcimSac(x,H(x,z)+2.2,z,5); tozBirak(x,H(x,z),z,1);
    }
    sarsinti = 1.2;
  }
  sarsinti *= 0.94;

  const sp = savasToz.geometry.attributes.position;
  for(let i=0;i<STOZ;i++){ const d=stD[i];
    if(d.omur>0){ d.omur-=1/60; d.x+=d.vx; d.y+=d.vy; d.z+=d.vz; d.vy*=.985; d.vx*=.99; d.vz*=.99;
      sp.array[i*3]=d.x; sp.array[i*3+1]=d.y; sp.array[i*3+2]=d.z; }
    else sp.array[i*3+1]=-9999; }
  sp.needsUpdate = true;

  const kp = kivilcim.geometry.attributes.position;
  for(let i=0;i<KIV;i++){ const d=kvD[i];
    if(d.omur>0){ d.omur-=1/60; d.x+=d.vx*.06; d.y+=d.vy*.06; d.z+=d.vz*.06; d.vy-=.55;
      kp.array[i*3]=d.x; kp.array[i*3+1]=d.y; kp.array[i*3+2]=d.z; }
    else kp.array[i*3+1]=-9999; }
  kp.needsUpdate = true;

  const pa = toz.geometry.attributes.position;
  for(let i=0;i<TOZ;i++){ pa.array[i*3]+=tv[i]*.22; if(pa.array[i*3]>640) pa.array[i*3]-=1280; }
  pa.needsUpdate = true;

  // KAMERA
  if (kam.serbest) {
    const ileri = new THREE.Vector3(Math.sin(kam.yaw), 0, Math.cos(kam.yaw));
    const sag   = new THREE.Vector3(Math.cos(kam.yaw), 0, -Math.sin(kam.yaw));
    const hiz = (tus['shift'] ? 3.0 : 1.0) * kam.mesafe * 0.012;
    if (tus['w']) { kam.hx -= ileri.x*hiz; kam.hz -= ileri.z*hiz; }
    if (tus['s']) { kam.hx += ileri.x*hiz; kam.hz += ileri.z*hiz; }
    if (tus['a']) { kam.hx -= sag.x*hiz;   kam.hz -= sag.z*hiz; }
    if (tus['d']) { kam.hx += sag.x*hiz;   kam.hz += sag.z*hiz; }
    const hy = H(kam.hx, kam.hz) + 6;
    const cy2 = hy + Math.sin(kam.pitch)*kam.mesafe;
    const yatay = Math.cos(kam.pitch)*kam.mesafe;
    camera.position.set(
      kam.hx + Math.sin(kam.yaw)*yatay + (Math.random()-.5)*sarsinti*1.2,
      cy2 + (Math.random()-.5)*sarsinti*1.2,
      kam.hz + Math.cos(kam.yaw)*yatay);
    camera.lookAt(kam.hx, hy, kam.hz);
    if (camera.fov !== 48) { camera.fov = 48; camera.updateProjectionMatrix(); }
  } else {
    const yak = Math.max(0, Math.min(1, (sv-0.4)/5.6));
    const cx = -150 + yak*95 + Math.sin(gt*.15)*9;
    const cz = 40 - yak*175;
    const cy = H(cx,cz) + 34 - yak*20;
    camera.position.set(cx + (Math.random()-.5)*sarsinti*1.7, cy + (Math.random()-.5)*sarsinti*1.7, cz);
    camera.lookAt(-6 + yak*14, 9, -232);
    camera.fov = 46 - yak*10; camera.updateProjectionMatrix();
  }

  composer.render();
  window.__hazir = true;
  requestAnimationFrame(tik);
}
tik();
addEventListener('resize', function(){
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
});
