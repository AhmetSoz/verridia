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
	var hedef: float = oyuncu.global_position.x + 44.0
	if absf(kaya.global_position.x - hedef) > 60.0:
		kaya.yuru_git(hedef)
		var g := 0
		while kaya._hedef_x != null and g < 180:
			g += 1
			await get_tree().process_frame
	kaya.bak(-1 if oyuncu.global_position.x < kaya.global_position.x else 1)

var _saldiri_sayaci: int = 0

func _a_saldiri() -> void:
	# Faz A: Togan her saldırdığında Kaya kayarak geri çekilir (kitaptaki gibi)
	_saldiri_sayaci += 1
	if is_instance_valid(kaya):
		kaya.bak(-1 if oyuncu.global_position.x < kaya.global_position.x else 1)
		kaya.kac()

func _parry_bekle(d) -> void:
	# Faz B: oyuncu Kaya'nın darbesini savuşturana (parry) kadar dener
	var basari := false
	var deneme := 0
	while not basari and deneme < 7:
		deneme += 1
		await _kaya_yaklas()
		if not is_instance_valid(kaya):
			return
		var irade0: float = oyuncu.stats.irade
		_prompt.text = "SAVUŞTUR!    (L)"
		_prompt.visible = true
		await kaya.saldir(kaya.yon)
		_prompt.visible = false
		if oyuncu.stats.irade > irade0 + 1.0:
			basari = true
		else:
			if deneme == 2:
				oyuncu.girdi_kilitli = true
				await _konus(d, [["Kaya", "Acele etme. Vuracağım anı dinle — sonra L."]])
				oyuncu.girdi_kilitli = false
			await get_tree().create_timer(0.7).timeout

func _acilis_sinematigi() -> void:
	_prompt_kur()
	# --- SCENE 1: Sessiz Talim (Bölüm 1, kitaba birebir) ---
	oyuncu.girdi_kilitli = true
	oyuncu.yon = 1
	kaya.bak(-1)
	await get_tree().create_timer(0.5).timeout
	# Togan kuklaya üç kez ağır vuruyor — "kılıç üçüncü kez gömülünce..."
	for i in range(3):
		if is_instance_valid(oyuncu):
			oyuncu._saldiri_basla(true)
		await get_tree().create_timer(0.72).timeout

	var d = DIALOG.instantiate()
	add_child(d)
	await _konus(d, [
		["", "Kılıç üçüncü kez göğsüne gömülünce kuklanın tahta omurgası çatladı."],
		["", "Kaçıncı darbede olduğunu, şafağın ne kadar uzakta kaldığını bilmiyordu."],
		["", "Tek Göz kuzey sırtlarının üzerinde asılıydı. Burkut talim kazığında bekliyordu."],
	])

	# Kaya gölgelerden çıkar, iki tahta kılıç getirir
	await _kaya_yaklas()
	await _konus(d, [
		["Kaya", "Demiri değil, kendini yoruyorsun."],
		["Kaya", "Bir kez de ete kemiğe karşı salla. Belki kime vurduğunu hatırlarsın."],
	])

	# FAZ A — Togan saldırır, Kaya her darbede kayarak çekilir
	_saldiri_sayaci = 0
	oyuncu.saldirdi.connect(_a_saldiri)
	_prompt.text = "SALDIR!    (J / K)"
	_prompt.visible = true
	oyuncu.girdi_kilitli = false
	var bek := 0
	while _saldiri_sayaci < 3 and bek < 900:
		bek += 1
		await get_tree().process_frame
	oyuncu.girdi_kilitli = true
	_prompt.visible = false
	if oyuncu.saldirdi.is_connected(_a_saldiri):
		oyuncu.saldirdi.disconnect(_a_saldiri)

	await _konus(d, [
		["Kaya", "Bu öfke bir Azgut'un işine yarayabilir."],
		["Kaya", "Bir Rüzgar-Dinleyen'i ise öldürür."],
	])

	# DEVRİLME — Togan bütün ağırlığını verir, Kaya yana kayar, Togan sırtüstü düşer
	oyuncu.yon = 1
	oyuncu._saldiri_basla(true)
	await get_tree().create_timer(0.14).timeout
	if is_instance_valid(kaya):
		await kaya.kayarak_atil(1)
	oyuncu.sendele()
	Fx.toz(oyuncu.global_position, 1.1)
	Fx.sars(3.0, 0.16)
	await get_tree().create_timer(0.5).timeout
	await _konus(d, [
		["Kaya", "Bu bir Sungur kılıcı değil. Sapını sen tutuyorsun, vuran öfken."],
		["Kaya", "Ayağa kalk."],
		["Togan", "Düştüm. Gördün."],
		["Kaya", "Düşmek talimin sonu değil."],
	])

	# ÜÇ İZ
	await _konus(d, [
		["Kaya", "Sana üç iz göstereyim."],
		["Kaya", "Birincisi rakibin durduğu yer. İkincisi vuracağını sandığın yer. Üçüncüsü öfkenin seni sürüklediği yer."],
		["Kaya", "Sen hep üçüncüye basıyorsun. Vurduğum an savuştur — öfkeyle değil, dinleyerek. L'ye bas."],
	])

	# FAZ B — parry başarısına kadar
	oyuncu.girdi_kilitli = false
	await _parry_bekle(d)
	oyuncu.girdi_kilitli = true

	await _konus(d, [
		["Kaya", "Demek hâlâ duyabiliyorsun."],
		["Togan", "Neyi?"],
		["Kaya", "Senden başka birini."],
		["Kaya", "Karşında kim var Togan? Ben mi? Korgan mı? Yoksa bir yıldır mezara koyamadığın biri mi?"],
	])

	# Kaya tahta kılıçları toplar, yorgun adımlarla gider
	if is_instance_valid(kaya):
		kaya.yuru_git(oyuncu.global_position.x + 260.0)
	await _konus(d, [
		["Togan", "Bir hayalet neresinden vurulur?"],
		["", "Kartal-Yurdu'nda dolaş. (A/D yürü · J/K vur · L savuştur · Space çift zıpla · Shift takla)"],
	])
	oyuncu.girdi_kilitli = false
