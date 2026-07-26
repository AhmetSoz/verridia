extends Node
## Fx — global efekt sistemi: ekran sarsıntısı, vuruş kıvılcımı, toz, ölüm patlaması.
## Sanat gerektirmez; parçacıklar kod-üretimi yumuşak daireyle çizilir.

var _shake: float = 0.0
var _shake_azalma: float = 1.0
var _daire: Texture2D
var _kesik_tex: Texture2D
var _taban: Vector2 = Vector2.ZERO   # sinematik kamera ofseti (sarsıntı bunun üstüne biner)

func _ready() -> void:
	_daire = _yumusak_daire(8)
	_kesik_tex = _yay_kesik(72)

func _process(delta: float) -> void:
	var cam := get_viewport().get_camera_2d()
	if cam == null:
		return
	if _shake > 0.05:
		cam.offset = _taban + Vector2(randf_range(-_shake, _shake), randf_range(-_shake, _shake))
		_shake = maxf(0.0, _shake - _shake_azalma * delta)
	else:
		cam.offset = cam.offset.lerp(_taban, 1.0 - exp(-30.0 * delta))

## Sinematik kamera tabanı (diyalogda yukarı kaldırmak için)
func kamera_taban(v: Vector2) -> void:
	_taban = v

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

func _yay_kesik(boyut: int) -> Texture2D:
	## Hilal biçimli kılıç izi (kod-üretimi) — saldırıyı satan asıl görsel
	var img := Image.create(boyut, boyut, false, Image.FORMAT_RGBA8)
	var c := boyut / 2.0
	var r_dis := c * 0.97
	var r_ic := c * 0.58
	var r_ort := (r_ic + r_dis) * 0.5
	var r_yari := (r_dis - r_ic) * 0.5
	var yay_yari := deg_to_rad(62.0)
	for y in boyut:
		for x in boyut:
			var dx := x - c + 0.5
			var dy := y - c + 0.5
			var d := sqrt(dx * dx + dy * dy)
			if d < r_ic or d > r_dis:
				continue
			var aci := atan2(dy, dx)
			if absf(aci) > yay_yari:
				continue
			# radyal ve açısal yumuşama; uçlara doğru incelir (bıçak izi hissi)
			var t_r: float = 1.0 - absf(d - r_ort) / r_yari
			var t_a: float = 1.0 - absf(aci) / yay_yari
			var kalinlik: float = pow(t_a, 0.55)
			var a: float = clampf(t_r / maxf(kalinlik, 0.08), 0.0, 1.0)
			a = pow(clampf(a, 0.0, 1.0), 0.7) * clampf(t_a * 2.2, 0.0, 1.0)
			if a > 0.01:
				img.set_pixel(x, y, Color(1.0, 0.97, 0.86, a))
	return ImageTexture.create_from_image(img)

## Kılıç kesiği — hilal iz süpürerek döner (hafif/ağır saldırı görseli)
func kesik(pos: Vector2, yon: float, olcek: float = 1.0, sure: float = 0.17,
		bas_aci: float = -55.0, bit_aci: float = 55.0, renk: Color = Color(1.0, 0.97, 0.86)) -> void:
	var sahne := get_tree().current_scene
	if sahne == null:
		return
	var s := Sprite2D.new()
	s.texture = _kesik_tex
	s.z_index = 5
	s.modulate = renk
	s.global_position = pos
	s.scale = Vector2(olcek * signf(yon), olcek)
	s.rotation = deg_to_rad(bas_aci) * signf(yon)
	sahne.add_child(s)
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(s, "rotation", deg_to_rad(bit_aci) * signf(yon), sure).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)
	tw.tween_property(s, "scale", Vector2(olcek * 1.18 * signf(yon), olcek * 1.18), sure)
	tw.tween_property(s, "modulate:a", 0.0, sure).set_delay(sure * 0.45)
	tw.chain().tween_callback(s.queue_free)

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
