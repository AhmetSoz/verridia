class_name Hitbox
extends Area2D
## Saldırı kutusu. Aktif kareler boyunca açılır; Hurtbox'lara vuruş iletir.
## Rastgele isabet yüzdesi YOK — temas eden silah vurur (plan §7).

@export var hasar: float = 10.0
@export var denge_hasari: float = 8.0
@export var geri_itme: float = 120.0
var sahip: Node2D  # vuran karakter (kendi kendini vurmasın)

func _init() -> void:
	monitoring = false
	monitorable = false
	collision_layer = 0
	collision_mask = 4  # hurtbox katmanı

func ac() -> void:
	monitoring = true

func kapat() -> void:
	monitoring = false
