class_name PlayerTogan
extends CharacterBody2D
## Togan — gri-kutu oyuncu kontrolcüsü.
## Plan §6 başlangıç değerleri: coyote ~100ms, zıplama tamponu ~115ms,
## girdi tamponu ~140ms, kaçınma 0.35s (dokunulmazlık ~0.16s), parry 120ms,
## büyük darbede 40–90ms hit-stop. Karakter komuta HEMEN tepki verir;
## ağırlık animasyondan gelir, girdi gecikmesinden değil.

enum Durum { BOS, KOSU, ZIPLA, DUSUS, KACINMA, HAFIF_SALDIRI, AGIR_SALDIRI, PARRY, HASAR, SENDELEME, OLU }

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
@export var kacinma_suresi: float = 0.35
@export var kacinma_hizi: float = 260.0
@export var kacinma_dokunulmazlik_bas: float = 0.04
@export var kacinma_dokunulmazlik_son: float = 0.20  # ~0.16s pencere

@export_group("Parry")
@export var parry_penceresi: float = 0.12
@export var parry_toparlanma: float = 0.22
@export var parry_irade_kazanci: float = 25.0

@export_group("Saldırı")
@export var hafif_hasar: float = 10.0
@export var hafif_denge_hasari: float = 8.0
@export var agir_hasar: float = 24.0
@export var agir_denge_hasari: float = 22.0

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

@onready var stats: CombatStats = $CombatStats
@onready var hitbox: Hitbox = $Hitbox
@onready var hurtbox: Hurtbox = $Hurtbox
@onready var gorsel: Sprite2D = $Gorsel

func _ready() -> void:
	add_to_group("oyuncu")
	hitbox.sahip = self
	hurtbox.vuruldu.connect(_vuruldu)
	stats.denge_kirildi.connect(func(): _duruma_gec(Durum.SENDELEME))
	stats.oldu.connect(_ol)

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
		Durum.OLU:
			velocity.x = move_toward(velocity.x, 0.0, surtunme * delta)

	move_and_slide()
	_durum_gorseli()

# ---------- Sayaçlar / tamponlar ----------

func _sayaclar(delta: float) -> void:
	_durum_sayac += delta
	if is_on_floor():
		_coyote_sayac = coyote_suresi
	else:
		_coyote_sayac -= delta
	if Input.is_action_just_pressed("zipla"):
		_zipla_tampon_sayac = zipla_tamponu
	else:
		_zipla_tampon_sayac -= delta
	# Saldırı/kaçınma girdi tamponu — meşgulken basılan eylem hatırlanır
	if Input.is_action_just_pressed("saldiri_hafif"):
		_girdi_tamponla("hafif")
	elif Input.is_action_just_pressed("saldiri_agir"):
		_girdi_tamponla("agir")
	elif Input.is_action_just_pressed("kacin"):
		_girdi_tamponla("kacin")
	_girdi_tampon_sayac -= delta
	if _girdi_tampon_sayac <= 0.0:
		_girdi_tamponu_eylem = ""

func _girdi_tamponla(eylem: String) -> void:
	_girdi_tamponu_eylem = eylem
	_girdi_tampon_sayac = girdi_tamponu

func _tamponu_tuket() -> String:
	var e := _girdi_tamponu_eylem
	_girdi_tamponu_eylem = ""
	return e

# ---------- Hareket ----------

func _yercekimi_uygula(delta: float) -> void:
	if not is_on_floor() and durum != Durum.KACINMA:
		velocity.y = minf(velocity.y + yercekimi * delta, dusme_azami)

func _girdi_ekseni() -> float:
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
	# Değişken zıplama: erken bırakınca kısa zıplar
	if durum == Durum.ZIPLA and velocity.y < 0.0 and not Input.is_action_pressed("zipla"):
		velocity.y *= 0.55
	if velocity.y >= 0.0:
		durum = Durum.DUSUS
	if is_on_floor():
		_duruma_gec(Durum.BOS)

func _zipla() -> void:
	velocity.y = zipla_hizi
	_zipla_tampon_sayac = 0.0
	_coyote_sayac = 0.0
	_duruma_gec(Durum.ZIPLA)

# ---------- Eylemler ----------

func _eylem_dinle() -> void:
	var eylem := _tamponu_tuket()
	match eylem:
		"kacin":
			_kacinma_basla()
		"hafif":
			_saldiri_basla(false)
		"agir":
			_saldiri_basla(true)
		_:
			if Input.is_action_just_pressed("parry"):
				_parry_basla()

func _kacinma_basla() -> void:
	_duruma_gec(Durum.KACINMA)
	var eksen := _girdi_ekseni()
	var k_yon: float = eksen if absf(eksen) > 0.01 else float(yon)
	velocity.x = signf(k_yon) * kacinma_hizi
	velocity.y = 0.0

func _kacinma_guncelle(delta: float) -> void:
	_dokunulmaz = _durum_sayac >= kacinma_dokunulmazlik_bas and _durum_sayac <= kacinma_dokunulmazlik_son
	if _durum_sayac >= kacinma_suresi:
		_dokunulmaz = false
		# Kaçınma sonrası saldırı: tamponda vuruş varsa doğrudan bağlanır
		var e := _tamponu_tuket()
		if e == "hafif":
			_saldiri_basla(false)
		elif e == "agir":
			_saldiri_basla(true)
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
	hitbox.position.x = 18.0 * yon
	velocity.x = 0.0

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
		elif e == "kacin":
			_kombo_adim = 0
			_kacinma_basla()
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
		_duruma_gec(Durum.BOS)

func _toparlanma_guncelle(_delta: float) -> void:
	velocity.x = move_toward(velocity.x, 0.0, surtunme * 0.5 * get_physics_process_delta_time())
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
		_hit_stop(0.07)
		if hb.sahip and hb.sahip.has_method("parrylendi"):
			hb.sahip.parrylendi()
		return
	stats.hasar_al(hb.hasar)
	stats.denge_hasari(hb.denge_hasari)
	var kaynak_x: float = hb.global_position.x if hb.sahip == null else hb.sahip.global_position.x
	velocity.x = signf(global_position.x - kaynak_x) * hb.geri_itme
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

func _duruma_gec(yeni: Durum) -> void:
	durum = yeni
	_durum_sayac = 0.0
	if yeni != Durum.KACINMA:
		_dokunulmaz = false
	if yeni != Durum.PARRY:
		_parry_aktif = false

func _durum_gorseli() -> void:
	## Sprite tonlaması: duruma göre modulate (animasyon gelene kadar geri bildirim).
	## modulate >1 aşırı parlama; alpha < 1 soluklaşma sağlar.
	var ton := Color.WHITE                         # normal: dokunma
	match durum:
		Durum.KACINMA:
			ton = Color(1, 1, 1, 0.45)             # dokunulmazlıkta soluk
		Durum.HAFIF_SALDIRI:
			ton = Color(1.15, 1.12, 0.95)          # hafif parlama
		Durum.AGIR_SALDIRI:
			ton = Color(1.3, 1.05, 0.85)           # ağır: sıcak parlama
		Durum.PARRY:
			ton = Color(1.6, 1.5, 1.0) if _parry_aktif else Color(0.8, 0.8, 0.75)
		Durum.HASAR, Durum.SENDELEME:
			ton = Color(1.5, 0.55, 0.55)           # kırmızı flaş
		Durum.OLU:
			ton = Color(0.45, 0.45, 0.5)
	gorsel.modulate = ton
	gorsel.flip_h = yon < 0                         # sprite sağa bakıyor; sola dönünce çevir
