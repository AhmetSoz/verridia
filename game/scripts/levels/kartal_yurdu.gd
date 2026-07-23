extends Node2D
## Kartal-Yurdu — Birinci Kitap açılışı (Bölüm 1, TOGAN).
## Şafak öncesi bozkır talim alanı. Tek Göz gökte, Kızıl Sürü ufukta.

const DIALOG := preload("res://scenes/ui/dialog.tscn")

@onready var oyuncu: PlayerTogan = $Togan
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

func _acilis_sinematigi() -> void:
	# Otomatik sinematik (dizi gibi): Togan kendi kendine talim yapar, metin kendi akar.
	oyuncu.girdi_kilitli = true
	oyuncu.yon = 1
	await get_tree().create_timer(0.5).timeout
	# Togan kuklaya üç kez AĞIR vuruyor (kitabın açılışı — bütün ağırlığını verir)
	for i in range(3):
		if is_instance_valid(oyuncu):
			oyuncu._saldiri_basla(true)
		await get_tree().create_timer(0.75).timeout
	var d = DIALOG.instantiate()
	add_child(d)
	d.bitti.connect(func(): oyuncu.girdi_kilitli = false)
	d.goster([
		["", "Kılıç üçüncü kez göğsüne gömülünce kuklanın tahta omurgası çatladı."],
		["", "Aşağıda Kartal-Yurdu uyuyordu. Tek Göz kuzey sırtlarının üzerinde asılıydı."],
		["Togan", "Kaçıncı darbe olduğunu bilmiyorum. Şafak hâlâ ne kadar uzak?"],
		["Kaya", "Demiri değil, kendini yoruyorsun."],
		["Kaya", "Bir kez de ete kemiğe karşı salla. Belki kime vurduğunu hatırlarsın."],
		["", "Talimin vakti geldi. Kuklaya J/K ile vur, A/D ile yürü."],
	], true)   # otomatik = dizi gibi kendi akar
