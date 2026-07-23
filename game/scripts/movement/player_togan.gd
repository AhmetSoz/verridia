class_name PlayerTogan
extends CharacterBody2D
## Togan — gri-kutu oyuncu kontrolcüsü.
## Plan §6 başlangıç değerleri: coyote ~100ms, zıplama tamponu ~115ms,
## girdi tamponu ~140ms, kaçınma 0.35s (dokunulmazlık ~0.16s), parry 120ms,
## büyük darbede 40–90ms hit-stop. Karakter komuta HEMEN tepki verir;
## ağırlık animasyondan gelir, girdi gecikmesinden değil.

signal saldirdi   # sinematik/talim: Togan saldırıya başladı

enum Durum { BOS, KOSU, ZIPLA, DUSUS, KACINMA, HAFIF_SALDIRI, AGIR_SALDIRI, PARRY, HASAR, SENDELEME, TUTUNMA, CEKME, OLU }

# --- Hareket ayarları (ilk prototipte ayarlanacak başlangıç noktaları) ---
@export_group("Hareket")
@export var kosu_hizi: float = 150.0
@export var ivme: float = 1400.0
@export var surtunme: float = 1600.0
@export var zipla_hizi: float = -330.0
@export var yercekimi: float = 980.0
@export var dusme_azami: float = 420.0
@export var coyote_suresi: float = 0.10
@export var zipla_tamponu: float = 0.115
@export var girdi_tamponu: float = 0.14

@export_group("Kaçınma")
@export var kacinma_suresi: float = 0.35             # takla (çift Shift)
@export var kacinma_hizi: float = 260.0
@export var hizli_kacinma_suresi: float = 0.20       # hızlı kaykılma (tek Shift)
@export var hizli_kacinma_hizi: float = 215.0
@export var kacinma_dokunulmazlik_bas: float = 0.04
@export var kacinma_dokunulmazlik_son: float = 0.18  # ~0.14s pencere
@export var cift_tik_penceresi: float = 0.28         # çift Shift = takla

@export_group("Parry")
@export var parry_penceresi: float = 0.12
@export var parry_toparlanma: float = 0.22
@export var parry_irade_kazanci: float = 25.0

@export_group("Saldırı")
@export var hafif_hasar: float = 10.0
@export var hafif_denge_hasari: float = 8.0
@export var agir_hasar: float = 24.0
@export var agir_denge_hasari: float = 22.0

@export_group("Zıplama")
@export var cift_zipla_hizi: float = -300.0  # havada ikinci zıplama

@export_group("Kenar Tutunma")
@export var kenar_tutunma_acik: bool = true   # tutunma karesi geldi → açık
@export var cekme_suresi: float = 0.28      # kendini yukarı çekme süresi
@export var el_yuksekligi: float = -26.0    # elin duvara değdiği yükseklik
@export var bas_yuksekligi: float = -46.0   # başın üstü (boş olmalı = kenar var)

@export_group("Parry")
@export var parry_bekleme_suresi: float = 0.45  # parry spam engeli

var durum: Durum = Durum.BOS
var yon: int = 1  # 1 sağ, -1 sol

var _coyote_sayac: float = 0.0
var _zipla_tampon_sayac: float = 0.0
var _girdi_tamponu_eylem: String = ""   # "hafif" | "agir" | "kacin"
var _girdi_tampon_sayac: float = 0.0
var _durum_sayac: float = 0.0
var _kombo_adim: int = 0                # 0..2 (üç vuruşluk hafif kombo)
var _parry_aktif: bool = false
var _dokunulmaz: bool = false
var _tutun_bekleme: float = 0.0         # bırakınca hemen tekrar tutunmayı engeller
var _cekme_bas: Vector2 = Vector2.ZERO
var _cekme_hedef: Vector2 = Vector2.ZERO
var _cift_zipla_kullanildi: bool = false
var _parry_bekleme: float = 0.0
var girdi_kilitli: bool = false        # sinematik/diyalog sırasında kontrol kapalı
var _son_kacin: float = -1.0           # çift-tık algısı için
var _kacinma_roll: bool = false        # true=takla, false=hızlı kaykılma
var _yikildi: bool = false             # talimde devrilme (sendeleme→dusme animasyonu)

@onready var stats: CombatStats = $CombatStats
@onready var hitbox: Hitbox = $Hitbox
@onready var hurtbox: Hurtbox = $Hurtbox
@onready var gorsel: AnimatedSprite2D = $Gorsel
var _el_ray: RayCast2D
var _bas_ray: RayCast2D

func _ready() -> void:
	add_to_group("oyuncu")
	hitbox.sahip = self
	hurtbox.vuruldu.connect(_vuruldu)
	stats.denge_kirildi.connect(func(): _duruma_gec(Durum.SENDELEME))
	stats.oldu.connect(_ol)
	# Kenar tutunma ışınları (dünya = katman 1)
	_el_ray = RayCast2D.new()
	_el_ray.position = Vector2(0, el_yuksekligi)
	_el_ray.collision_mask = 1
	add_child(_el_ray)
	_bas_ray = RayCast2D.new()
	_bas_ray.position = Vector2(0, bas_yuksekligi)
	_bas_ray.collision_mask = 1
	add_child(_bas_ray)

func _physics_process(delta: float) -> void:
	_sayaclar(delta)
	_yercekimi_uygula(delta)

	match durum:
		Durum.BOS, Durum.KOSU:
			_yer_hareketi(delta)
			_eylem_dinle()
		Durum.ZIPLA, Durum.DUSUS:
			_hava_hareketi(delta)
			_eylem_dinle()
		Durum.KACINMA:
			_kacinma_guncelle(delta)
		Durum.HAFIF_SALDIRI, Durum.AGIR_SALDIRI:
			_saldiri_guncelle(delta)
		Durum.PARRY:
			_parry_guncelle(delta)
		Durum.HASAR, Durum.SENDELEME:
			_toparlanma_guncelle(delta)
		Durum.TUTUNMA:
			_tutunma_guncelle(delta)
		Durum.CEKME:
			_cekme_guncelle(delta)
		Durum.OLU:
			velocity.x = move_toward(velocity.x, 0.0, surtunme * delta)

	move_and_slide()
	_durum_gorseli()
	_animasyon(delta)

# ---------- Sayaçlar / tamponlar ----------

func _sayaclar(delta: float) -> void:
	_durum_sayac += delta
	if is_on_floor():
		_coyote_sayac = coyote_suresi
		_cift_zipla_kullanildi = false   # yere değince çift zıplama tazelenir
	else:
		_coyote_sayac -= delta
	if _parry_bekleme > 0.0:
		_parry_bekleme -= delta
	if not girdi_kilitli and Input.is_action_just_pressed("zipla"):
		_zipla_tampon_sayac = zipla_tamponu
	else:
		_zipla_tampon_sayac -= delta
	# Saldırı/kaçınma girdi tamponu — meşgulken basılan eylem hatırlanır
	if girdi_kilitli:
		pass
	elif Input.is_action_just_pressed("saldiri_hafif"):
		_girdi_tamponla("hafif")
	elif Input.is_action_just_pressed("saldiri_agir"):
		_girdi_tamponla("agir")
	elif Input.is_action_just_pressed("kacin"):
		var simdi := Time.get_ticks_msec() / 1000.0
		if simdi - _son_kacin < cift_tik_penceresi:
			_girdi_tamponla("takla")    # çift Shift → takla (yuvarlanma)
		else:
			_girdi_tamponla("kaykil")   # tek Shift → hızlı kaykılma
		_son_kacin = simdi
	_girdi_tampon_sayac -= delta
	if _girdi_tampon_sayac <= 0.0:
		_girdi_tamponu_eylem = ""
	if _tutun_bekleme > 0.0:
		_tutun_bekleme -= delta

func _girdi_tamponla(eylem: String) -> void:
	_girdi_tamponu_eylem = eylem
	_girdi_tampon_sayac = girdi_tamponu

func _tamponu_tuket() -> String:
	var e := _girdi_tamponu_eylem
	_girdi_tamponu_eylem = ""
	return e

# ---------- Hareket ----------

func _yercekimi_uygula(delta: float) -> void:
	if durum == Durum.KACINMA or durum == Durum.TUTUNMA or durum == Durum.CEKME:
		return  # bu durumlarda yerçekimi yok
	if not is_on_floor():
		velocity.y = minf(velocity.y + yercekimi * delta, dusme_azami)

func _girdi_ekseni() -> float:
	if girdi_kilitli:
		return 0.0
	return Input.get_axis("hareket_sol", "hareket_sag")

func _yer_hareketi(delta: float) -> void:
	var eksen := _girdi_ekseni()
	if absf(eksen) > 0.01:
		velocity.x = move_toward(velocity.x, eksen * kosu_hizi, ivme * delta)
		yon = 1 if eksen > 0.0 else -1
		durum = Durum.KOSU
	else:
		velocity.x = move_toward(velocity.x, 0.0, surtunme * delta)
		durum = Durum.BOS
	if _zipla_tampon_sayac > 0.0 and _coyote_sayac > 0.0:
		_zipla()
	if not is_on_floor():
		_duruma_gec(Durum.DUSUS)

func _hava_hareketi(delta: float) -> void:
	var eksen := _girdi_ekseni()
	if absf(eksen) > 0.01:
		velocity.x = move_toward(velocity.x, eksen * kosu_hizi, ivme * 0.7 * delta)
		yon = 1 if eksen > 0.0 else -1
	# Coyote: yerden yeni düştüyse hâlâ zıplayabilir
	if _zipla_tampon_sayac > 0.0 and _coyote_sayac > 0.0:
		_zipla()
	# Çift zıplama: coyote bitti, havada bir kez daha
	elif _zipla_tampon_sayac > 0.0 and not _cift_zipla_kullanildi:
		_cift_zipla()
	# Değişken zıplama: erken bırakınca kısa zıplar
	if durum == Durum.ZIPLA and velocity.y < 0.0 and not Input.is_action_pressed("zipla"):
		velocity.y *= 0.55
	if velocity.y >= 0.0:
		durum = Durum.DUSUS
	# Kenara tutunma (animasyon gelince açılır): düşerken duvara bastırırken kenar yakala
	if kenar_tutunma_acik and durum == Durum.DUSUS and velocity.y > 0.0 and _tutun_bekleme <= 0.0 and _kenar_var():
		_tutun()
		return
	if is_on_floor():
		_duruma_gec(Durum.BOS)

func _zipla() -> void:
	velocity.y = zipla_hizi
	_zipla_tampon_sayac = 0.0
	_coyote_sayac = 0.0
	_duruma_gec(Durum.ZIPLA)

func _cift_zipla() -> void:
	velocity.y = cift_zipla_hizi
	_zipla_tampon_sayac = 0.0
	_cift_zipla_kullanildi = true
	Fx.toz(global_position + Vector2(0, -8), 0.7)   # havada patlama tozu
	_duruma_gec(Durum.ZIPLA)

# ---------- Kenar tutunma ----------

func _kenar_var() -> bool:
	# Duvara doğru bastırmıyorsa tutunma
	var eksen := _girdi_ekseni()
	if absf(eksen) < 0.3 or signf(eksen) != float(yon):
		return false
	_el_ray.target_position = Vector2(18.0 * yon, 0.0)
	_bas_ray.target_position = Vector2(18.0 * yon, 0.0)
	_el_ray.force_raycast_update()
	_bas_ray.force_raycast_update()
	# El hizasında duvar VAR, başın üstünde duvar YOK → tutulacak bir kenar var
	return _el_ray.is_colliding() and not _bas_ray.is_colliding()

func _tutun() -> void:
	# Kenar üstünü bul: duvar yüzünün hemen ilerisinden aşağı ışın
	var duvar_x: float = _el_ray.get_collision_point().x
	var uzay := get_world_2d().direct_space_state
	var bas_dunya: Vector2 = global_position + Vector2(13.0 * yon, bas_yuksekligi - 4.0)
	var sorgu := PhysicsRayQueryParameters2D.create(bas_dunya, bas_dunya + Vector2(0, 44), 1)
	sorgu.exclude = [self]
	var sonuc := uzay.intersect_ray(sorgu)
	var kenar_ust: float = sonuc.position.y if sonuc else global_position.y + bas_yuksekligi + 6.0
	# Asılı konum: eller kenarda, ayaklar sarkar
	global_position = Vector2(duvar_x - 8.0 * yon, kenar_ust + 44.0)
	velocity = Vector2.ZERO
	# Çıkış hedefi: ayaklar kenarın üstünde
	_cekme_hedef = Vector2(duvar_x + 13.0 * yon, kenar_ust)
	_duruma_gec(Durum.TUTUNMA)
	Fx.toz(global_position + Vector2(6.0 * yon, -34.0), 0.4)

func _tutunma_guncelle(_delta: float) -> void:
	velocity = Vector2.ZERO
	if Input.is_action_just_pressed("zipla"):        # Space/yukarı → kendini yukarı çek
		_cekme_basla()
	elif Input.is_action_just_pressed("egil"):       # S/aşağı → bırak, düş
		_tutun_bekleme = 0.4
		velocity.y = 80.0
		_duruma_gec(Durum.DUSUS)

func _cekme_basla() -> void:
	_cekme_bas = global_position
	_duruma_gec(Durum.CEKME)
	gorsel.play("tutunma")
	gorsel.set_frame_and_progress(1, 0.0)   # tırmanma kareleri

func _cekme_guncelle(_delta: float) -> void:
	var t: float = clampf(_durum_sayac / cekme_suresi, 0.0, 1.0)
	var egri: float = 1.0 - pow(1.0 - t, 2.0)
	global_position = _cekme_bas.lerp(_cekme_hedef, egri)
	if t >= 1.0:
		velocity = Vector2.ZERO
		_tutun_bekleme = 0.2
		Fx.toz(global_position, 0.6)
		_duruma_gec(Durum.BOS)

# ---------- Eylemler ----------

func _eylem_dinle() -> void:
	if girdi_kilitli:
		return
	var eylem := _tamponu_tuket()
	match eylem:
		"takla":
			if is_on_floor():        # yalnızca yerde
				_kacinma_basla(true)
		"kaykil":
			if is_on_floor():
				_kacinma_basla(false)
		"hafif":
			_saldiri_basla(false)
		"agir":
			_saldiri_basla(true)
		_:
			if Input.is_action_just_pressed("parry") and _parry_bekleme <= 0.0:
				_parry_basla()

func _kacinma_basla(roll: bool = true) -> void:
	_kacinma_roll = roll
	_duruma_gec(Durum.KACINMA)
	var eksen := _girdi_ekseni()
	var k_yon: float
	if absf(eksen) > 0.01:
		k_yon = signf(eksen)      # basılan yön: hem ileri hem geri
	elif roll:
		k_yon = float(yon)        # takla yönsüzse öne
	else:
		k_yon = float(-yon)       # hızlı kaykılma yönsüzse geri (kaçış)
	velocity.x = k_yon * (kacinma_hizi if roll else hizli_kacinma_hizi)
	velocity.y = 0.0
	Fx.toz(global_position, 0.8 if roll else 0.5)

func _kacinma_guncelle(delta: float) -> void:
	var sure: float = kacinma_suresi if _kacinma_roll else hizli_kacinma_suresi
	_dokunulmaz = _durum_sayac >= kacinma_dokunulmazlik_bas and _durum_sayac <= kacinma_dokunulmazlik_son
	if _durum_sayac >= sure:
		_dokunulmaz = false
		# Kaçınma sonrası eylem: tamponda varsa doğrudan bağlanır
		var e := _tamponu_tuket()
		if e == "hafif":
			_saldiri_basla(false)
		elif e == "agir":
			_saldiri_basla(true)
		elif e == "takla":
			_kacinma_basla(true)
		elif e == "kaykil":
			_kacinma_basla(false)
		else:
			_duruma_gec(Durum.BOS)

# Saldırı evreleri: hazırlık → aktif → toparlanma
var _saldiri_evre: int = 0
var _saldiri_agir_mi: bool = false
const HAFIF_EVRELER := [0.08, 0.10, 0.16]  # hazırlık, aktif, toparlanma (sn)
const AGIR_EVRELER := [0.22, 0.12, 0.30]

func _saldiri_basla(agir: bool) -> void:
	_saldiri_agir_mi = agir
	_saldiri_evre = 0
	if agir:
		_kombo_adim = 0
		hitbox.hasar = agir_hasar
		hitbox.denge_hasari = agir_denge_hasari
		_duruma_gec(Durum.AGIR_SALDIRI)
	else:
		hitbox.hasar = hafif_hasar * (1.0 + 0.15 * _kombo_adim)  # kombo sonu daha sert
		hitbox.denge_hasari = hafif_denge_hasari
		_duruma_gec(Durum.HAFIF_SALDIRI)
	hitbox.position.x = 26.0 * yon   # kılıç menzili (içine girmeden vurur)
	velocity.x = 0.0
	saldirdi.emit()
	if agir:
		gorsel.play("agir")
	else:
		gorsel.play("hafif2" if _kombo_adim % 2 == 1 else "hafif")   # kombo: sağa-sola savurma
	gorsel.set_frame_and_progress(0, 0.0)   # kombo için baştan

func _saldiri_guncelle(_delta: float) -> void:
	var evreler: Array = AGIR_EVRELER if _saldiri_agir_mi else HAFIF_EVRELER
	var t := _durum_sayac
	if _saldiri_evre == 0 and t >= evreler[0]:
		_saldiri_evre = 1
		hitbox.ac()
	elif _saldiri_evre == 1 and t >= evreler[0] + evreler[1]:
		_saldiri_evre = 2
		hitbox.kapat()
	elif _saldiri_evre == 2 and t >= evreler[0] + evreler[1] + evreler[2]:
		# Kombo devamı: tamponda hafif vuruş varsa 3'e kadar zincir
		var e := _tamponu_tuket()
		if not _saldiri_agir_mi and e == "hafif" and _kombo_adim < 2:
			_kombo_adim += 1
			_saldiri_basla(false)
		elif e == "agir":
			_saldiri_basla(true)
		elif e == "kaykil" or e == "takla":
			_kombo_adim = 0
			_kacinma_basla(e == "takla")
		else:
			_kombo_adim = 0
			_duruma_gec(Durum.BOS)

func _parry_basla() -> void:
	_parry_aktif = true
	_duruma_gec(Durum.PARRY)
	velocity.x = 0.0

func _parry_guncelle(_delta: float) -> void:
	_parry_aktif = _durum_sayac <= parry_penceresi
	if _durum_sayac >= parry_penceresi + parry_toparlanma:
		_parry_aktif = false
		_parry_bekleme = parry_bekleme_suresi   # tekrar parry için bekleme (spam engeli)
		_duruma_gec(Durum.BOS)

func _toparlanma_guncelle(_delta: float) -> void:
	velocity.x = move_toward(velocity.x, 0.0, surtunme * 0.5 * get_physics_process_delta_time())
	if _yerde_kal:
		return   # kalk() çağrılana kadar yerde kalır (talim devrilmesi)
	var sure := 0.30 if durum == Durum.HASAR else 0.90  # sendeleme daha uzun
	if _durum_sayac >= sure:
		_duruma_gec(Durum.BOS)

# ---------- Hasar alma ----------

func _vuruldu(hb: Hitbox) -> void:
	if _dokunulmaz or durum == Durum.OLU:
		return
	if _parry_aktif:
		# BAŞARILI PARRY: hasar yok, İrade dolar, hit-stop, saldıran sendeler
		stats.irade_kazan(parry_irade_kazanci)
		Fx.parry(global_position + Vector2(12 * yon, -24))
		_hit_stop(0.07)
		if hb.sahip and hb.sahip.has_method("parrylendi"):
			hb.sahip.parrylendi()
		return
	stats.hasar_al(hb.hasar)
	stats.denge_hasari(hb.denge_hasari)
	var kaynak_x: float = hb.global_position.x if hb.sahip == null else hb.sahip.global_position.x
	velocity.x = signf(global_position.x - kaynak_x) * hb.geri_itme
	Fx.carp(global_position + Vector2(0, -24), signf(global_position.x - kaynak_x))
	Fx.sars(4.0, 0.2)
	if durum != Durum.SENDELEME:
		_duruma_gec(Durum.HASAR)

func _ol() -> void:
	_duruma_gec(Durum.OLU)
	hitbox.kapat()
	# Ölüm: son kontrol noktasına dönüş (plan §10) — kısa gecikmeyle
	get_tree().create_timer(1.2).timeout.connect(SceneFlow.son_kontrol_noktasina_don)

func _hit_stop(sure: float) -> void:
	## Büyük darbe hissi: 40–90ms zaman durması (plan §6)
	Engine.time_scale = 0.05
	await get_tree().create_timer(sure, true, false, true).timeout
	Engine.time_scale = 1.0

# ---------- Durum yardımcıları ----------

## Sinematik: Togan yere düşürülür (talimde Kaya devirince)
var _yerde_kal: bool = false   # sinematik: kalk() denene kadar yerde kalır

func sendele(kal: bool = false) -> void:
	_yikildi = true
	_yerde_kal = kal
	_duruma_gec(Durum.SENDELEME)
	velocity.x = -yon * 150.0
	velocity.y = -120.0

func kalk() -> void:
	_yerde_kal = false
	if durum == Durum.SENDELEME:
		_duruma_gec(Durum.BOS)

func _duruma_gec(yeni: Durum) -> void:
	durum = yeni
	_durum_sayac = 0.0
	if yeni != Durum.KACINMA:
		_dokunulmaz = false
	if yeni != Durum.PARRY:
		_parry_aktif = false
	if yeni != Durum.SENDELEME:
		_yikildi = false

func _durum_gorseli() -> void:
	## Animasyon seçimi + durum tonlaması (modulate).
	var ton := Color.WHITE
	var anim := "idle"
	match durum:
		Durum.KOSU:
			anim = "kosu"
		Durum.ZIPLA:
			anim = "zipla"
		Durum.DUSUS:
			anim = "dusus"
		Durum.HAFIF_SALDIRI:
			anim = "hafif"                          # başlatma _saldiri_basla'da
		Durum.AGIR_SALDIRI:
			anim = "agir"
		Durum.KACINMA:
			anim = "takla" if _kacinma_roll else "kaykilma"
			ton = Color(1, 1, 1, 0.6)               # dokunulmazlıkta hafif soluk
		Durum.PARRY:
			anim = "parry"
			ton = Color(1.6, 1.5, 1.0) if _parry_aktif else Color.WHITE
		Durum.HASAR:
			anim = "hasar"
			ton = Color(1.5, 0.55, 0.55)            # kırmızı flaş
		Durum.SENDELEME:
			anim = "dusme"                          # devrilme/denge kırılması — yerde
			ton = Color.WHITE if _yikildi else Color(0.9, 0.9, 1.3)
		Durum.TUTUNMA:
			anim = "tutunma"
		Durum.CEKME:
			anim = "tutunma"
		Durum.OLU:
			anim = "olum"
			ton = Color(0.75, 0.72, 0.72)
	gorsel.modulate = ton
	gorsel.flip_h = yon < 0
	if durum == Durum.TUTUNMA:
		# asılı: hang karesini tut (tırmanma CEKME'de oynar)
		if gorsel.animation != "tutunma":
			gorsel.play("tutunma")
		gorsel.pause()
		gorsel.frame = 0
	elif durum == Durum.CEKME or durum == Durum.HAFIF_SALDIRI or durum == Durum.AGIR_SALDIRI:
		pass                       # _cekme_basla / _saldiri_basla oynatıyor (kombo hafif/hafif2)
	elif gorsel.animation != anim:
		gorsel.play(anim)

# ---------- Ek juice (gerçek kareler üstüne: iniş ezilmesi + kaçınma yatışı) ----------
var _squash: Vector2 = Vector2.ONE
var _onceki_yerde: bool = true

func _animasyon(delta: float) -> void:
	var yerde := is_on_floor()
	# İniş ezilmesi (karelerin üstüne küçük dokunuş) + toz + hafif sarsıntı
	if yerde and not _onceki_yerde:
		_squash = Vector2(1.28, 0.72)
		Fx.toz(global_position, 1.0)
		Fx.sars(2.0, 0.1)
	_onceki_yerde = yerde
	_squash = _squash.lerp(Vector2.ONE, 1.0 - exp(-20.0 * delta))
	gorsel.scale = _squash
	gorsel.rotation = 0.0  # döndürme artık takla karelerinde
