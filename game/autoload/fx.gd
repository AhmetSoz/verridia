extends Node
## Fx — global efekt sistemi: ekran sarsıntısı, vuruş kıvılcımı, toz, ölüm patlaması.
## Sanat gerektirmez; parçacıklar kod-üretimi yumuşak daireyle çizilir.

var _shake: float = 0.0
var _shake_azalma: float = 1.0
var _daire: Texture2D

func _ready() -> void:
	_daire = _yumusak_daire(8)

func _process(delta: float) -> void:
	var cam := get_viewport().get_camera_2d()
	if cam == null:
		return
	if _shake > 0.05:
		cam.offset = Vector2(randf_range(-_shake, _shake), randf_range(-_shake, _shake))
		_shake = maxf(0.0, _shake - _shake_azalma * delta)
	elif cam.offset != Vector2.ZERO:
		cam.offset = cam.offset.lerp(Vector2.ZERO, 1.0 - exp(-40.0 * delta))

## Ekran sarsıntısı — miktar piksel, sure saniye
func sars(miktar: float, sure: float = 0.25) -> void:
	_shake = maxf(_shake, miktar)
	_shake_azalma = miktar / maxf(sure, 0.02)

func _yumusak_daire(boyut: int) -> Texture2D:
	var img := Image.create(boyut, boyut, false, Image.FORMAT_RGBA8)
	var c := boyut / 2.0
	for y in boyut:
		for x in boyut:
			var d := Vector2(x - c + 0.5, y - c + 0.5).length() / c
			var a := clampf(1.0 - d, 0.0, 1.0)
			img.set_pixel(x, y, Color(1, 1, 1, a * a))
	return ImageTexture.create_from_image(img)

func _patlat(pos: Vector2, renk: Color, adet: int, hiz_min: float, hiz_max: float,
		omur: float, boyut: float, yercekimi: float, yon_aci: float, yayilim: float) -> void:
	var p := CPUParticles2D.new()
	p.texture = _daire
	p.emitting = false
	p.one_shot = true
	p.explosiveness = 0.9
	p.amount = adet
	p.lifetime = omur
	p.direction = Vector2.RIGHT.rotated(yon_aci)
	p.spread = yayilim
	p.initial_velocity_min = hiz_min
	p.initial_velocity_max = hiz_max
	p.gravity = Vector2(0, yercekimi)
	p.scale_amount_min = boyut * 0.6
	p.scale_amount_max = boyut
	p.color = renk
	# sönümlenme (CPUParticles2D doğrudan Gradient ister)
	var eg := Gradient.new()
	eg.set_color(0, Color(renk.r, renk.g, renk.b, 1.0))
	eg.set_color(1, Color(renk.r, renk.g, renk.b, 0.0))
	p.color_ramp = eg
	p.global_position = pos
	var sahne := get_tree().current_scene
	if sahne == null:
		p.queue_free()
		return
	sahne.add_child(p)
	p.emitting = true
	get_tree().create_timer(omur + 0.3).timeout.connect(p.queue_free)

## Vuruş kıvılcımı — kılıç ete/zırha değince
func carp(pos: Vector2, yon: float = 1.0) -> void:
	_patlat(pos, Color(1.0, 0.95, 0.7), 10, 90, 200, 0.35, 1.6, 400, PI if yon < 0 else 0.0, deg_to_rad(55))
	sars(3.0, 0.15)

## Toz — iniş, koşu adımı, kaçınma
func toz(pos: Vector2, guc: float = 1.0) -> void:
	_patlat(pos, Color(0.75, 0.75, 0.72, 0.7), int(6 * guc), 20, 60 * guc, 0.5, 2.0, -30, -PI / 2, deg_to_rad(70))

## Parry başarısı — altın halka + sarsıntı
func parry(pos: Vector2) -> void:
	_patlat(pos, Color(1.0, 0.9, 0.55), 16, 60, 160, 0.4, 2.2, 0, 0.0, 180.0)
	sars(5.0, 0.2)

## Ölüm — düşman dağılması
func olum(pos: Vector2, renk: Color) -> void:
	_patlat(pos, renk, 22, 40, 180, 0.7, 2.6, 200, 0.0, 180.0)
	sars(4.0, 0.25)
