// utils/notificationHelper.js

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Bildirimler uygulama açıkken nasıl görünsün?
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // <-- Yeni: Banner olarak göster
    shouldShowList: true,   // <-- Yeni: Listede göster
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Push Token alma fonksiyonu
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    // Android için kanal ayarı (zorunlu)
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    // 1. Mevcut izin durumunu kontrol et
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. İzin yoksa, kullanıcıdan iste
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 3. Kullanıcı hala izin vermediyse, işlemi durdur
    if (finalStatus !== 'granted') {
      console.log('Bildirim izni verilmedi!');
      return;
    }

    // 4. İzin varsa, Expo'dan Push Token'ı al
    // projectId'yi otomatik olarak app.json'dan almaya çalışır
    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
             // Eğer projectId bulunamazsa (geliştirme ortamında bazen olur), boş bırakmayı deneyelim
             // veya manuel olarak app.json'dan alıp buraya string olarak yazabilirsin.
             // console.warn('Project ID bulunamadı, token alma işlemi eksik olabilir.');
        }
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('🔥 EXPO PUSH TOKEN ALINDI:', token);
    } catch (e) {
        console.error('Token alınırken hata oluştu:', e);
    }

  } else {
    console.log('Fiziksel bir cihaz kullanmalısınız. Simülatörde push bildirimleri çalışmaz.');
  }

  return token;
}