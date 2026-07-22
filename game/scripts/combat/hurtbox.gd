class_name Hurtbox
extends Area2D
## Hasar alma kutusu. Hitbox girişlerini sahibine "vuruldu" sinyaliyle iletir.

signal vuruldu(hitbox: Hitbox)

func _init() -> void:
	collision_layer = 4  # hurtbox katmanı
	collision_mask = 0
	monitorable = true
	monitoring = false

func _ready() -> void:
	area_entered.connect(_alan_girdi)
	monitoring = true
	collision_mask = 4

func _alan_girdi(alan: Area2D) -> void:
	if alan is Hitbox:
		var hb := alan as Hitbox
		if hb.sahip == get_parent():
			return  # kendi saldırısı
		vuruldu.emit(hb)
