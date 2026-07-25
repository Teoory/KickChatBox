# Kick Chat Box

Kick.com sohbet mesajlarını OBS içinde HTML overlay olarak göstermek için hazırlanmış tek sayfalık bir uygulama. Uygulama iki parçadan oluşur:

- `index.html`: Arayüz ve mesaj render katmanı
- `server.js`: Render üzerinde çalışan küçük HTTP + WebSocket relay sunucusu

## Canlı adresler

Deploy aldıktan sonra şu adresler kullanılmalı:

- Uygulama / OBS URL: `https://kickchatbox.onrender.com/`
- OAuth callback URL: `https://kickchatbox.onrender.com/auth/callback`
- Webhook URL: `https://kickchatbox.onrender.com/webhook`
- WebSocket Relay URL: `wss://kickchatbox.onrender.com`

Yerelde çalıştırırken ise:

- Uygulama / OBS URL: `http://localhost:8787/`
- Webhook URL: `http://localhost:8787/webhook`
- WebSocket Relay URL: `ws://localhost:8787`

## Kick Developer ayarları

Kick panelinde `Uygulamanız` > `Düzenle` ekranında aşağıdaki alanları doldur:

- `İstemci Kimliği (Client ID)`: Kick Developer panelindeki Client ID
- `İstemci Parolası (Client Secret)`: Sadece server-side token exchange yapıyorsan gerekir. Bu projede tarayıcıdan giriş deneniyor; mümkünse gerçek üretim akışında secret'ı frontend'de tutma.
- `URL Yönlendirme`: `https://kickchatbox.onrender.com/auth/callback`
- `Web kanallarını etkinleştirin (webhooks)`: Açık olmalı
- `Webhook URL`: `https://kickchatbox.onrender.com/webhook`

Scope tarafında en az şu izinler olmalı:

- `events:subscribe`
- `channel:read`

İstersen chat yazma veya başka API'ler için ekstra scope ekleyebilirsin.

## Render ayarı

Render tarafında uygulama şu şekilde çalışmalı:

- Build komutu: `npm install`
- Start komutu: `npm start`
- Node sürümü: Render varsayılanı yeterli, ama istersen `package.json` içine engine ekleyebilirsin

Render loglarında artık public adresi görürsün. Örneğin:

- `Kick Chat Box running at https://kickchatbox.onrender.com`
- `Webhook endpoint: https://kickchatbox.onrender.com/webhook`
- `WebSocket relay: wss://kickchatbox.onrender.com`

## OBS'de nasıl kullanılır

OBS içinde bir Browser Source ekle ve şu adresi ver:

- `https://kickchatbox.onrender.com/`

Arka plan zaten overlay görünümünde hazır. İstersen OBS içinde daha şeffaf ve kompakt gösterim için CSS'i sonra daraltabiliriz.

## Neden "bağlanmadı" görünüyor?

Bu uygulamanın Kick mesajlarını göstermesi için sadece web sayfası yetmez. Akış şöyle çalışır:

1. Kick webhooks, public HTTPS bir adrese POST atar.
2. Bu proje `POST /webhook` endpoint'inde bu payload'ı alır.
3. Aynı sunucu WebSocket ile overlay sayfasına mesajı aktarır.
4. Overlay sayfası mesajı HTML olarak çizilir.

Bağlantı kurulmadı görünüyorsa en yaygın nedenler:

- Kick webhook URL'si Render adresine değil localhost'a yazılmıştır.
- Kick panelinde webhook toggle kapalıdır.
- `URL Yönlendirme` alanı Render callback yolu ile birebir eşleşmiyordur.
- Render free instance uykuya geçtiği için ilk istek gecikmiştir.
- OBS sayfası `file://` üzerinden açılmıştır; mutlaka `https://kickchatbox.onrender.com/` kullanılmalıdır.

## Yerelde test

Projeyi yerelde çalıştırmak için:

```bash
npm install
npm start
```

Sonra tarayıcıda aç:

```text
http://localhost:8787/
```

Test etmek için terminalden örnek webhook gönderebilirsin:

```powershell
@'
{
  "message_id": "01TESTMESSAGE0000000000002",
  "eventType": "chat.message.sent",
  "content": "Merhaba! Bu mesaj relay üzerinden geldi.",
  "created_at": "2026-07-25T18:22:00Z",
  "sender": {
    "username": "teObot",
    "profile_picture": "",
    "identity": {
      "username_color": "#7df0d0",
      "badges": [
        {"text": "Bot", "type": "bot"},
        {"text": "Mod", "type": "moderator"}
      ]
    }
  }
}
'@ | Invoke-RestMethod -Method Post -Uri http://localhost:8787/webhook -ContentType 'application/json'
```

Bu istek overlay'de yeni bir mesaj kartı üretmeli.

## Not

Kick webhook'ları public HTTPS ister. Sadece Render deploy'u yapmak yeterli olmayabilir; Kick panelindeki webhook alanı, Render servisinin public adresine işaret etmelidir. GET ile `/webhook` açınca artık açıklama sayfası görürsün; gerçek veri POST ile gelir.

Eğer istersen bir sonraki adımda bunu iki ayrı moda da ayırabilirim:

- yalnızca OBS overlay modu
- Kick webhook alanına uygun üretim modu
