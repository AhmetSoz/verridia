extends Node2D
## Talim kuklası — Togan'ın kılıç talimi yaptığı hedef (Bölüm 1 açılışı).
## Ölmez; vurulunca kıvılcım + sarsılır (keçe gövdesinden kepek saçılır hissi).

@onready var gorsel: Sprite2D = $Gorsel
@onready var hurtbox: Hurtbox = $Hurtbox

var _squash: Vector2 = Vector2.ONE

func _ready() -> void:
	hurtbox.vuruldu.connect(_vuruldu)

func _vuruldu(hb: Hitbox) -> void:
	var d := signf(global_position.x - hb.sahip.global_position.x)
	_squash = Vector2(0.82, 1.16)
	gorsel.rotation = deg_to_rad(-6.0) * d
	Fx.carp(hurtbox.global_position + Vector2(4 * -d, -6), d)
	Fx.toz(global_position + Vector2(0, -2), 0.4)
	Fx.sars(1.6, 0.08)

func _process(delta: float) -> void:
	_squash = _squash.lerp(Vector2.ONE, 1.0 - exp(-13.0 * delta))
	gorsel.scale = _squash
	gorsel.rotation = lerp_angle(gorsel.rotation, 0.0, 1.0 - exp(-13.0 * delta))
