extends CanvasLayer
## Diyalog kutusu — sinematik/hikâye satırları (Türkçe). Daktilo efekti + ilerletme.
## Kullanım: dialog.goster([["Kaya","Demiri değil..."], ["Togan","..."]])  → bitti sinyali

signal bitti

const HIZ := 44.0  # karakter/sn

const PORTRELER := {
	"Togan": preload("res://asset/portre/togan_k.png"),
	"Kaya": preload("res://asset/portre/kaya_k.png"),
}

@onready var kutu: Control = $Kutu
@onready var ad_lbl: Label = $Kutu/Ad
@onready var metin_lbl: Label = $Kutu/Metin
@onready var devam_lbl: Label = $Kutu/Devam
@onready var portre: TextureRect = $Kutu/Portre

var _satirlar: Array = []
var _idx: int = -1
var _tam: String = ""
var _gorunen: float = 0.0
var _otomatik: bool = false
var _bekle: float = 0.0

func _ready() -> void:
	kutu.visible = false

func goster(satirlar: Array, otomatik: bool = false) -> void:
	_satirlar = satirlar
	_idx = -1
	_otomatik = otomatik
	kutu.visible = true
	_sonraki()

func _sonraki() -> void:
	_idx += 1
	if _idx >= _satirlar.size():
		kutu.visible = false
		bitti.emit()
		return
	var s: Array = _satirlar[_idx]
	ad_lbl.text = s[0]
	ad_lbl.visible = s[0] != ""
	var por = PORTRELER.get(s[0], null)
	portre.texture = por
	portre.visible = por != null
	_tam = s[1]
	_gorunen = 0.0
	_bekle = 0.0
	metin_lbl.text = ""
	devam_lbl.visible = false

func _process(delta: float) -> void:
	if not kutu.visible:
		return
	if _gorunen < float(_tam.length()):
		_gorunen = minf(_gorunen + HIZ * delta, float(_tam.length()))
		metin_lbl.text = _tam.substr(0, int(_gorunen))
		if _gorunen >= float(_tam.length()):
			devam_lbl.visible = not _otomatik
			# otomatik modda okuma süresi kadar bekle
			_bekle = 1.3 + 0.05 * float(_tam.length())
	elif _otomatik:
		_bekle -= delta
		if _bekle <= 0.0:
			_sonraki()

func _input(event: InputEvent) -> void:
	# Otomatik modda bile Space/E ile hızlandırılabilir (basınca hemen tamamla/ilerle)
	if not kutu.visible:
		return
	# Space / E / Enter ile ilerlet (diyalog boyunca kontrol zaten kilitli → zıplamaz)
	if event.is_action_pressed("etkilesim") or event.is_action_pressed("zipla") or event.is_action_pressed("ui_accept"):
		if _gorunen < float(_tam.length()):
			_gorunen = float(_tam.length())     # anında tamamla
			metin_lbl.text = _tam
			devam_lbl.visible = true
		else:
			_sonraki()
		get_viewport().set_input_as_handled()
