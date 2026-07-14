# Veri Gizliliği

> İngilizce orijinalin (`DATA-PRIVACY.md`) çevirisidir; bağlayıcı olan İngilizce sürümdür.

QCR Workbench, **risk verilerinizin siz bir işlem yapmadan cihazınızdan
ayrılamayacağı** şekilde tasarlanmıştır. Bu belge, verilerin nerede
bulunduğunun ve izleyebileceği her yolun eksiksiz envanteridir.

## Veriler nerede bulunur

| Veri | Konum | Koruma |
|---|---|---|
| Projeler, senaryolar, tahminler, önlemler, denetim izi | Tarayıcı IndexedDB | AES-GCM-256, anahtar parolanızdan türetilir (PBKDF2-SHA-256, 250.000 yineleme, rastgele salt) |
| Yapay zekâ API anahtarları dâhil uygulama ayarları | Aynı şifreli depo (`AppSettings` kaydı) | Aynı şifreleme; asla localStorage'da veya düz metin olarak değil |
| Depo kayıt defteri (çalışma alanı adları, isteğe bağlı ipuçları) | localStorage | Tasarım gereği gizli değildir; **hiçbir** parola ve **hiçbir** risk verisi içermez |
| Tema, dilden bağımsız arayüz tercihleri, otomatik kilit dakikaları | localStorage | Gizli değildir; kasa açılmadan önce gereklidir |
| İsteğe bağlı kilit ekranı e-postası | localStorage | **Yalnızca** "kilit ekranında göster" seçeneğini etkinleştirirseniz yazılır; devre dışı bırakıldığında silinir |

Türetilen şifreleme anahtarı, yalnızca kasa açıkken ve yalnızca bellekte
bulunur. Kasanın kilitlenmesi (elle veya otomatik kilitle) anahtarı yok eder.
**Unutulan bir parola kurtarılamaz** — sıfırlama yoktur, kurtarma e-postası
yoktur, yardımcı olabilecek bir satıcı yoktur. Yedek dışa aktarın.

## Tüm ağ yolları, eksiksiz olarak

Uygulama kendi başına **sıfır** istek yapar. Aşağıdakilerin tümü kullanıcı
tarafından başlatılır:

1. **Bulut yapay zekâ çağrıları** (isteğe bağlı): bir yapay zekâ eylemine
   tıkladığınızda, istem — senaryo adları, açıklamalar, varsayımlar ve zaten
   hesaplanmış rakamlar — kendi anahtarınızla kimliği doğrulanarak
   **doğrudan tarayıcınızdan yapılandırdığınız sağlayıcıya** gider
   (Anthropic, OpenAI, Google veya Alibaba). Vekil sunucu yoktur. Bunu bile
   kendi makinenizde tutmak için cihaz üstü yapay zekâyı (WebLLM veya Chrome
   yerleşik) ya da yerel Ollama'yı kullanın.
2. **Cihaz üstü model indirme** (isteğe bağlı, bir kez): WebLLM'in
   etkinleştirilmesi, nicemlenmiş model ağırlıklarını herkese açık CDN'inden
   indirir; tarayıcı bunları önbelleğe alır.
3. **Google Fonts**: iki arayüz yazı tipi Google'ın CDN'inden yüklenir.
4. **Başka hiçbir şey.** Telemetri yok, analitik yok, hata raporlama yok,
   güncelleme sinyali yok, birinci taraf API yok.

## Yedekler ve dışa aktarmalar

- **Şifreli yedek** (önerilir): seçtiğiniz bir parolayla şifrelenmiş bir JSON
  dosyası (aynı PBKDF2 + AES-GCM şeması). Her yerde saklanması güvenlidir.
- **Şifresiz yedek** (isteğe bağlı, uyarılır): kayıtlı API anahtarları dâhil
  her şeyin düz metin JSON'u. Yalnızca unutulan bir parolaya karşı son çare
  bir güvence olarak sunulur. Bir parola dosyası gibi ele alın.
- **Rapor (.md), denetim günlüğü (.txt/.doc)**: doğası gereği düz metindir —
  dışa aktarmanın amacı zaten budur. Bilinçli olarak paylaşın.

## Sizin sorumluluklarınız

- Güçlü bir parola seçin; güvenlik sınırının tamamı odur.
- Senaryolarınız düzenlemeye tabi veya gizlilik dereceli bilgiler içeriyorsa,
  cihaz üstü yapay zekâyı ya da hiç yapay zekâ kullanmamayı tercih edin ve dışa
  aktarmaları buna göre ele alın.
- Ortak kullanılan makinelerde otomatik kilidi kullanın (Ayarlar → Güvenlik)
  ve başından ayrılırken kasayı kilitleyin.

Güvenlik mühendisliği ayrıntıları (CSP, kripto parametreleri, düzenleyici
çerçeve) için `SECURITY.md` dosyasına bakın.
