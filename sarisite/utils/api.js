// utils/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
<SafeAreaView style={{ flex: 1 }}>
const BASE_URL = 'http://192.168.1.69:3001/api'; // Geliştirme ortamı için, gerekirse IP kullan

const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

export const get = async (path) => {
  const res = await fetch(`${BASE_URL}${path}`);
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
</SafeAreaView>