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
renderer.toneMappingExposure = 1.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x6a5a78, 0.00085);
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
    vec3 gece=vec3(0.10,0.11,0.26), orta=vec3(0.32,0.26,0.46), ufuk=vec3(0.86,0.56,0.44);
    vec3 col = mix(ufuk, orta, smoothstep(0.0,0.30,y));
    col = mix(col, gece, smoothstep(0.28,0.85,y));
    // şafak bandı
    col += vec3(1.05,0.58,0.30)*pow(max(0.,1.-abs(d.y)*7.),3.0)*0.95;
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
const ayIsik = new THREE.DirectionalLight(0xffd2a0, 3.6);
ayIsik.position.set(-300, 150, -900);
ayIsik.castShadow = true;
ayIsik.shadow.mapSize.set(2048, 2048);
const sc_ = ayIsik.shadow.camera;
sc_.left = -260; sc_.right = 260; sc_.top = 260; sc_.bottom = -260; sc_.far = 1600;
ayIsik.shadow.bias = -0.0009;
scene.add(ayIsik);
scene.add(new THREE.HemisphereLight(0x8ea0d8, 0x6a5436, 2.6));
const dolgu = new THREE.DirectionalLight(0x9fb0e8, 1.1); dolgu.position.set(420, 260, 380); scene.add(dolgu);

// ============ ARAZİ ============
const BOY = 3400, SEG = 300;
const tg = new THREE.PlaneGeometry(BOY, BOY, SEG, SEG); tg.rotateX(-Math.PI / 2);
const P = tg.attributes.position, RENK = new Float32Array(P.count * 3);
const C = {
  saman: new THREE.Color(0x9c8347), kuru: new THREE.Color(0x6e5c33),
  yesil: new THREE.Color(0x44502e), toprak: new THREE.Color(0x40301f),
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
const CIM = 46000;
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
  const g1 = new THREE.CylinderGeometry(.36, .5, 1.45, 6); g1.translate(0, 1.28, 0);          // gövde
  const g2 = new THREE.SphereGeometry(.27, 8, 6); g2.translate(0, 2.22, 0);                    // baş
  const g3 = new THREE.ConeGeometry(.30, .34, 7); g3.translate(0, 2.45, 0);                    // miğfer
  const g4 = new THREE.CylinderGeometry(.045, .045, 3.9, 4); g4.translate(.46, 2.0, 0);        // mızrak
  const g5 = new THREE.ConeGeometry(.09, .34, 4); g5.translate(.46, 4.05, 0);                  // uç
  const g6 = new THREE.CylinderGeometry(.34, .34, .09, 8); g6.rotateX(Math.PI / 2); g6.translate(-.40, 1.34, 0); // kalkan
  parts.push(g1, g2, g3, g4, g5, g6);
  return mergeGeometries(parts, false);
}
const ASKER = 4200;
const askerMat = new THREE.MeshStandardMaterial({ roughness: .78, metalness: .35 });
askerMat.onBeforeCompile = s => {
  s.uniforms.t = { value: 0 }; askerMat.userData.s = s;
  s.vertexShader = 'uniform float t;\n' + s.vertexShader.replace('#include <begin_vertex>', `
    #include <begin_vertex>
    float ph = float(gl_InstanceID)*1.7;
    transformed.y += sin(t*3.2 + ph)*0.055;
    transformed.x += sin(t*1.6 + ph)*0.02;`);
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
const TOZ = 3000, tozG = new THREE.BufferGeometry();
const tp = new Float32Array(TOZ * 3), tv = new Float32Array(TOZ);
for (let i = 0; i < TOZ; i++) {
  const r = Math.random() * 620, a = Math.random() * Math.PI * 2;
  const x = Math.cos(a) * r, z = Math.sin(a) * r - 140;
  tp[i * 3] = x; tp[i * 3 + 1] = H(x, z) + Math.random() * 30 + 1; tp[i * 3 + 2] = z;
  tv[i] = .25 + Math.random() * 1.1;
}
tozG.setAttribute('position', new THREE.BufferAttribute(tp, 3));
const toz = new THREE.Points(tozG, new THREE.PointsMaterial({
  map: noktaDoku('rgba(226,205,160,'), size: 2.6, transparent: true, opacity: .45,
  depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
}));
scene.add(toz);

// ============ POST ============
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .55, .8, .72));
composer.addPass(new ShaderPass({
  uniforms: { tDiffuse: { value: null }, vig: { value: .92 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float vig; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 p = (vUv-0.5)*vec2(1.12,1.0);
      c.rgb *= mix(1.0, smoothstep(0.86,0.16,length(p)), vig);   // vinyet
      c.rgb = pow(c.rgb, vec3(0.96,0.99,1.05));                   // hafif soğuk grade
      c.rgb += (fract(sin(dot(vUv,vec2(12.99,78.23)))*43758.5)-0.5)*0.012; // film grain
      gl_FragColor = c;
    }`
}));

// ============ HUD ============
u1.textContent = say.suvari; u2.textContent = say.okcu; u3.textContent = say.mizrak;

// ============ DÖNGÜ ============
const t0 = performance.now();
function tik() {
  const t = (performance.now() - t0) / 1000;
  gokMat.uniforms.t.value = t;
  for (const m of [cimMat, askerMat, sancakMat]) if (m.userData.s) m.userData.s.uniforms.t.value = t;
  atesler.forEach((l, i) => l.intensity = 5.2 + Math.sin(t * 7 + i * 2.1) * 1.6 + Math.sin(t * 17 + i) * .8);
  const pa = toz.geometry.attributes.position;
  for (let i = 0; i < TOZ; i++) {
    pa.array[i * 3] += tv[i] * .22;
    pa.array[i * 3 + 1] += Math.sin(t + i) * .012;
    if (pa.array[i * 3] > 640) pa.array[i * 3] -= 1280;
  }
  pa.needsUpdate = true;
  // sinematik kamera: alçak, cepheyi boydan boya tarar
  const a = -0.30 + Math.sin(t * .04) * .40;
  const R = 150;
  const cx = Math.sin(a) * R + 4, cz = Math.cos(a) * R + 95;
  camera.position.set(cx, H(cx, cz) + 46 + Math.sin(t * .27) * 2.0, cz);
  camera.lookAt(-8, 8, -260);
  composer.render();
  window.__hazir = true;
  requestAnimationFrame(tik);
}
tik();
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
