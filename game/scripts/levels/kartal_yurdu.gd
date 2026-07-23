extends Node2D
## Kartal-Yurdu — Birinci Kitap açılışı (Bölüm 1, TOGAN).
## Şafak öncesi bozkır talim alanı. Tek Göz gökte, Kızıl Sürü ufukta.

const DIALOG := preload("res://scenes/ui/dialog.tscn")

@onready var oyuncu: PlayerTogan = $Togan
@onready var kaya = $Kaya
@onready var hud = $HUD

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

func _acilis_sinematigi() -> void:
	# Sinematik: Togan talim yapar → Kaya gelir → talim düellosu (parry dersi).
	oyuncu.girdi_kilitli = true
	oyuncu.yon = 1
	kaya.bak(-1)
	await get_tree().create_timer(0.5).timeout
	# Togan kuklaya üç kez AĞIR vuruyor (kitabın açılışı)
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

	# Kaya gölgelerden çıkıp yürüyerek gelir
	kaya.yuru_git(oyuncu.global_position.x + 46.0)
	var g := 0
	while kaya._hedef_x != null and g < 240:
		g += 1
		await get_tree().process_frame
	kaya.bak(-1)
	await _konus(d, [
		["Kaya", "Demiri değil, kendini yoruyorsun."],
		["Kaya", "Bir kez de ete kemiğe karşı salla. Belki kime vurduğunu hatırlarsın."],
		["Kaya", "Şimdi savuştur. Vurduğum an — L'ye bas."],
	])

	# TALİM DÜELLOSU: kontrol açılır, Kaya telegraflı vurur, oyuncu L ile parry eder
	oyuncu.girdi_kilitli = false
	for i in range(3):
		if is_instance_valid(kaya):
			await kaya.saldir(-1)
		await get_tree().create_timer(0.8).timeout

	await _konus(d, [
		["Kaya", "İşte. Demiri değil, sesi dinledin."],
		["", "A/D yürü · J/K vur · L savuştur · Space çift zıpla · Shift takla."],
	])
