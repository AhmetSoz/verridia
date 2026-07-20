# KOPYALA-YAPIŞTIR PROMPT SETİ
Kullanım: Sırayla git. Her kutuyu OLDUĞU GİBİ kopyala → üret. Video için: start frame = BULUT KARESİ (ADIM 2 başında, bir kez üretilir), end frame = o bölgenin görseli, prompt = o bölgenin VİDEO kutusu.

---

## ADIM 1 — ANA HARİTA (parşömen kartografi, İSİMLİ)

**ÖNEMLİ — üretim ayarı:** Format olarak **YATAY** seç (3:2 ya da 16:9). Asla kare üretme.

```
A masterfully drawn fantasy world map on aged parchment, in the exact style of the classic "Westeros and the Free Cities" and "Middle-earth" book maps: fine antique ink linework, mountain ranges drawn as engraved rows of tiny individual peaks, stippled and hatched coastlines, forests drawn as clusters of tiny hand-inked trees, marshes as fine reed strokes, aged paper texture with subtle stains and creases, muted sepia with faded green-grey and rust ink washes, an ornate decorative border frame around the whole map, a large elegant compass rose in the sea, one small inked sea serpent in the southern ocean, and an ornate title cartouche in the upper-left ocean reading "VERRIDIA".

WIDE HORIZONTAL LANDSCAPE COMPOSITION. The continent is VAST and stretches across the whole frame, wider than it is tall, surrounded by open ocean on the west, south and east. TRUE CARTOGRAPHIC SCALE: cities are tiny symbols with small labels; regions are separated by huge stretches of empty steppe, forest and sea; NOTHING is crowded; generous breathing space everywhere.

LAYOUT — follow precisely, north at top:
- Along the ENTIRE top edge of the continent runs a thin glowing golden wall of light drawn as a luminous curtain with fine rays, labeled IŞIK SEDDİ; at its center a slightly brighter gate symbol labeled ŞAFAK KAPISI. Above the wall: blank unmapped fog. Below the wall: a narrow band of empty dead land.
- WEST (left quarter of the continent): a ragged coastline of deep narrow fjords; misty pine forest inland labeled GÖLGE-ÖRTÜ ORMANLARI; on the central west coast a small fortified harbor-city symbol with a lighthouse, labeled METHERIS. This whole western region is labeled in large spaced antique capitals: AETHELİAN HEGEMONYASI.
- A GREAT MOUNTAIN RANGE of engraved peaks runs diagonally from the upper-left of the continent down toward the lower-middle, long and massive, labeled AK-SİPER DAĞLARI; one single pass through it marked with two tiny towers, labeled VALERIUS GEÇİDİ.
- CENTER (the widest, emptiest part of the map): an immense pale steppe labeled in very large spaced capitals SOLGUN BOZKIRLAR. Deep in its heart, far from everything, a small ringed crater symbol with a tiny flame, labeled YILDIZ-ÖRSÜ. Northeast of it, a small ruins symbol with a dome, labeled ESKİ-KENT. In the far north-center, a cluster of jagged black cave-pocked hills labeled DİŞSİZ AĞIZ. South of center, a small grey ash blotch with a black lake, labeled KÜL VAHASI. In the eastern steppe, a small crescent of tiny tents labeled BÜYÜK ORDUGÂH; in the western foothills of the mountains, a small camp symbol labeled KARTAL-YURDU.
- A river labeled SARMAŞAN NEHRİ flows from the mountain glaciers southeast through a deep canyon across the steppe, then fans out into a wide marsh delta filling the SOUTHEAST corner, drawn with fine winding channels and reed marks, labeled RİVAN DELTASI.
- EAST (right edge): a long windswept coastline labeled YETİM KIYILARI, guarded offshore by a thin jagged chain of reefs labeled JİLET RESİFLERİ; on this coast a small shipwreck-city symbol labeled YAMALI LİMAN.
- Faint dotted trade roads: METHERIS to VALERIUS GEÇİDİ to YILDIZ-ÖRSÜ to ESKİ-KENT; and METHERIS north to ŞAFAK KAPISI.

TEXT RULES: Use ONLY the place names given above, spelled EXACTLY as written including Turkish characters; region names in large elegant spaced antique capitals, city names small beside their tiny symbols; no other words, no watermark, no modern typography.

Museum-quality fantasy cartography, extremely fine detail, 8k.
```

**Ürettikten sonra 10 saniyelik kontrol listesi:**
1. Harita yatay mı? 2. Kıta geniş, bölgeler arası bol boşluk var mı? 3. Işık duvarı EN ÜSTTE, kıta boyunca mı? 4. Dağ sırası sol-üstten orta-alta çapraz mı? 5. Metheris batı kıyısında mı? 6. Krater (Yıldız-Örsü) bozkırın ortasında ve KÜÇÜK mü? 7. Delta sağ-alt köşede mi? 8. Yamalı Liman doğu kıyısında mı? 9. İsimler doğru yazılmış mı? 10. Kartuşta "VERRIDIA" var mı?
Bir madde tutmuyorsa şunu ekleyip yeniden üret: "Keep everything the same, but fix: [sorun]."

**Not:** İsimlerde harf bozulursa (Türkçe karakterler bazen bozulur) bana söyle — temiz (yazısız) sürüm üretip isimleri sitede keskin katman olarak bindiririz; animasyon için de zaten yazısız sürüm daha iyi olur.

---

## ADIM 2 — BÖLGE GÖRSELLERİ + VİDEOLAR (16:9)

> ### ⚠️ VİDEO YÖNTEMİ — ZOOM YOK, BULUT GEÇİŞİ VAR
> Bölgeye tıklanınca ekran buluta girer, bulut açılınca bölge görünür. Harita videoda HİÇ yer almaz.
> 1. Önce aşağıdaki BULUT KARESİNİ bir kez üret; bütün videolarda aynı start frame olarak kullanılır.
> 2. Her bölge için: start frame = bulut karesi, end frame = bölge görseli, prompt = o bölgenin VİDEO kutusu.

BULUT KARESİ (bir kez üret, `bulut_start.png` diye sakla):
```
A single frame completely filled edge-to-edge with dense, soft, grey-white volumetric clouds, seen from inside the cloud layer; no ground, no sky, no horizon, no objects, only rolling cloud; cinematic, photorealistic, 8k, no text, no watermark.
```

### 1) YILDIZ-ÖRSÜ (Temürçiler'in krater şehri)
GÖRSEL:
```
Cinematic aerial view descending into a colossal meteor crater in a pale endless steppe at dusk. Inside the crater: a forge-city of dark stone and iron built in concentric rings around a monumental anvil at the center, rivers of orange forge-light and sparks, smoke columns rising into cold blue evening air, crater walls forming a natural fortress with one guarded southern gate, glowing workshops carved into the crater walls, tiny figures of smiths. Epic dark fantasy, Lord of the Rings / Game of Thrones cinematic realism, muted earthy palette, volumetric fog, extremely high detail, 8k, no text, no watermark.
```
VİDEO:
```
Interpolation between the two provided frames. START FRAME: a frame filled edge-to-edge with dense grey-white clouds. END FRAME: a real meteor-crater forge-city at dusk.

RULE — CINEMATIC CLOUD PUNCH-THROUGH: There is NO map in this video. One continuous forward flight: racing through clouds, bursting out of them, diving into the landscape. The landscape already fully exists behind the clouds and is simply REVEALED — nothing is created or formed on screen. The energy is that of an epic film opening: fast, muscular, breathtaking, like an IMAX aerial shot.

TIMELINE:
0.0–1.8s — HIGH-SPEED FLIGHT INSIDE THE CLOUD: the camera races forward through dense volumetric cloud like a diving aircraft; wisps and streamers of cloud WHIP PAST the lens with strong motion blur; several cloud layers rush by at different speeds, creating deep parallax; subtle buffeting; overwhelming sense of speed.
1.8–2.4s — THE BURST: the cloud ahead grows brighter, backlit by the light of the world beyond; the camera PUNCHES THROUGH the final cloud wall in one dramatic instant, shreds of cloud tearing past the edges of the frame.
2.4–5.0s — THE REVEAL: sudden clear air — the landscape opens up below in its full scale as the last cloud shreds whip past the frame edges; the camera continues its dive and gradually eases its speed: high above a real dusk steppe, descending toward the real meteor crater forge-city exactly as in the end frame — concentric stone rings, a monumental burning anvil at the center, sparks and smoke columns rising. Same straight path, same constant speed, gently settling into the end frame.

ABSOLUTELY FORBIDDEN AT ALL TIMES: objects forming or being built on screen; objects appearing or dissolving; particles; explosions; fire spreading; magical light; time-lapse; construction; cuts; cross-fades; the clouds dissolving, melting or fading away instead of being physically FLOWN THROUGH; static hovering; slow drifting pace; jarring random shake.
```

### 2) METHERIS (Hegemonya başkenti)
GÖRSEL:
```
Cinematic aerial view of a grim grey stone capital city built in terraces on black fjord cliffs, permanent sea-mist below; narrow slit windows, thick walls, salt-stained towers; a royal keep carved from the highest rock crowned by a salt-white throne hall; a colossal lighthouse burning cold gold over a naval harbor of dark warships; wooden walkways strung between huge wet pines; rain-heavy sky, one shaft of light on the keep. Epic dark fantasy, Lord of the Rings / Game of Thrones cinematic realism, muted earthy palette, volumetric fog, extremely high detail, 8k, no text, no watermark.
```
VİDEO:
```
Interpolation between the two provided frames. START FRAME: a frame filled edge-to-edge with dense grey-white clouds. END FRAME: a real grey stone harbor city on fjord cliffs in the rain.

RULE — CINEMATIC CLOUD PUNCH-THROUGH: There is NO map in this video. One continuous forward flight: racing through clouds, bursting out of them, diving into the landscape. The landscape already fully exists behind the clouds and is simply REVEALED — nothing is created or formed on screen. The energy is that of an epic film opening: fast, muscular, breathtaking, like an IMAX aerial shot.

TIMELINE:
0.0–1.8s — HIGH-SPEED FLIGHT INSIDE THE CLOUD: the camera races forward through dense volumetric cloud like a diving aircraft; wisps and streamers of cloud WHIP PAST the lens with strong motion blur; several cloud layers rush by at different speeds, creating deep parallax; subtle buffeting; overwhelming sense of speed.
1.8–2.4s — THE BURST: the cloud ahead grows brighter, backlit by the light of the world beyond; the camera PUNCHES THROUGH the final cloud wall in one dramatic instant, shreds of cloud tearing past the edges of the frame.
2.4–5.0s — THE REVEAL: sudden clear air — the landscape opens up below in its full scale as the last cloud shreds whip past the frame edges; the camera continues its dive and gradually eases its speed: descending through drizzle toward black fjord cliffs and a grim grey stone city built in terraces up the rock, exactly as in the end frame — its colossal lighthouse burning cold gold above a naval harbor of dark warships, sea-mist below. Same straight path, same constant speed, gently settling into the end frame.

ABSOLUTELY FORBIDDEN AT ALL TIMES: objects forming or being built on screen; objects appearing or dissolving; particles; explosions; magical light; time-lapse; construction; cuts; cross-fades; the clouds dissolving, melting or fading away instead of being physically FLOWN THROUGH; static hovering; slow drifting pace; jarring random shake.
```

### 3) KARTAL-YURDU (Sungurlar'ın kışlağı)
GÖRSEL:
```
Cinematic view of a steppe-nomad winter settlement in a sheltered mountain-foothill valley at golden dawn: rings of felt tents and low timber halls, herds of goats and steppe horses, smoke from hearth fires; giant eagles with wingspans taller than a man circling above the cliffs, one landing on a warrior's arm on a watch-rock; snow-capped mountain wall behind, endless pale grassland to the east. Epic dark fantasy, Lord of the Rings / Game of Thrones cinematic realism, muted earthy palette, volumetric fog, extremely high detail, 8k, no text, no watermark.
```
VİDEO:
```
Interpolation between the two provided frames. START FRAME: a frame filled edge-to-edge with dense grey-white clouds. END FRAME: a real nomad camp in a mountain-foothill valley at golden dawn.

RULE — CINEMATIC CLOUD PUNCH-THROUGH: There is NO map in this video. One continuous forward flight: racing through clouds, bursting out of them, diving into the landscape. The landscape already fully exists behind the clouds and is simply REVEALED — nothing is created or formed on screen. The energy is that of an epic film opening: fast, muscular, breathtaking, like an IMAX aerial shot.

TIMELINE:
0.0–1.8s — HIGH-SPEED FLIGHT INSIDE THE CLOUD: the camera races forward through dense volumetric cloud like a diving aircraft; wisps and streamers of cloud WHIP PAST the lens with strong motion blur; several cloud layers rush by at different speeds, creating deep parallax; subtle buffeting; overwhelming sense of speed.
1.8–2.4s — THE BURST: the cloud ahead grows brighter, backlit by the light of the world beyond; the camera PUNCHES THROUGH the final cloud wall in one dramatic instant, shreds of cloud tearing past the edges of the frame.
2.4–5.0s — THE REVEAL: sudden clear air — the landscape opens up below in its full scale as the last cloud shreds whip past the frame edges; the camera continues its dive and gradually eases its speed: a sheltered valley at golden dawn, exactly as in the end frame — rings of felt tents and low timber halls, herds of goats and steppe horses, hearth smoke rising, giant eagles circling the cliffs, one gliding close past the camera. Same straight path, same constant speed, gently settling into the end frame.

ABSOLUTELY FORBIDDEN AT ALL TIMES: objects forming or being built on screen; objects appearing or dissolving; particles; explosions; magical light; time-lapse; construction; cuts; cross-fades; the clouds dissolving, melting or fading away instead of being physically FLOWN THROUGH; static hovering; slow drifting pace; jarring random shake.
```

### 4) BÜYÜK ORDUGÂH (Azgutlar'ın savaş kampı)
GÖRSEL:
```
Cinematic aerial of a vast crescent-shaped nomad war-camp on open steppe under a hard noon sun: thousands of hide tents around a monumental central war-tent of black bison leather, bone-and-horn totems, corrals of huge armored steppe bison, dust clouds of returning raider cavalry, cook-fires, wrestling circles, grass trampled to red-brown earth for a mile around, heat shimmer, crude black bison banners. Epic dark fantasy, Lord of the Rings / Game of Thrones cinematic realism, muted earthy palette, extremely high detail, 8k, no text, no watermark.
```
VİDEO:
```
Interpolation between the two provided frames. START FRAME: a frame filled edge-to-edge with dense grey-white clouds. END FRAME: a real vast nomad war-camp on the steppe at harsh noon.

RULE — CINEMATIC CLOUD PUNCH-THROUGH: There is NO map in this video. One continuous forward flight: racing through clouds, bursting out of them, diving into the landscape. The landscape already fully exists behind the clouds and is simply REVEALED — nothing is created or formed on screen. The energy is that of an epic film opening: fast, muscular, breathtaking, like an IMAX aerial shot.

TIMELINE:
0.0–1.8s — HIGH-SPEED FLIGHT INSIDE THE CLOUD: the camera races forward through dense volumetric cloud like a diving aircraft; wisps and streamers of cloud WHIP PAST the lens with strong motion blur; several cloud layers rush by at different speeds, creating deep parallax; subtle buffeting; overwhelming sense of speed.
1.8–2.4s — THE BURST: the cloud ahead grows brighter, backlit by the light of the world beyond; the camera PUNCHES THROUGH the final cloud wall in one dramatic instant, shreds of cloud tearing past the edges of the frame.
2.4–5.0s — THE REVEAL: sudden clear air — the landscape opens up below in its full scale as the last cloud shreds whip past the frame edges; the camera continues its dive and gradually eases its speed under a harsh noon sun, exactly as in the end frame: a vast crescent-shaped war-camp of thousands of hide tents around a monumental black war-tent, corrals of huge armored bison, a column of raider cavalry returning in a long dust cloud, banners in the wind. Same straight path, same constant speed, gently settling into the end frame.

ABSOLUTELY FORBIDDEN AT ALL TIMES: objects forming or being built on screen; objects appearing or dissolving; particles; explosions; magical light; time-lapse; construction; cuts; cross-fades; the clouds dissolving, melting or fading away instead of being physically FLOWN THROUGH; static hovering; slow drifting pace; jarring random shake.
```

### 5) ESKİ-KENT (Mirasçılar'ın harabe şehri)
GÖRSEL:
```
Cinematic view of a half-buried ancient ruined city on the steppe in late afternoon amber light: broken glass-and-metal towers of a lost civilization jutting like ribs from the earth, streets carved with unreadable geometric symbols, at its heart one intact structure — a great dark library sealed in resin-black stone with faint white fungus-light glowing along its base; small robed archivist figures on the steps; dust motes, profound silence. Epic dark fantasy, Lord of the Rings / Game of Thrones cinematic realism, muted earthy palette, extremely high detail, 8k, no text, no watermark.
```
VİDEO:
```
Interpolation between the two provided frames. START FRAME: a frame filled edge-to-edge with dense grey-white clouds. END FRAME: a real half-buried ancient ruined city in amber afternoon light.

RULE — CINEMATIC CLOUD PUNCH-THROUGH: There is NO map in this video. One continuous forward flight: racing through clouds, bursting out of them, diving into the landscape. The landscape already fully exists behind the clouds and is simply REVEALED — nothing is created or formed on screen. The energy is that of an epic film opening: fast, muscular, breathtaking, like an IMAX aerial shot.

TIMELINE:
0.0–1.8s — HIGH-SPEED FLIGHT INSIDE THE CLOUD: the camera races forward through dense volumetric cloud like a diving aircraft; wisps and streamers of cloud WHIP PAST the lens with strong motion blur; several cloud layers rush by at different speeds, creating deep parallax; subtle buffeting; overwhelming sense of speed.
1.8–2.4s — THE BURST: the cloud ahead grows brighter, backlit by the light of the world beyond; the camera PUNCHES THROUGH the final cloud wall in one dramatic instant, shreds of cloud tearing past the edges of the frame.
2.4–5.0s — THE REVEAL: sudden clear air — the landscape opens up below in its full scale as the last cloud shreds whip past the frame edges; the camera continues its dive and gradually eases its speed in amber late-afternoon light, exactly as in the end frame: a half-buried ancient city, broken glass-and-metal towers jutting like ribs from the earth, and at its heart one intact dark library sealed in resin-black stone, faint white fungus-light along its base, small robed figures on the steps. Same straight path, same constant speed, gently settling into the end frame.

ABSOLUTELY FORBIDDEN AT ALL TIMES: objects forming or being built on screen; objects appearing or dissolving; particles; explosions; magical light; time-lapse; construction; cuts; cross-fades; the clouds dissolving, melting or fading away instead of being physically FLOWN THROUGH; static hovering; slow drifting pace; jarring random shake.
```

### 6) SAZLIK TAHT (Rivan Deltası'nın ağaç sarayları)
GÖRSEL:
```
Cinematic view gliding low over a vast green-brown marsh delta in humid morning light: thousands of winding water channels between mangrove roots, floating reed markets, stilt villages; at the center, palaces grown into the trunks of colossal living swamp trees, walkways spiraling their bark, alchemical lanterns glowing poison-green and silver; mist curling over black water, a silent narrow boat with a hooded figure; dense, dripping, beautiful and sinister. Epic dark fantasy, Lord of the Rings / Game of Thrones cinematic realism, muted earthy palette, volumetric fog, extremely high detail, 8k, no text, no watermark.
```
VİDEO:
```
Interpolation between the two provided frames. START FRAME: a frame filled edge-to-edge with dense grey-white clouds. END FRAME: a real misty marsh delta with palaces grown into colossal living trees.

RULE — CINEMATIC CLOUD PUNCH-THROUGH: There is NO map in this video. One continuous forward flight: racing through clouds, bursting out of them, diving into the landscape. The landscape already fully exists behind the clouds and is simply REVEALED — nothing is created or formed on screen. The energy is that of an epic film opening: fast, muscular, breathtaking, like an IMAX aerial shot.

TIMELINE:
0.0–1.8s — HIGH-SPEED FLIGHT INSIDE THE CLOUD: the camera races forward through dense volumetric cloud like a diving aircraft; wisps and streamers of cloud WHIP PAST the lens with strong motion blur; several cloud layers rush by at different speeds, creating deep parallax; subtle buffeting; overwhelming sense of speed.
1.8–2.4s — THE BURST: the cloud ahead grows brighter, backlit by the light of the world beyond; the camera PUNCHES THROUGH the final cloud wall in one dramatic instant, shreds of cloud tearing past the edges of the frame.
2.4–5.0s — THE REVEAL: sudden clear air — the landscape opens up below in its full scale as the last cloud shreds whip past the frame edges; the camera continues its dive and gradually eases its speed in damp morning light, exactly as in the end frame: skimming low over thousands of winding black-water channels between mangrove roots, past floating reed markets and stilt villages, toward colossal living swamp trees with palaces grown into their trunks, walkways spiraling the bark, alchemical lanterns glowing poison-green and silver in the fog. Same gently descending path, same constant speed, settling into the end frame.

ABSOLUTELY FORBIDDEN AT ALL TIMES: objects forming or being built on screen; objects appearing or dissolving; particles; explosions; magical light beyond the steady lantern glow; time-lapse; construction; cuts; cross-fades; the clouds dissolving, melting or fading away instead of being physically FLOWN THROUGH; static hovering; slow drifting pace; jarring random shake.
```

### 7) YAMALI LİMAN (Korsanların enkaz şehri)
GÖRSEL:
```
Cinematic view of a pirate harbor city built entirely from stacked shipwrecks: hulls become houses, masts become bridges, sails become roofs, tar and rust everywhere; crooked taverns leaning over muddy tide-flats; beyond the harbor a line of razor reefs shredding the sea into white foam; storm light, screaming gulls, lawless lanterns beginning to glow at dusk; in the bay a half-sunken ancient war galleon converted into a throne-fortress. Epic dark fantasy, Lord of the Rings / Game of Thrones cinematic realism, muted earthy palette, extremely high detail, 8k, no text, no watermark.
```
VİDEO:
```
Interpolation between the two provided frames. START FRAME: a frame filled edge-to-edge with dense grey-white clouds. END FRAME: a real harbor city built of stacked shipwrecks at storm-lit dusk.

RULE — CINEMATIC CLOUD PUNCH-THROUGH: There is NO map in this video. One continuous forward flight: racing through clouds, bursting out of them, diving into the landscape. The landscape already fully exists behind the clouds and is simply REVEALED — nothing is created or formed on screen. The energy is that of an epic film opening: fast, muscular, breathtaking, like an IMAX aerial shot.

TIMELINE:
0.0–1.8s — HIGH-SPEED FLIGHT INSIDE THE CLOUD: the camera races forward through dense volumetric cloud like a diving aircraft; wisps and streamers of cloud WHIP PAST the lens with strong motion blur; several cloud layers rush by at different speeds, creating deep parallax; subtle buffeting; overwhelming sense of speed.
1.8–2.4s — THE BURST: the cloud ahead grows brighter, backlit by the light of the world beyond; the camera PUNCHES THROUGH the final cloud wall in one dramatic instant, shreds of cloud tearing past the edges of the frame.
2.4–5.0s — THE REVEAL: sudden clear air — the landscape opens up below in its full scale as the last cloud shreds whip past the frame edges; the camera continues its dive and gradually eases its speed at storm-lit dusk, exactly as in the end frame: white foam exploding on razor reefs, and beyond them a harbor city built entirely of stacked shipwrecks — hulls as houses, masts as bridges, sails as roofs — lanterns flickering on, and in the bay a half-sunken ancient war galleon fortress. Same descending path over the reef gap, same constant speed, settling into the end frame.

ABSOLUTELY FORBIDDEN AT ALL TIMES: objects forming or being built on screen; objects appearing or dissolving; particles; explosions; magical light; time-lapse; construction; cuts; cross-fades; the clouds dissolving, melting or fading away instead of being physically FLOWN THROUGH; static hovering; slow drifting pace; jarring random shake.
```

### 8) VALERIUS GEÇİDİ ve DERİN-YUVA (Granit Klanları'nın dağ şehri)
GÖRSEL:
```
Cinematic view inside a colossal mountain pass between snow-capped granite walls: an ancient road littered with rusted spearheads and arrows from an old war, wind singing through the metal; carved into the living rock face a monumental stone gate with warm hearth-light glowing from window-slits and smoke vents high in the cliff — a hidden city inside the mountain; fur-clad guards on ledges; late cold light, a distant avalanche plume. Epic dark fantasy, Lord of the Rings / Game of Thrones cinematic realism, muted earthy palette, extremely high detail, 8k, no text, no watermark.
```
VİDEO:
```
Interpolation between the two provided frames. START FRAME: a frame filled edge-to-edge with dense grey-white clouds. END FRAME: a real colossal mountain pass with a monumental gate carved into the cliff.

RULE — CINEMATIC CLOUD PUNCH-THROUGH: There is NO map in this video. One continuous forward flight: racing through clouds, bursting out of them, diving into the landscape. The landscape already fully exists behind the clouds and is simply REVEALED — nothing is created or formed on screen. The energy is that of an epic film opening: fast, muscular, breathtaking, like an IMAX aerial shot.

TIMELINE:
0.0–1.8s — HIGH-SPEED FLIGHT INSIDE THE CLOUD: the camera races forward through dense volumetric cloud like a diving aircraft; wisps and streamers of cloud WHIP PAST the lens with strong motion blur; several cloud layers rush by at different speeds, creating deep parallax; subtle buffeting; overwhelming sense of speed.
1.8–2.4s — THE BURST: the cloud ahead grows brighter, backlit by the light of the world beyond; the camera PUNCHES THROUGH the final cloud wall in one dramatic instant, shreds of cloud tearing past the edges of the frame.
2.4–5.0s — THE REVEAL: sudden clear air — the landscape opens up below in its full scale as the last cloud shreds whip past the frame edges; the camera continues its dive and gradually eases its speed in late cold light, exactly as in the end frame: snow-capped granite walls closing in on both sides of a colossal pass, an ancient road littered with rusted spearheads below, and ahead a monumental stone gate carved into the living cliff face, warm hearth-light glowing from window-slits high in the rock, fur-clad guards small on the ledges. Same descending path between the walls, same constant speed, settling into the end frame.

ABSOLUTELY FORBIDDEN AT ALL TIMES: objects forming or being built on screen; objects appearing or dissolving; particles; explosions; magical light; time-lapse; construction; cuts; cross-fades; the clouds dissolving, melting or fading away instead of being physically FLOWN THROUGH; static hovering; slow drifting pace; jarring random shake.
```

### 9) IŞIK SEDDİ ve ŞAFAK KAPISI (kuzeydeki ışık duvarı)
GÖRSEL:
```
Cinematic wide shot at the end of the world: a dead colorless plain under low grey sky, dotted with small nameless standing stones, leading to a wall of golden-white light rising from the earth into the clouds, immaterial yet impassable, stretching horizon to horizon; at its center a brighter colossal gate-shaped silhouette with slowly moving unreadable geometric symbols; one tiny lone rider with an eagle overhead, dwarfed to insignificance; awe, dread, absolute silence. Epic dark fantasy, Lord of the Rings / Game of Thrones cinematic realism, muted palette with one golden-white light accent, extremely high detail, 8k, no text, no watermark.
```
VİDEO:
```
Interpolation between the two provided frames. START FRAME: a frame filled edge-to-edge with dense grey-white clouds. END FRAME: a real dead plain before a horizon-wide wall of golden-white light with a colossal gate.

RULE — CINEMATIC CLOUD PUNCH-THROUGH: There is NO map in this video. One continuous forward flight: racing through clouds, bursting out of them, diving into the landscape. The landscape already fully exists behind the clouds and is simply REVEALED — nothing is created or formed on screen. The energy is that of an epic film opening: fast, muscular, breathtaking, like an IMAX aerial shot.

TIMELINE:
0.0–1.8s — HIGH-SPEED FLIGHT INSIDE THE CLOUD: the camera races forward through dense volumetric cloud like a diving aircraft; wisps and streamers of cloud WHIP PAST the lens with strong motion blur; several cloud layers rush by at different speeds, creating deep parallax; subtle buffeting; overwhelming sense of speed.
1.8–2.4s — THE BURST: the cloud ahead grows brighter, backlit by the light of the world beyond; the camera PUNCHES THROUGH the final cloud wall in one dramatic instant, shreds of cloud tearing past the edges of the frame.
2.4–5.0s — THE REVEAL: sudden clear air — the landscape opens up below in its full scale as the last cloud shreds whip past the frame edges; the camera continues its dive and gradually eases its speed, exactly as in the end frame: a dead colorless plain under a heavy sky, small nameless standing stones sliding past below, and ahead the WALL OF GOLDEN-WHITE LIGHT rising from the earth into the clouds, stretching horizon to horizon, its colossal gate-shaped silhouette shimmering with slowly moving geometric symbols; one tiny lone rider with an eagle overhead approaching, dwarfed to insignificance. Same straight path, same constant speed, settling into the end frame.

ABSOLUTELY FORBIDDEN AT ALL TIMES: objects forming or being built on screen; objects appearing or dissolving; particles; explosions; magical effects beyond the wall's steady glow; time-lapse; construction; cuts; cross-fades; the clouds dissolving, melting or fading away instead of being physically FLOWN THROUGH; static hovering; slow drifting pace; jarring random shake.
```

---

## ADIM 3 — BONUS ATMOSFER KARELERİ (istersen)

### KIZIL HAFTA (kıyamet hasadı)
```
A colossal blood-red moon over a black ocean vomiting crimson kelp onto a burning coastline at night; silhouettes of desperate harvest crews with torches and monstrous shapes rising in the surf; red light on wet rocks. Epic dark fantasy, Lord of the Rings / Game of Thrones cinematic realism, extremely high detail, 8k, no text, no watermark.
```

### KÜL VAHASI (lanetli vadi)
```
A dead grey ash valley on a steppe, skeletal bent trees, a black glassy lake reflecting nothing, absolute stillness, faint sickly shimmer on the water, no birds, no wind. Epic dark fantasy, cinematic realism, extremely high detail, 8k, no text, no watermark.
```

### FISILTI YOLU (sisli ölüm geçidi)
```
A narrow sea passage between razor-sharp black reef teeth, walled in by solid fog, ghost-light diffusing through the mist, the faint suggestion of a wrong-shaped ship deep in the fog, oily calm water. Epic dark fantasy, cinematic realism, extremely high detail, 8k, no text, no watermark.
```
