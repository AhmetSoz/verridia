extends Node2D
## Kartal-Yurdu — Birinci Kitap açılışı (Bölüm 1, TOGAN).
## Şafak öncesi bozkır talim alanı. Tek Göz gökte, Kızıl Sürü ufukta.

const DIALOG := preload("res://scenes/ui/dialog.tscn")

@onready var oyuncu: PlayerTogan = $Togan
@onready var kaya = $Kaya
@onready var hud = $HUD

var _prompt: Label

func _ready() -> void:
	SceneFlow.kontrol_noktasi_kaydet("kartal_yurdu_giris")
	hud.bagla(oyuncu.stats)
	# Kamerayı bölüm sınırlarına kilitle (boşluk/void görünmesin)
	var kam := oyuncu.get_node("Camera2D") as Camera2D
	kam.limit_left = -120
	kam.limit_right = 1520
	kam.limit_top = -140
	kam.limit_bottom = 392
	_acilis_sinematigi.call_deferred()

func _konus(d, satirlar: Array, otomatik: bool = true) -> void:
	d.goster(satirlar, otomatik)
	await d.bitti

func _prompt_kur() -> void:
	var cl := CanvasLayer.new()
	cl.layer = 15
	add_child(cl)
	_prompt = Label.new()
	_prompt.add_theme_font_size_override("font_size", 16)
	_prompt.add_theme_color_override("font_color", Color(0.93, 0.8, 0.4))
	_prompt.add_theme_color_override("font_outline_color", Color(0.1, 0.05, 0.0))
	_prompt.add_theme_constant_override("outline_size", 5)
	_prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_prompt.position = Vector2(200, 62)
	_prompt.size = Vector2(240, 26)
	_prompt.text = "SAVUŞTUR!    (L)"
	_prompt.visible = false
	cl.add_child(_prompt)

func _kaya_yaklas() -> void:
	if not is_instance_valid(kaya) or not is_instance_valid(oyuncu):
		return
	var hedef: float = oyuncu.global_position.x + 46.0
	if absf(kaya.global_position.x - hedef) > 64.0:
		kaya.yuru_git(hedef)
		var g := 0
		while kaya._hedef_x != null and g < 180:
			g += 1
			await get_tree().process_frame

func _parry_turu(d) -> void:
	# Açık alan talimi: Kaya oyuncuyu takip eder, dört kez telegraflı vurur.
	for i in range(4):
		await _kaya_yaklas()
		if not is_instance_valid(kaya):
			return
		kaya.bak(-1 if oyuncu.global_position.x < kaya.global_position.x else 1)
		_prompt.visible = true
		await kaya.saldir(kaya.yon)
		_prompt.visible = false
		await get_tree().create_timer(0.65).timeout
		if i == 1:  # ortada kısa koçluk
			oyuncu.girdi_kilitli = true
			await _konus(d, [["Kaya", "Öfkeyle değil — dinleyerek. Kılıcı değil, beni savuştur."]])
			oyuncu.girdi_kilitli = false

func _acilis_sinematigi() -> void:
	_prompt_kur()
	# Togan talim yapar → Kaya gelir → talim düellosu (parry dersi, kitaba sadık).
	oyuncu.girdi_kilitli = true
	oyuncu.yon = 1
	kaya.bak(-1)
	await get_tree().create_timer(0.5).timeout
	for i in range(3):
		if is_instance_valid(oyuncu):
			oyuncu._saldiri_basla(true)
		await get_tree().create_timer(0.75).timeout

	var d = DIALOG.instantiate()
	add_child(d)
	await _konus(d, [
		["", "Kılıç üçüncü kez göğsüne gömülünce kuklanın tahta omurgası çatladı."],
		["", "Aşağıda Kartal-Yurdu uyuyordu. Tek Göz kuzey sırtlarının üzerinde asılıydı."],
		["Togan", "Kaçıncı darbe olduğunu bilmiyorum. Şafak hâlâ ne kadar uzak?"],
	])

	kaya.yuru_git(oyuncu.global_position.x + 46.0)
	var g := 0
	while kaya._hedef_x != null and g < 240:
		g += 1
		await get_tree().process_frame
	kaya.bak(-1)
	await _konus(d, [
		["Kaya", "Demiri değil, kendini yoruyorsun."],
		["Kaya", "Bir kez de ete kemiğe karşı salla. Belki kime vurduğunu hatırlarsın."],
		["Kaya", "Karşında kim var Togan? Ben mi... yoksa bir yıldır mezara koyamadığın biri mi?"],
		["Kaya", "Sana üç iz göstereyim."],
		["Kaya", "Birincisi rakibin durduğu yer. İkincisi vuracağını sandığın yer. Üçüncüsü öfkenin seni sürüklediği yer."],
		["Kaya", "Sen hep üçüncüye basıyorsun. Vurduğum an savuştur — L'ye bas."],
	])

	oyuncu.girdi_kilitli = false
	await _parry_turu(d)
	oyuncu.girdi_kilitli = true

	await _konus(d, [
		["Kaya", "İşte. Demiri değil, sesi dinledin."],
		["Kaya", "Demek hâlâ duyabiliyorsun. İyi. Bir gün bu, seni ayakta tutar."],
		["", "Talim senin artık. A/D yürü · J/K vur · L savuştur · Space çift zıpla · Shift takla."],
	])
	oyuncu.girdi_kilitli = false
