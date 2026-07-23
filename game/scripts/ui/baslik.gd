extends Control
## Başlık ekranı — Verridia: Kızıl Hafta. Space/E/Enter ile başlar.

@onready var ipucu: Label = $Ipucu
var _t: float = 0.0

func _process(delta: float) -> void:
	_t += delta
	ipucu.modulate.a = 0.45 + 0.45 * sin(_t * 3.2)   # yanıp sönen ipucu

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("zipla") or event.is_action_pressed("etkilesim") or event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		get_tree().change_scene_to_file("res://scenes/levels/kartal_yurdu.tscn")
