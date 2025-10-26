import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import SelectionScreen from './screens/SelectionScreen';
// --- ANA EKRANLAR ---
import HomeScreen from './screens/HomeScreen';
import AddAdScreen from './screens/AddAdScreen';
import AdminScreen from './screens/AdminScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdListScreen from './screens/AdListScreen';
import SubCategoryScreen from './screens/SubCategoryScreen';
import VerificationPendingScreen from './screens/VerificationPendingScreen';
import DetailScreen from './screens/DetailScreen'; // <-- İLAN DETAY SAYFASI ✅
import ChatScreen from './screens/ChatScreen';

// --- PROFİL ALT EKRANLARI ---
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Alttaki Tab'ları yöneten component
function MainTabs({ setIsAuthenticated, isAdmin }) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="AddAd" component={AddAdScreen} options={{ title: 'İlan Ver' }} />
      {isAdmin && (
        <Tab.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin Panel' }} />
      )}
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
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
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decodedToken = jwtDecode(token);
          setIsAdmin(decodedToken.isAdmin || false);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Token okunamadı veya geçersiz:", error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return null; // Yüklenme ekranı
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        // GİRİŞ YAPMIŞ KULLANICI İÇİN NAVİGASYON
        <Stack.Navigator>
          <Stack.Screen 
            name="MainTabs" 
            options={{ headerShown: false }}
          >
            {(props) => <MainTabs {...props} setIsAuthenticated={setIsAuthenticated} isAdmin={isAdmin} />}
          </Stack.Screen>

          <Stack.Screen name="SubCategory" component={SubCategoryScreen} />
          <Stack.Screen name="AdList" component={AdListScreen} />
          
          {/* YENİ İLAN DETAY EKRANI BURAYA EKLENDİ ✅ */}
          <Stack.Screen name="DetailScreen" component={DetailScreen} options={{ title: 'İlan Detayı' }} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          {/* PROFİL SAYFASININ YENİ EKRANLARI */}
          <Stack.Screen name="PublishedAds" component={PublishedAdsScreen} options={{ title: 'Yayındaki İlanlarım' }} />
          <Stack.Screen name="UnpublishedAds" component={UnpublishedAdsScreen} options={{ title: 'Yayında Olmayan İlanlarım' }} />
          <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Mesajlarım' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Bildirimlerim' }} />
          <Stack.Screen name="FavoriteAds" component={FavoriteAdsScreen} options={{ title: 'Favori İlanlarım' }} />
          <Stack.Screen name="FavoriteSearches" component={FavoriteSearchesScreen} options={{ title: 'Favori Aramalarım' }} />
          <Stack.Screen name="AccountInfo" component={AccountInfoScreen} options={{ title: 'Hesap Bilgilerim' }} />
          <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} options={{ title: 'Telefon Numaram' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
          <Stack.Screen name="EditAd" component={EditAdScreen} options={{ title: 'İlanı Düzenle' }} />
          <Stack.Screen name="SelectionScreen" component={SelectionScreen} />
        </Stack.Navigator>
        
      ) : (
        // GİRİŞ YAPMAMIŞ KULLANICI İÇİN NAVİGASYON
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