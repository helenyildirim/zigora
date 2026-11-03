# Zigora

Sade ve modern bir ok bulmaca oyunu. Oklara doğru sırayla dokun, tahtayı temizle.

- Expo, React Native, TypeScript, Expo Router, Zustand ve react-native-svg ile yapıldı.
- 350 şekilli bölüm içerir. Her bölümün kazanılabildiği `npm run verify` ile doğrulanır.
- Tek kural var: önü açık oku çıkar, tüm okları temizle.
- İpucu bitince ödüllü reklam izleyen oyuncunun ipuçları yenilenir. Şu an Google'ın test reklamları kullanılıyor.

## Çalıştırma

```bash
npm install
npx expo start
```

## Komutlar

| Komut | Görevi |
| --- | --- |
| `npm run levels` | Bölümleri yeniden üretir |
| `npm run verify` | Tüm bölümlerin çözülebildiğini kontrol eder |

## Klasörler

- `src/app`: ekranlar
- `src/components`: tahta, oklar ve arayüz parçaları
- `src/engine`: oyun kuralları ve bölüm üretici
- `src/hooks`: oyun durumu
- `src/store`: kayıtlı ilerleme
