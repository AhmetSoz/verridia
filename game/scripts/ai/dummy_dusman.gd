class_name DummyDusman
extends CharacterBody2D
## Talim düşmanı (gri-kutu): devriye + telegraflı saldırı + Denge kırılınca sendeleme.
## Parry pratiği için saldırıdan önce net renk telegrafı verir.

enum Durum { DEVRIYE, TAKIP, HAZIRLIK, SALDIRI, TOPARLANMA, SENDELEME, OLU }

@export var devriye_hizi: float = 40.0
@export var takip_hizi: float = 70.0
@export var gorus_menzili: float = 140.0
@export var saldiri_menzili: float = 30.0
@export var hazirlik_suresi: float = 0.55   # telegraf — parry öğrenimi için okunaklı
@export var saldiri_aktif: float = 0.12
@export var toparlanma_suresi: float = 0.60
@export var devriye_yaricapi: float = 80.0
@export var yercekimi: float = 980.0

var durum: Durum = Durum.DEVRIYE
var _sayac: float = 0.0
var _baslangic_x: float = 0.0
var _yon: int = 1

@onready var stats: CombatStats = $CombatStats
@onready var hitbox: Hitbox = $Hitbox
@onready var hurtbox: Hurtbox = $Hurtbox
@onready var gorsel: ColorRect = $Gorsel

func _ready() -> void:
	add_to_group("dusman")
	_baslangic_x = global_position.x
	hitbox.sahip = self
	hitbox.hasar = 12.0
	hitbox.denge_hasari = 10.0
	hurtbox.vuruldu.connect(_vuruldu)
	stats.denge_kirildi.connect(func(): _gec(Durum.SENDELEME))
	stats.oldu.connect(_ol)

func _physics_process(delta: float) -> void:
	_sayac += delta
	if not is_on_floor():
		velocity.y = minf(velocity.y + yercekimi * delta, 420.0)
	var oyuncu := _oyuncu_bul()

	match durum:
		Durum.DEVRIYE:
			velocity.x = _yon * devriye_hizi
			if absf(global_position.x - _baslangic_x) > devriye_yaricapi:
				_yon = -_yon
			if oyuncu and global_position.distance_to(oyuncu.global_position) < gorus_menzili:
				_gec(Durum.TAKIP)
		Durum.TAKIP:
			if oyuncu == null:
				_gec(Durum.DEVRIYE)
			else:
				var fark := oyuncu.global_position.x - global_position.x
				_yon = 1 if fark > 0.0 else -1
				velocity.x = _yon * takip_hizi
				if absf(fark) < saldiri_menzili:
					_gec(Durum.HAZIRLIK)
				elif global_position.distance_to(oyuncu.global_position) > gorus_menzili * 1.5:
					_gec(Durum.DEVRIYE)
		Durum.HAZIRLIK:
			velocity.x = 0.0
			if _sayac >= hazirlik_suresi:
				hitbox.position.x = 16.0 * _yon
				hitbox.ac()
				_gec(Durum.SALDIRI)
		Durum.SALDIRI:
			if _sayac >= saldiri_aktif:
				hitbox.kapat()
				_gec(Durum.TOPARLANMA)
		Durum.TOPARLANMA:
			velocity.x = 0.0
			if _sayac >= toparlanma_suresi:
				_gec(Durum.TAKIP)
		Durum.SENDELEME:
			velocity.x = move_toward(velocity.x, 0.0, 800.0 * delta)
			if _sayac >= 1.4:
				_gec(Durum.TAKIP)
		Durum.OLU:
			velocity.x = move_toward(velocity.x, 0.0, 800.0 * delta)

	move_and_slide()
	_gorsel_guncelle()

func _oyuncu_bul() -> Node2D:
	var liste := get_tree().get_nodes_in_group("oyuncu")
	return liste[0] if not liste.is_empty() else null

func _vuruldu(hb: Hitbox) -> void:
	if durum == Durum.OLU:
		return
	stats.hasar_al(hb.hasar)
	stats.denge_hasari(hb.denge_hasari)
	velocity.x = signf(global_position.x - hb.sahip.global_position.x) * hb.geri_itme * 0.6
	gorsel.color = Color(1, 1, 1)  # vuruş flaşı; _gorsel_guncelle bir sonraki karede düzeltir

func parrylendi() -> void:
	## Oyuncu bu düşmanın saldırısını parryledi → uzun sendeleme (karşı saldırı fırsatı)
	hitbox.kapat()
	stats.denge_hasari(stats.azami_denge)  # kırılmayı tetikler

func _ol() -> void:
	_gec(Durum.OLU)
	hitbox.kapat()
	hurtbox.set_deferred("monitoring", false)

func _gec(yeni: Durum) -> void:
	durum = yeni
	_sayac = 0.0

func _gorsel_guncelle() -> void:
	var renk := Color(0.62, 0.42, 0.34)          # Pas-Çene kahvesi (devriye)
	match durum:
		Durum.TAKIP:
			renk = Color(0.72, 0.45, 0.30)
		Durum.HAZIRLIK:
			renk = Color(0.95, 0.75, 0.25)         # TELEGRAF — parry zamanı yaklaşır
		Durum.SALDIRI:
			renk = Color(0.95, 0.30, 0.20)
		Durum.SENDELEME:
			renk = Color(0.40, 0.60, 0.90)         # kırık denge — bitiriş fırsatı
		Durum.OLU:
			renk = Color(0.22, 0.20, 0.20)
	gorsel.color = renk
