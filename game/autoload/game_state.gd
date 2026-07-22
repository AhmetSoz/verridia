extends Node
## GameState — kampanya durumu (tek gerçek kaynak).
## Ana olaylar sabittir (kanon); yan sonuçlar bayraklarla tutulur.

signal pov_degisti(yeni_pov: String)
signal bayrak_degisti(anahtar: String, deger)

## Kitap / kısım / fasıl / bölüm konumu (baskı yapısıyla birebir)
var kitap: int = 1
var kisim: int = 1
var fasil: int = 1
var bolum: int = 1

## Aktif POV: "togan" | "temujin" | "karia" | "zaleena"
var aktif_pov: String = "togan"

## Yan sonuç bayrakları — ana hikâyeyi DEĞİŞTİRMEZ, saha kaydını tutar.
## Örn: {"kurtarilan_siviller_golgeortu": 7, "gareth_guveni": true}
var bayraklar: Dictionary = {}

## Bulunan kayıtlar / hatıralar / açılan Külliyat girdileri
var bulunan_kayitlar: Array[String] = []
var hatiralar: Array[String] = []

## Karakter gelişimi: pov -> {"ustalik": int, "yukseltmeler": Array[String]}
var gelisim: Dictionary = {
	"togan": {"ustalik": 0, "yukseltmeler": []},
	"temujin": {"ustalik": 0, "yukseltmeler": []},
	"karia": {"ustalik": 0, "yukseltmeler": []},
	"zaleena": {"ustalik": 0, "yukseltmeler": []},
}

var oyun_suresi_sn: float = 0.0

func _process(delta: float) -> void:
	oyun_suresi_sn += delta

func pov_ata(yeni: String) -> void:
	if yeni == aktif_pov:
		return
	aktif_pov = yeni
	pov_degisti.emit(yeni)

func bayrak_koy(anahtar: String, deger) -> void:
	bayraklar[anahtar] = deger
	bayrak_degisti.emit(anahtar, deger)

func bayrak(anahtar: String, varsayilan = null):
	return bayraklar.get(anahtar, varsayilan)

func kayit_bul(kayit_id: String) -> void:
	if kayit_id not in bulunan_kayitlar:
		bulunan_kayitlar.append(kayit_id)

func durum_sozlugu() -> Dictionary:
	return {
		"kitap": kitap, "kisim": kisim, "fasil": fasil, "bolum": bolum,
		"aktif_pov": aktif_pov,
		"bayraklar": bayraklar,
		"bulunan_kayitlar": bulunan_kayitlar,
		"hatiralar": hatiralar,
		"gelisim": gelisim,
		"oyun_suresi_sn": oyun_suresi_sn,
	}

func durumdan_yukle(d: Dictionary) -> void:
	kitap = d.get("kitap", 1)
	kisim = d.get("kisim", 1)
	fasil = d.get("fasil", 1)
	bolum = d.get("bolum", 1)
	aktif_pov = d.get("aktif_pov", "togan")
	bayraklar = d.get("bayraklar", {})
	bulunan_kayitlar.assign(d.get("bulunan_kayitlar", []))
	hatiralar.assign(d.get("hatiralar", []))
	gelisim = d.get("gelisim", gelisim)
	oyun_suresi_sn = d.get("oyun_suresi_sn", 0.0)
