import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // İkonlar için
import theme from './theme'; // Tema için

// --- TÜM EKRANLARI İMPORT EDELİM ---
import HomeScreen from './screens/HomeScreen';
import AddAdScreen from './screens/AddAdScreen';
import AdminScreen from './screens/AdminScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdListScreen from './screens/AdListScreen';
import SubCategoryScreen from './screens/SubCategoryScreen';
import VerificationPendingScreen from './screens/VerificationPendingScreen';
import DetailScreen from './screens/DetailScreen';
import ChatScreen from './screens/ChatScreen';
import SelectionScreen from './screens/SelectionScreen';

// Profil Alt Ekranları
import PublishedAdsScreen from './screens/profile/PublishedAdsScreen';
import UnpublishedAdsScreen from './screens/profile/UnpublishedAdsScreen';
import MessagesScreen from './screens/profile/MessagesScreen';
import NotificationsScreen from './screens/profile/NotificationsScreen';
import FavoriteAdsScreen from './screens/profile/FavoriteAdsScreen';
import FavoriteSearchesScreen from './screens/profile/FavoriteSearchesScreen';
import AccountInfoScreen from './screens/profile/AccountInfoScreen';
import PhoneNumberScreen from './screens/profile/PhoneNumberScreen';
import SettingsScreen from './screens/profile/SettingsScreen';
import EditAdScreen from './screens/profile/EditAdScreen';
import ManageAllAdsScreen from './screens/admin/ManageAllAdsScreen'; // <-- YENİ BUNU EKLE
import { registerForPushNotificationsAsync } from './utils/notificationHelper'; // <-- YENİ
import { post } from './utils/api'; // <-- post'u ekle

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- YENİ YAPI: HER SEKMEYE ÖZEL BİR STACK OLUŞTURALIM ---

// ANA SAYFA sekmesinin kendi iç navigasyonu (Ana Sayfa -> Alt Kategori -> Seçim Sihirbazı -> İlan Listesi -> İlan Detayı -> Sohbet)
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
      <Stack.Screen name="SubCategory" component={SubCategoryScreen} />
      <Stack.Screen name="SelectionScreen" component={SelectionScreen} />
      <Stack.Screen name="AdList" component={AdListScreen} />
      <Stack.Screen name="DetailScreen" component={DetailScreen} options={{ title: 'İlan Detayı' }} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
}

// İLAN VER sekmesinin kendi iç navigasyonu (İlan Verme Sihirbazı -> Seçim Sihirbazı)
function AddAdStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AddAdScreen" component={AddAdScreen} options={{ title: 'İlan Ver' }} />
      {/* İlan verme içinden de Seçim Sihirbazına gidilebiliyor */}
      <Stack.Screen name="SelectionScreen" component={SelectionScreen} /> 
    </Stack.Navigator>
  );
}

// PROFİL sekmesinin kendi iç navigasyonu (Profil Ana Menü -> Alt Sayfalar)
function ProfileStack({ setIsAuthenticated }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileScreen" options={{ title: 'Profil' }}>
           {props => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
      </Stack.Screen>
      <Stack.Screen name="PublishedAds" component={PublishedAdsScreen} options={{ title: 'Yayındaki İlanlarım' }} />
      <Stack.Screen name="UnpublishedAds" component={UnpublishedAdsScreen} options={{ title: 'Yayında Olmayanlarım' }} />
      <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Mesajlarım' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Bildirimlerim' }} />
      <Stack.Screen name="FavoriteAds" component={FavoriteAdsScreen} options={{ title: 'Favori İlanlarım' }} />
      <Stack.Screen name="FavoriteSearches" component={FavoriteSearchesScreen} options={{ title: 'Favori Aramalarım' }} />
      <Stack.Screen name="AccountInfo" component={AccountInfoScreen} options={{ title: 'Hesap Bilgilerim' }} />
      <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} options={{ title: 'Telefon Numaram' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
      <Stack.Screen name="EditAd" component={EditAdScreen} options={{ title: 'İlanı Düzenle' }} />
      {/* Profil içinden de ilan detayına ve sohbete gidilebilir (Favorilerden vb.) */}
      <Stack.Screen name="DetailScreen" component={DetailScreen} options={{ title: 'İlan Detayı' }} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
}

// ADMIN sekmesi (şimdilik tek sayfa)
function AdminStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="AdminScreen" component={AdminScreen} options={{ title: 'Admin Panel' }} />
            {/* YENİ EKLENEN EKRANLAR */}
            <Stack.Screen name="ManageAllAds" component={ManageAllAdsScreen} options={{ title: 'Tüm İlanları Yönet' }} />
            <Stack.Screen name="DetailScreen" component={DetailScreen} options={{ title: 'İlan Detayı' }} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
        </Stack.Navigator>
    );
}

// --- YENİ YAPI: ANA TAB NAVIGATOR (Uygulamanın Kalbi) ---
function MainTabs({ isAdmin, setIsAuthenticated }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Her sekmenin kendi Stack'i başlığı yönetecek
        tabBarActiveTintColor: theme.accent, // Aktif sekme rengi (mavi)
        tabBarInactiveTintColor: 'gray', // Pasif sekme rengi
        tabBarIcon: ({ color, size }) => { // İkonları ekleyelim
          let iconName;
          if (route.name === 'HomeStack') iconName = 'home-outline';
          else if (route.name === 'AddAdStack') iconName = 'plus-circle-outline';
          else if (route.name === 'AdminStack') iconName = 'shield-account-outline';
          else if (route.name === 'ProfileStack') iconName = 'account-outline';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeStack" component={HomeStack} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="AddAdStack" component={AddAdStack} options={{ title: 'İlan Ver' }} />
      {isAdmin && (
        <Tab.Screen name="AdminStack" component={AdminStack} options={{ title: 'Admin Panel' }} />
      )}
      <Tab.Screen name="ProfileStack" options={{ title: 'Profil' }}>
        {(props) => <ProfileStack {...props} setIsAuthenticated={setIsAuthenticated} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Ana Uygulama Component'i
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Önce token'ı hafızadan al
        const tokenStr = await AsyncStorage.getItem('token');
        
        // 2. Eğer giriş yapılmışsa...
        if (tokenStr) {
          const decodedToken = jwtDecode(tokenStr);
          setIsAdmin(decodedToken.isAdmin || false);
          setIsAuthenticated(true);

          // --- YENİ: BİLDİRİM İZNİ İSTE VE TOKEN'I SUNUCUYA GÖNDER ---
          registerForPushNotificationsAsync().then(pushToken => {
            if (pushToken) {
              // Token'ı backend'e gönder (sessizce)
              post('/users/push-token', { token: pushToken }, true)
                .then(() => console.log("Push Token sunucuya kaydedildi! ✅"))
                .catch(err => console.log("Push Token kaydedilemedi ❌:", err));
            }
          });
          // ------------------------------------------------------------

        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth kontrol hatası:", error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return null; // Yüklenme ekranı
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        // GİRİŞ YAPMIŞ KULLANICI ARTIK DOĞRUDAN SEKMELERİ GÖRÜR
        <MainTabs isAdmin={isAdmin} setIsAuthenticated={setIsAuthenticated} />
      ) : (
        // GİRİŞ YAPMAMIŞ KULLANICI İÇİN ESKİ YAPI (SADECE GİRİŞ/KAYIT EKRANLARI)
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} setIsAdmin={setIsAdmin} />}
          </Stack.Screen>
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerificationPending" component={VerificationPendingScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}