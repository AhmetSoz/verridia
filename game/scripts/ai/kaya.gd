extends CharacterBody2D
## Kaya — Togan'ın süt ablası/ustası. Talim düellosu NPC'si.
## Sinematik onu sürer: yuru_git(x), bak(yon), saldir() (telegraflı — parry pratiği).

@export var yercekimi: float = 980.0
@export var hiz: float = 68.0

@onready var gorsel: AnimatedSprite2D = $Gorsel
@onready var hitbox: Hitbox = $Hitbox

var yon: int = -1               # sağdan girer, sola bakar
var _hedef_x = null
var _durum: String = "idle"
var _mesgul: bool = false        # saldırı sırasında yürüme kilidi

func _ready() -> void:
	add_to_group("kaya")
	hitbox.sahip = self
	hitbox.hasar = 0.0           # talim — can gitmez
	hitbox.denge_hasari = 5.0    # parry edilmezse küçük denge (geri bildirim, zararsız)

func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity.y = minf(velocity.y + yercekimi * delta, 420.0)
	else:
		velocity.y = 0.0
	if _mesgul:
		velocity.x = move_toward(velocity.x, 0.0, 1200.0 * delta)
	elif _hedef_x != null:
		var fark: float = _hedef_x - global_position.x
		if absf(fark) > 5.0:
			yon = 1 if fark > 0.0 else -1
			velocity.x = yon * hiz
			_oynat("yuru")
		else:
			velocity.x = 0.0
			_hedef_x = null
			_oynat("idle")
	else:
		velocity.x = move_toward(velocity.x, 0.0, 900.0 * delta)
		if not _mesgul:
			_oynat("idle")
	move_and_slide()
	gorsel.flip_h = yon < 0

func _oynat(a: String) -> void:
	if _durum != a:
		_durum = a
		gorsel.play(a)

func yuru_git(x: float) -> void:
	_hedef_x = x

func bak(y: int) -> void:
	yon = y

## Oyuncu Kaya'nın darbesini savuşturunca (parry) — Kaya geri savrulur (talim tepkisi)
func parrylendi() -> void:
	hitbox.kapat()
	velocity.x = -yon * 130.0
	_oynat("kayis")

## Kaya, Togan'ın saldırısından kayarak geri çekilir (yarım adım — kitaptaki gibi)
func kac() -> void:
	if _mesgul:
		return
	_mesgul = true
	_oynat("kayis"); gorsel.set_frame_and_progress(0, 0.0)
	velocity.x = -yon * 150.0    # oyuncudan uzağa kayar
	await get_tree().create_timer(0.28).timeout
	velocity.x = 0.0
	_mesgul = false
	_oynat("idle")

func kayarak_atil(mesafe: float) -> void:
	# Kaya'nın kişisel skili: kayarak geri/ileri atılma
	_mesgul = true
	_oynat("kayis"); gorsel.set_frame_and_progress(0, 0.0)
	velocity.x = signf(mesafe) * 220.0
	await get_tree().create_timer(0.3).timeout
	velocity.x = 0.0
	_mesgul = false

## Telegraflı tahta-kılıç saldırısı — oyuncu L ile parry etmeli.
func saldir(oyuncu_yon: int) -> void:
	_mesgul = true
	yon = oyuncu_yon
	_oynat("saldiri"); gorsel.set_frame_and_progress(0, 0.0)
	hitbox.position.x = 26.0 * yon
	await get_tree().create_timer(0.40).timeout   # net telegraf (parry öğrenimi)
	if not is_instance_valid(self):
		return
	hitbox.ac()
	await get_tree().create_timer(0.14).timeout
	hitbox.kapat()
	await get_tree().create_timer(0.25).timeout
	_oynat("idle")
	_mesgul = false
