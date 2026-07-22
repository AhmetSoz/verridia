class_name Hurtbox
extends Area2D
## Hasar alma kutusu. Hitbox darbesini sahibine "vuruldu" sinyaliyle iletir.

signal vuruldu(hitbox: Hitbox)

func _init() -> void:
	collision_layer = 4  # hitbox maskesi (4) bunu görür
	collision_mask = 0
	monitorable = true   # hitbox'lar algılasın
	monitoring = false

func darbe_al(hb: Hitbox) -> void:
	if hb.sahip == get_parent():
		return  # kendi saldırısı
	vuruldu.emit(hb)
