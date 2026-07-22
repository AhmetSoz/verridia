extends Node
## AudioManager — katmanlı müzik (keşif/tehdit/dövüş/boss/sonuç) + SFX havuzu.

enum Katman { KESIF, TEHDIT, DOVUS, BOSS, SONUC }

var _muzik_calar: AudioStreamPlayer
var _aktif_katman: Katman = Katman.KESIF
var _sfx_havuzu: Array[AudioStreamPlayer] = []
const SFX_HAVUZ_BOYU := 8

func _ready() -> void:
	_muzik_calar = AudioStreamPlayer.new()
	_muzik_calar.bus = "Master"
	add_child(_muzik_calar)
	for i in SFX_HAVUZ_BOYU:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_sfx_havuzu.append(p)

func muzik_cal(akis: AudioStream, katman: Katman = Katman.KESIF) -> void:
	_aktif_katman = katman
	if _muzik_calar.stream == akis and _muzik_calar.playing:
		return
	_muzik_calar.stream = akis
	_muzik_calar.play()

func katman_degistir(katman: Katman) -> void:
	## İleride: aynı parçanın katmanları arasında crossfade.
	_aktif_katman = katman

func sfx(akis: AudioStream, ses_db: float = 0.0) -> void:
	if akis == null:
		return
	for p in _sfx_havuzu:
		if not p.playing:
			p.stream = akis
			p.volume_db = ses_db
			p.play()
			return
	## Havuz doluysa ilkini çal (en eski kesilir)
	_sfx_havuzu[0].stream = akis
	_sfx_havuzu[0].volume_db = ses_db
	_sfx_havuzu[0].play()
