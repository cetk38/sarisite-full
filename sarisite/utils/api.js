import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- EKSİK OLAN SATIR BUYDU!
import Constants from 'expo-constants';

// İşletim sistemine göre doğru IP adresini seçen akıllı mantık
const host = Platform.OS === 'android'
  ? '10.0.2.2'
  : Constants.manifest?.debuggerHost?.split(':')[0] || 'localhost';

export const BASE_URL = `http://${host}:3001/api`;

// --- DOSYANIN GERİ KALANI AYNI ---

const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

// utils/api.js -> get fonksiyonunu bununla değiştirin

export const get = async (path, withAuth = false) => {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = await getToken();
    
    // --- DEBUG İÇİN BU SATIRI EKLEDİK ---
    console.log('🔒 AUTH GEREKEN İSTEK, HAFIZADAN OKUNAN TOKEN:', token);
    // ------------------------------------

    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Sunucudan hatalı yanıt');
  }
  return await res.json();
};

export const post = async (path, body, withAuth = false) => {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  
  return { ok: res.ok, data };
};

export const patch = async (path, body = {}, withAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { ok: res.ok, data };
};

export const del = async (path, withAuth = true) => {
  const headers = {};
  if (withAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers
  });
  const data = await res.json();
  return { ok: res.ok, data };
};
export const put = async (path, body = {}, withAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT', // Metodu PUT olarak ayarlıyoruz
    headers,
    body: JSON.stringify(body)
  });

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await res.json();
    return { ok: res.ok, data };
  } else {
    return { ok: res.ok, data: { message: await res.text() } };
  }
};