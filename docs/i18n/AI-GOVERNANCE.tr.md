# Yapay Zekâ Yönetişimi

> İngilizce orijinalin (`AI-GOVERNANCE.md`) çevirisidir; bağlayıcı olan İngilizce sürümdür.

QCR Workbench, isteğe bağlı olarak yapay zekâ modelleri kullanabilir. NIST AI
RMF, ISO/IEC 42001 ve EU AI Act çerçevesinde bu uygulama, üçüncü taraf genel
amaçlı modellerin **dağıtıcısıdır** (deployer), sağlayıcısı değildir: hiçbir
model içermez, hiçbir şey eğitmez ve kullanılan her modeli kullanıcı seçer ve
kimlik bilgileriyle donatır.

## İlkeler (yalnızca politikayla değil, kodda uygulanır)

1. **Matematiği asla yapay zekâ yapmaz.** Her nicel sonuç — FAIR ayrıştırması,
   beklenen kayıp, Monte Carlo istatistikleri, önlem ekonomisi —
   `src/lib/qcr/` içinde deterministik olarak hesaplanır. Yapay zekâ istemleri,
   zaten hesaplanmış rakamları *gömer* (`src/lib/qcr/aiFeatures.js`) ve modele
   sayı uydurmaması veya yeniden hesaplamaması talimatını verir. Bir yapay zekâ
   kesintisi analizde hiçbir şeyi değiştirmez.
2. **Modele giren her şey için döngüde insan.** Yapay zekânın önerdiği kapsam
   varsayımları arayüzde bekletilir ve senaryoya yalnızca kullanıcı her birini
   tek tek kabul ettiğinde girer. Yapay zekâ anlatısı, rapora eklenmiş etiketli
   bir taslaktır; tahminleri, sonuçları veya senaryo kapsamını asla
   değiştirmez.
3. **Şeffaflık ve kaynak kaydı** (EU AI Act Md. 50 deseni). Her yapay zekâ
   çıktısı, açık bir yapay zekâ bildirimi şeridiyle görüntülenir; sağlayıcı,
   model ve zaman damgası, kaydedilen anlatıya damgalanır, arayüzde gösterilir,
   denetim günlüğüne yazılır ve indirilen raporun bildirim bölümüne eklenir.
4. **Bayatlama tespiti.** Anlatı, taslağının oluşturulduğu girdilerin bir
   karmasını (hash) saklar; model veya varsayımlar sonradan değişirse arayüz,
   anlatıyı yeniden taslak oluşturulana kadar bayat olarak işaretler (FAIR
   tahmini düzenlemeleri ise anlatıyı doğrudan siler).
5. **Mimariyle gizlilik.** Yapay zekâ çağrıları, kullanıcının kendi anahtarıyla
   doğrudan tarayıcıdan kullanıcının seçtiği sağlayıcıya gider — vekil sunucu
   yok, aracı yok, günlükleme katmanı yok. Tamamen yerel seçenekler (WebGPU
   üzerinde WebLLM, Chrome yerleşik yapay zekâ, yerel Ollama) birinci sınıftır
   ve tüm içeriği cihaz üstünde tutar. Bkz. `DATA-PRIVACY.md`.
6. **Denetlenebilirlik.** Her yapay zekâ üretimi, sağlayıcıyı adlandıran bir
   `AuditEvent` (kategori `ai`) yazar; böylece bir denetçi, nelerin yapay zekâ
   destekli olduğunu yeniden kurgulayabilir.

## Yapay zekâ ne için kullanılır

| Özellik | Gönderilen girdi | Çıktının ele alınışı |
|---|---|---|
| Yönetici anlatısı taslağı | Senaryo kapsam metni + hesaplanmış rakamlar | Kaynak kaydı + girdi karmasıyla saklanır; bildirimle görüntülenir; rapor dışa aktarımına açık bir bildirim başlığı altında eklenir |
| Varsayım önerileri | Senaryo kapsam metni + mevcut varsayımlar | Bekletilir; her öneri kullanıcının açık kabulünü gerektirir |
| Önlem önerileri | Senaryo kapsam metni + hesaplanmış temel rakamlar + mevcut önlem adları | Bekletilir; bir öneriyi kabul etmek, analistin incelemesi, ayarlaması ve açıkça kaydetmesi için öneriyi önlem formunda önceden doldurulmuş olarak açar (denetim günlüğüne kaydedilir); önlem ekonomisi her zaman kaydedilenden deterministik olarak yeniden hesaplanır |

## Yapay zekâ ne için **kullanılmaz**

- Beş FAIR faktörünü tahmin etmek veya değiştirmek
- Herhangi bir hesaplama, simülasyon veya karşılaştırma
- Otomatik veya zamanlanmış herhangi bir şey — her yapay zekâ çağrısı bir
  kullanıcı tıklamasıdır

## Kullanıcının kabul ettiği artık riskler

- **Model hatası**: anlatılar, hesaplanmış sonuçları yanlış niteleyebilir;
  bildirim şeridi bunu belirtir ve rapor tablolarındaki sayılar bağlayıcı
  olmaya devam eder.
- **Sağlayıcıya maruziyet**: bir bulut sağlayıcısının kullanılması, senaryo
  metnini, kullanıcının o sağlayıcıyla kendi sözleşmesi kapsamında ona
  gönderir. Düzenlemeye tabi içerik için cihaz üstü seçenekler
  kullanılmalıdır.
