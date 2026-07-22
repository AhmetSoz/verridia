# Dövüş Teknik Belgesi (v0.1 — prototip başlangıç değerleri)

Bu değerler `scripts/movement/player_togan.gd` içinde `@export` olarak yaşar;
kaynak-of-truth koddur, bu belge niyeti açıklar. İlk prototipte elle ayarlanacaktır.

## His hedefleri
- 60 FPS sabit. Girdi anında karşılık bulur; "ağır karakter" = animasyon ağırlığı, girdi gecikmesi DEĞİL.
- Girdi tamponu ~140 ms (saldırı/kaçınma meşgulken hatırlanır, biter bitmez bağlanır).
- Coyote time ~100 ms · zıplama tamponu ~115 ms · değişken zıplama (erken bırakış %55 keser).
- Kaçınma 0.35 s; dokunulmazlık 0.04–0.20 s aralığı (~160 ms). Kaçınma **Denge harcamaz**.
- Parry penceresi 120 ms (hikâye modunda genişletilebilir); toparlanma 220 ms.
- Büyük darbede 40–90 ms hit-stop (başarılı parry: 70 ms).

## Üç gösterge
- **Can** — normal sağlık.
- **Denge** — savunma/ağır darbe azaltır; sıfırlanınca sendeleme, yarımdan toparlar.
  Yenilenme: son darbeden 1.2 s sonra, 12/s.
- **İrade** — parry (+25), riskli oyun ile dolar; özel yeteneklerde harcanır.
- Normal saldırılarda stamina YOK (bekleme simülatörü yasak).

## Saldırılar (Togan v0)
| Saldırı | Hazırlık | Aktif | Toparlanma | Hasar | Denge hasarı |
|---|---|---|---|---|---|
| Hafif (3'lü kombo) | 80 ms | 100 ms | 160 ms | 10 (+%15/adım) | 8 |
| Ağır | 220 ms | 120 ms | 300 ms | 24 | 22 |

- Kombo zinciri ve kaçınma-sonrası saldırı girdi tamponundan bağlanır.
- Parry başarısı: hasar 0, İrade +25, saldıran `parrylendi()` → denge kırılır (bitiriş fırsatı).

## Vuruş kuralları
- Rastgele isabet yüzdesi yok — temas eden silah vurur (Hitbox/Hurtbox Area2D, katman 4).
- Zırha yanlış saldırı düşük hasar (ileride zırh tipi çarpanı).
- Kritik = pozisyon veya parry sonucu; asla saf rastgelelik değil.

## Düşman okunabilirliği
- Her saldırı telegraflı (dummy: 550 ms sarı hazırlık → kırmızı aktif).
- Denge kırılan düşman mavi renkte sendeler → bitiriş/etkisizleştirme penceresi.
- İnsanlar teslim olabilir/etkisizleştirilebilir; yaratıklar olmaz (plan §7).

## Test ölçütleri (dövüş laboratuvarı çıkış şartı)
- [ ] Parry penceresi adil hissediyor (dummy telegrafına %80+ başarı öğrenilebilir)
- [ ] Kaçınma i-frame'i güvenilir (aktif saldırı içinden geçilebiliyor)
- [ ] Kombo tamponu "yutmuyor" (arka arkaya J-J-J daima 3'lü zincir)
- [ ] Coyote + zıplama tamponu platform hatasını affediyor
- [ ] Ölüm → yeniden deneme < 3 sn
