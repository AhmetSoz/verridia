// VERRIDIA — eklemli prosedürel insan. Kutu değil: konik uzuvlar, kaftan eteği,
// kürk yaka, kavisli pala + kılıç izi. Hiçbir model dosyası yok.
import * as THREE from 'three';

// ── kenar ışığı (fresnel) enjeksiyonu: siluet ayrışsın
export function kenarIsigi(mat, renk = new THREE.Color(0x9fb4ff), guc = 0.55) {
  mat.onBeforeCompile = (s) => {
    s.uniforms.kRenk = { value: renk };
    s.uniforms.kGuc = { value: guc };
    s.fragmentShader = 'uniform vec3 kRenk; uniform float kGuc;\n' + s.fragmentShader
      .replace('#include <dithering_fragment>', `
        #include <dithering_fragment>
        vec3 gz = normalize(vViewPosition);
        float fres = pow(1.0 - clamp(dot(normal, gz), 0.0, 1.0), 3.0);
        gl_FragColor.rgb += kRenk * fres * kGuc;`);
  };
  return mat;
}

const M = (renk, ruz = .85, met = .05) =>
  kenarIsigi(new THREE.MeshStandardMaterial({ color: renk, roughness: ruz, metalness: met }));

// konik uzuv (üst geniş, alt dar) — yuvarlak kesitli
function uzuv(r0, r1, h, renk, seg = 7) {
  const g = new THREE.CylinderGeometry(r0, r1, h, seg);
  g.translate(0, -h / 2, 0);
  const m = new THREE.Mesh(g, M(renk));
  return m;
}
function kure(r, renk, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), M(renk));
  m.scale.set(sx, sy, sz); return m;
}

// kavisli pala — 2B profil + extrude
function palaGeo() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(.075, .30, .085, .62, .050, .93);   // sırt
  s.lineTo(.020, 1.00);
  s.bezierCurveTo(.005, .70, -.010, .38, -.028, 0);   // keskin yüz
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: .022, bevelEnabled: true,
    bevelThickness: .006, bevelSize: .006, bevelSegments: 1, curveSegments: 6 });
  g.translate(0, 0, -.011);
  return g;
}

// ── kılıç izi (uçtan tabana şerit, zamanla söner)
export class KilicIzi {
  constructor(scene, uzunluk = 14, renk = 0xdfe6ff) {
    this.n = uzunluk;
    this.uc = []; this.dip = [];
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.n * 2 * 3);
    this.alfa = new Float32Array(this.n * 2);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aAlfa', new THREE.BufferAttribute(this.alfa, 1));
    const idx = [];
    for (let i = 0; i < this.n - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, b, c, b, d, c);
    }
    g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { renk: { value: new THREE.Color(renk) } },
      vertexShader: `attribute float aAlfa; varying float vA;
        void main(){ vA=aAlfa; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 renk; varying float vA;
        void main(){ if(vA<=0.001) discard; gl_FragColor=vec4(renk, vA*0.85); }`
    }));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.aktif = false;
  }
  ekle(ucV, dipV) {
    this.uc.unshift(ucV.clone()); this.dip.unshift(dipV.clone());
    if (this.uc.length > this.n) { this.uc.pop(); this.dip.pop(); }
    this.yaz();
  }
  temizle() { this.uc.length = 0; this.dip.length = 0; this.yaz(); }
  yaz() {
    for (let i = 0; i < this.n; i++) {
      const u = this.uc[i] || this.uc[this.uc.length - 1];
      const d = this.dip[i] || this.dip[this.dip.length - 1];
      const a = u ? Math.pow(1 - i / this.n, 1.7) : 0;
      const o = i * 6;
      if (u) { this.pos[o] = u.x; this.pos[o+1] = u.y; this.pos[o+2] = u.z;
               this.pos[o+3] = d.x; this.pos[o+4] = d.y; this.pos[o+5] = d.z; }
      this.alfa[i*2] = a; this.alfa[i*2+1] = a * .55;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.aAlfa.needsUpdate = true;
  }
}

export class Insan {
  constructor(R, scene) {
    this.R = R;
    this.kok = new THREE.Group();

    this.pelvis = new THREE.Group(); this.pelvis.position.y = .95; this.kok.add(this.pelvis);
    const kalca = kure(.19, R.kemer, 1.15, .70, .90); kalca.position.y = -.02; this.pelvis.add(kalca);

    // ── gövde
    this.govde = new THREE.Group(); this.pelvis.add(this.govde);
    const gogus = uzuv(.235, .195, .58, R.kaftan, 9); gogus.position.y = .58; this.govde.add(gogus);
    gogus.scale.z = .78;
    const omuz = kure(.245, R.kaftan, 1.28, .55, .82); omuz.position.y = .55; this.govde.add(omuz);
    // kürk yaka
    const yaka = new THREE.Mesh(new THREE.TorusGeometry(.175, .075, 6, 12), M(R.kurk, 1));
    yaka.rotation.x = Math.PI/2; yaka.position.y = .60; yaka.scale.z = .85; this.govde.add(yaka);
    // kemer
    const kemer = new THREE.Mesh(new THREE.TorusGeometry(.205, .034, 5, 12), M(R.kemer, .7, .25));
    kemer.rotation.x = Math.PI/2; kemer.position.y = .06; kemer.scale.z = .80; this.govde.add(kemer);
    // kaftan eteği (sallanır)
    this.etek = new THREE.Mesh(new THREE.CylinderGeometry(.215, .30, .52, 12, 3, true), M(R.kaftan));
    this.etek.material.side = THREE.DoubleSide;
    this.etek.position.y = -.20; this.etek.scale.z = .84; this.govde.add(this.etek);

    // ── baş
    this.bas = new THREE.Group(); this.bas.position.y = .72; this.govde.add(this.bas);
    const kafa = kure(.135, R.ten, 1, 1.12, 1.02); kafa.position.y = .10; this.bas.add(kafa);
    const boyun = uzuv(.062, .07, .10, R.ten); boyun.position.y = .02; this.bas.add(boyun);
    const sac = kure(.145, R.sac, 1.02, .82, 1.06); sac.position.y = .155; this.bas.add(sac);
    const perc = kure(.10, R.sac, .9, .55, .8); perc.position.set(0, .11, -.09); this.bas.add(perc);

    // ── kollar
    const kolYap = (yon) => {
      const ust = new THREE.Group(); ust.position.set(.245*yon, .53, 0); this.govde.add(ust);
      ust.add(uzuv(.085, .068, .30, R.kaftan));
      const alt = new THREE.Group(); alt.position.y = -.30; ust.add(alt);
      alt.add(uzuv(.066, .052, .28, R.ten));
      const el = kure(.055, R.ten, 1, .9, 1.1); el.position.y = -.29; alt.add(el);
      return { ust, alt, el };
    };
    this.kolL = kolYap(1); this.kolR = kolYap(-1);

    // ── bacaklar
    const bacakYap = (yon) => {
      const ust = new THREE.Group(); ust.position.set(.115*yon, -.06, 0); this.pelvis.add(ust);
      ust.add(uzuv(.115, .092, .44, R.pantolon));
      const alt = new THREE.Group(); alt.position.y = -.44; ust.add(alt);
      alt.add(uzuv(.090, .072, .42, R.cizme));
      const ayak = new THREE.Mesh(new THREE.BoxGeometry(.115, .085, .235), M(R.cizme, .95));
      ayak.position.set(0, -.44, .045); alt.add(ayak);
      return { ust, alt };
    };
    this.bacakL = bacakYap(1); this.bacakR = bacakYap(-1);

    // ── pala (sağ el)
    this.kilic = new THREE.Group();
    this.kolR.alt.add(this.kilic); this.kilic.position.y = -.30;
    const bicak = new THREE.Mesh(palaGeo(), M(R.celik, .28, .92));
    bicak.scale.set(1, .92, 1); this.kilic.add(bicak);
    const balcak = new THREE.Mesh(new THREE.BoxGeometry(.175, .035, .05), M(R.altin, .45, .75));
    this.kilic.add(balcak);
    const sap = uzuv(.028, .024, .17, 0x3a2a18); sap.position.y = .0; this.kilic.add(sap);
    const topuz = kure(.034, R.altin, 1, .9, 1); topuz.position.y = -.18; this.kilic.add(topuz);
    this.kilicUcu = new THREE.Object3D(); this.kilicUcu.position.y = .94; this.kilic.add(this.kilicUcu);
    this.kilicDibi = new THREE.Object3D(); this.kilicDibi.position.y = .10; this.kilic.add(this.kilicDibi);
    this.kilic.rotation.x = -.15;

    this.kok.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.faz = Math.random() * 6.28;
    this.saldiriT = -1; this.vurusVerildi = false;
    this.iz = scene ? new KilicIzi(scene) : null;
    this._v1 = new THREE.Vector3(); this._v2 = new THREE.Vector3();
  }

  saldir(t) { if (this.saldiriT < 0) { this.saldiriT = t; this.vurusVerildi = false;
    if (this.iz) this.iz.temizle(); return true; } return false; }

  // dönüş: bu karede vuruş anı geldiyse true
  guncelle(t, hiz, dt) {
    const K = this.kolL, L = this.kolR, B = this.bacakL, C = this.bacakR;
    let vurusAni = false;

    if (this.saldiriT >= 0) {
      const u = (t - this.saldiriT) / .62;
      if (u >= 1) { this.saldiriT = -1; if (this.iz) this.iz.temizle(); }
      else {
        // 0-.30 yüklenme, .30-.55 kesme, .55-1 toparlanma
        let e, govdeY, adim;
        if (u < .30) { const k = u/.30, s = k*k;
          e = -0.35 - s*1.75; govdeY = 0.55*s; adim = -0.10*s; }
        else if (u < .58) { const k = (u-.30)/.28, s = 1-Math.pow(1-k,3);
          e = -2.10 + s*3.05; govdeY = 0.55 - s*1.10; adim = -0.10 + s*0.42; }
        else { const k = (u-.58)/.42, s = k*k*(3-2*k);
          e = 0.95 - s*1.30; govdeY = -0.55 + s*0.55; adim = 0.32 - s*0.32; }
        L.ust.rotation.set(e, 0, -.30 - govdeY*.25);
        L.alt.rotation.x = -.55 + Math.max(0, e)*.55;
        K.ust.rotation.set(-e*.35, 0, .42);
        K.alt.rotation.x = -.75;
        this.govde.rotation.y = govdeY;
        this.govde.rotation.x = .10 + adim*.25;
        this.pelvis.rotation.y = govdeY*.35;
        B.ust.rotation.x = -.22 + adim*.5; C.ust.rotation.x = .18 - adim*.3;
        B.alt.rotation.x = .10; C.alt.rotation.x = .22;
        this.kilic.rotation.x = -.15 - Math.max(0,-e)*.35;
        this.pelvis.position.y = .95 - Math.abs(govdeY)*.05;
        // kesme evresinde iz bırak
        if (u > .26 && u < .70 && this.iz) {
          this.kilicUcu.getWorldPosition(this._v1);
          this.kilicDibi.getWorldPosition(this._v2);
          this.iz.ekle(this._v1, this._v2);
        }
        if (!this.vurusVerildi && u > .42) { this.vurusVerildi = true; vurusAni = true; }
        return vurusAni;
      }
    }

    const y = Math.min(1, hiz / 6.6);
    if (y > .02) {
      const f = t * (5.2 + y*4.2) + this.faz, g = .78*y;
      B.ust.rotation.set(Math.sin(f)*g, 0, 0);
      C.ust.rotation.set(Math.sin(f+Math.PI)*g, 0, 0);
      B.alt.rotation.x = Math.max(0, -Math.sin(f-.65))*1.05*y;
      C.alt.rotation.x = Math.max(0, -Math.sin(f+Math.PI-.65))*1.05*y;
      K.ust.rotation.set(Math.sin(f+Math.PI)*.60*y, 0, .16);
      L.ust.rotation.set(Math.sin(f)*.42*y, 0, -.16);
      K.alt.rotation.x = -.30 - .18*y; L.alt.rotation.x = -.36 - .12*y;
      this.pelvis.position.y = .95 + Math.abs(Math.sin(f))*.06*y;
      this.pelvis.rotation.y = Math.sin(f)*.10*y;
      this.govde.rotation.set(.09*y + .06, -Math.sin(f)*.13*y, 0);
      this.bas.rotation.set(-.05*y, -Math.sin(f)*.06*y, 0);
      this.kilic.rotation.x = -.15 - .12*y;
      this.etek.rotation.x = -Math.sin(f)*.06*y;
    } else {
      const f = t*1.35 + this.faz;
      B.ust.rotation.set(0,0,0); C.ust.rotation.set(0,0,0);
      B.alt.rotation.x = C.alt.rotation.x = 0;
      K.ust.rotation.set(-.05 + Math.sin(f)*.03, 0, .17);
      L.ust.rotation.set(-.05 - Math.sin(f)*.03, 0, -.17);
      K.alt.rotation.x = -.28; L.alt.rotation.x = -.34;
      this.pelvis.position.y = .95 + Math.sin(f)*.016;
      this.pelvis.rotation.y = 0;
      this.govde.rotation.set(.03 + Math.sin(f)*.012, 0, 0);
      this.bas.rotation.set(Math.sin(f*.7)*.04, Math.sin(t*.35+this.faz)*.22, 0);
      this.kilic.rotation.x = -.15;
      this.etek.rotation.x = 0;
    }
    return false;
  }
}
