/**
 * api.js — HTTP helpers with Basic Auth
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function authHeader(username, password) {
    return 'Basic ' + btoa(`${username}:${password}`);
}

export async function submitCheck(payload, username, password) {
    const res = await fetch(`${BASE_URL}/api/checks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader(username, password),
        },
        body: JSON.stringify(payload),
    });
    if (res.status === 401) throw new Error('401');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Ошибка сервера');
    }
    return res.json();
}

export async function fetchChecks(username, password) {
    const res = await fetch(`${BASE_URL}/api/checks`, {
        headers: { Authorization: authHeader(username, password) },
    });
    if (res.status === 401) throw new Error('401');
    if (!res.ok) throw new Error('Ошибка сервера');
    return res.json();
}

export async function getCheck(id, username, password) {
    const res = await fetch(`${BASE_URL}/api/checks/${id}`, {
        headers: { Authorization: authHeader(username, password) },
    });
    if (res.status === 401) throw new Error('401');
    if (!res.ok) throw new Error('Ошибка сервера');
    return res.json();
}

export async function updateCheck(id, payload, username, password) {
    const res = await fetch(`${BASE_URL}/api/checks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader(username, password),
        },
        body: JSON.stringify(payload),
    });
    if (res.status === 401) throw new Error('401');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Ошибка сервера');
    }
    return res.json();
}

