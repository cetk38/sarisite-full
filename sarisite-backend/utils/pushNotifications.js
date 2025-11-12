// utils/pushNotifications.js
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

const sendPushNotification = async (pushToken, title, body, data = {}) => {
  // Token geçerli bir Expo token'ı mı kontrol et
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token geçersiz: ${pushToken}`);
    return;
  }

  const messages = [{
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data, // Bildirime tıklandığında uygulamaya gönderilecek ekstra veri (örn: ilan ID'si)
  }];

  try {
    // Expo'ya gönder
    const ticketChunk = await expo.sendPushNotificationsAsync(messages);
    console.log('Bildirim bileti alındı:', ticketChunk);
    // Not: Gerçek hayatta bu 'ticket'ları takip edip ulaşıp ulaşmadığını kontrol etmek gerekir
    // ama şimdilik bu kadarı yeterli.
  } catch (error) {
    console.error('Bildirim gönderilirken hata:', error);
  }
};

module.exports = { sendPushNotification };