# Voice/MP3 Debug Steps

## 1. Check Prerequisites
```
console.log('Channel ID:', useChannelStore().currentChannelId)
console.log('Token:', !!useUserStore().token)
```
**Must have**: Channel selected + token present.

## 2. Test in MessageList.vue (apply fix below)

## 3. Browser Network Tab
- Send voice/mp3 → Filter `/messages/create`
- Check **Status** (401? 422? 500?), **Request Headers** (token?), **Payload** (FormData)

## 4. Laravel Logs
```
tail -f storage/logs/laravel.log
```

## 5. Postman Test
```
POST http://178.104.58.236/api/messages/create
Headers: token: YOUR_TOKEN
FormData:
  - channel_id: your-channel-id
  - message: "test voice"
  - file: (select mp3 file)
```

