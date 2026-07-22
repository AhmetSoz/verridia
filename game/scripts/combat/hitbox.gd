class_name Hitbox
extends Area2D
## Saldırı kutusu. Aktif kareler boyunca açılır; temas eden Hurtbox'a darbe iletir.
## Rastgele isabet yüzdesi YOK — temas eden silah vurur (plan §7).

@export var hasar: float = 10.0
@export var denge_hasari: float = 8.0
@export var geri_itme: float = 120.0
var sahip: Node2D  # vuran karakter (kendi kendini vurmasın)

var _vurulanlar: Array = []  # bir açılışta aynı hurtbox'a iki kez vurma

func _init() -> void:
	monitoring = false          # ac() ile açılır → hurtbox'ları algılar
	monitorable = false
	collision_layer = 0
	collision_mask = 4          # hurtbox katmanı (4)

func _ready() -> void:
	area_entered.connect(_alan_girdi)

func ac() -> void:
	_vurulanlar.clear()
	monitoring = true

func kapat() -> void:
	monitoring = false

func _alan_girdi(alan: Area2D) -> void:
	if alan is Hurtbox and alan not in _vurulanlar:
		_vurulanlar.append(alan)
		(alan as Hurtbox).darbe_al(self)
