extends Node2D
## Kartal-Yurdu — Birinci Kitap açılışı (Bölüm 1, TOGAN).
## Şafak öncesi bozkır talim alanı. Tek Göz gökte, Kızıl Sürü ufukta.

const DIALOG := preload("res://scenes/ui/dialog.tscn")

@onready var oyuncu: PlayerTogan = $Togan
@onready var kaya = $Kaya
@onready var hud = $HUD

var _prompt: Label
var _d                       # diyalog kutusu (sahneler paylaşır)
var _duello_bitti: bool = false
var _sahne2_oynadi: bool = false

func _ready() -> void:
	SceneFlow.kontrol_noktasi_kaydet("kartal_yurdu_giris")
	hud.bagla(oyuncu.stats)
	# Kamerayı bölüm sınırlarına kilitle (boşluk/void görünmesin)
	var kam := oyuncu.get_node("Camera2D") as Camera2D
	kam.limit_left = -120
	kam.limit_right = 1520
	kam.limit_top = -140
	kam.limit_bottom = 392
	# Sahne 2 tetikleyicisi: ana ateşin yanı (duello bitince aktif)
	var tetik := Area2D.new()
	tetik.collision_mask = 2         # oyuncu gövdesi (layer 2)
	var ts := CollisionShape2D.new()
	var trect := RectangleShape2D.new()
	trect.size = Vector2(70, 90)
	ts.shape = trect
	tetik.add_child(ts)
	add_child(tetik)
	tetik.global_position = Vector2(430, 300)
	tetik.body_entered.connect(_ates_tetik)
	_acilis_sinematigi.call_deferred()

func _ates_tetik(body: Node) -> void:
	if body == oyuncu and _duello_bitti and not _sahne2_oynadi:
		_sahne2_oynadi = true
		_sahne2()

func _sahne2() -> void:
	# SAHNE 2 — Ana Ateş (Anya Ana), kitaba sadık
	oyuncu.girdi_kilitli = true
	await _konus(_d, [
		["", "Ana ateşin kokusu geldi: bizon eti, dağ kekiği, közde kök sebzeler."],
		["Anya Ana", "Savaşçı aç karnına kılıç sallamaz."],
		["Anya Ana", "Dün gece babanı gördüm. Bozkırda at sürüyordu. Sana seslendi: 'Oğlum gökyüzüne bakmayı unuttu.'"],
		["Togan", "Rüyaymış."],
		["Anya Ana", "Rüyadır. Bu, boş olduğu anlamına gelmez. Bir Rüzgar-Dinleyen gözünü toprağa dikerse yolunu şaşırır."],
		["Anya Ana", "Sen bir yıldır Melira'nın düştüğü yerden başka yere bakmıyorsun."],
		["Togan", "Sen ne gördüğümü nereden bileceksin?"],
		["Anya Ana", "Kocamı bir baskında, ilk oğlumu kış hummasında kaybettim. Bu obada içinde mezar taşımayan kimse yok."],
		["Anya Ana", "Acını senden alamam. Ama onu besleyip sana hükmettirmene de susamam. Seni Kor-Ateşler'den ayıran ne kaldı, kendine sor."],
		["Anya Ana", "Baban rüyada bir şey daha söyledi... Sana kızgın değildi."],
		["", "Bu cevap, azardan daha ağır geldi."],
	])
	oyuncu.girdi_kilitli = false

func _konus(d, satirlar: Array, otomatik: bool = true) -> void:
	Fx.kamera_taban(Vector2(0, 52))   # karakterler kutunun üstünde kalsın
	d.goster(satirlar, otomatik)
	await d.bitti
	Fx.kamera_taban(Vector2.ZERO)

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
	# Faz B: gerçek savunma dövüşü — art arda savuştur, tempo artar (3 başarı gerek)
	var basari := 0
	var deneme := 0
	while basari < 3 and deneme < 14:
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
			basari += 1
			if basari == 1:
				oyuncu.girdi_kilitli = true
				await _konus(d, [["Kaya", "İşte! Durma — bir daha, bir daha."]])
				oyuncu.girdi_kilitli = false
		elif deneme == 2:
			oyuncu.girdi_kilitli = true
			await _konus(d, [["Kaya", "Acele etme. Vuracağım anı dinle — sonra L."]])
			oyuncu.girdi_kilitli = false
		# tempo: başarıdan sonra Kaya hızlanır
		await get_tree().create_timer(0.5 if basari > 0 else 0.7).timeout

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
	oyuncu.sendele(true)   # Kaya "kalk" diyene kadar yerde kalır
	Fx.toz(oyuncu.global_position, 1.1)
	Fx.sars(3.0, 0.16)
	await get_tree().create_timer(0.6).timeout
	await _konus(d, [
		["Kaya", "Bu bir Sungur kılıcı değil. Sapını sen tutuyorsun, vuran öfken."],
		["Kaya", "Ayağa kalk."],
		["Togan", "Düştüm. Gördün."],
		["Kaya", "Düşmek talimin sonu değil."],
	])
	oyuncu.kalk()   # şimdi ayağa kalkar
	await get_tree().create_timer(0.3).timeout

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

	# Kaya tahta kılıçları toplar, yorgun adımlarla geldiği gölgelere döner
	if is_instance_valid(kaya):
		kaya.bak(-1)
		kaya.yuru_git(oyuncu.global_position.x - 360.0)   # sola, sahneden çıkar
		get_tree().create_timer(4.5).timeout.connect(func():
			if is_instance_valid(kaya):
				kaya.queue_free())
	await _konus(d, [
		["Togan", "Bir hayalet neresinden vurulur?"],
		["", "Ana ateşin kokusu geliyor — bizon eti, dağ kekiği. Anya Ana ateşin başında bekliyor."],
		["", "→ Sağdaki ateşe doğru yürü."],
	])
	_d = d
	_duello_bitti = true
	oyuncu.girdi_kilitli = false
