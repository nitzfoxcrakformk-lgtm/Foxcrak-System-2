import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

(() => {
  'use strict';
  const CONFIG_KEY = 'foxcrakFirebaseConfig';
  const $ = (s) => document.querySelector(s);
  let firebaseApp = null;
  let auth = null;
  let db = null;
  let authUnsubscribe = null;
  let currentUser = null;
  let cloudReady = false;
  let saveTimer = null;
  let syncInProgress = false;
  let saveRequested = false;

  const configInput = $('#firebaseConfigInput');
  const configBadge = $('#firebaseConfigBadge');
  const configMessage = $('#firebaseConfigMessage');
  const authBadge = $('#authStatusBadge');
  const authMessage = $('#authMessage');
  const signInButton = $('#googleSignInBtn');
  const signOutButton = $('#googleSignOutBtn');

  function say(message, kind = '') {
    if (authMessage) {
      authMessage.textContent = message;
      authMessage.dataset.kind = kind;
    }
  }
  function sayConfig(message, kind = '') {
    if (configMessage) {
      configMessage.textContent = message;
      configMessage.dataset.kind = kind;
    }
  }
  function initials(name) {
    return String(name || 'G').trim().split(/\s+/).map(part => part[0] || '').join('').slice(0, 2).toUpperCase() || 'G';
  }
  function updateAuthUI(user) {
    currentUser = user || null;
    if (authBadge) {
      authBadge.textContent = user ? 'NUBE CONECTADA' : (auth ? 'CONFIGURADO · SIN SESIÓN' : 'SOLO EN ESTE DISPOSITIVO');
      authBadge.classList.toggle('connected', Boolean(user));
    }
    if ($('#authAccountName')) $('#authAccountName').textContent = user ? (user.displayName || 'Cuenta Google conectada') : (auth ? 'Sin cuenta conectada' : 'Sin configuración cloud');
    if ($('#authAccountEmail')) $('#authAccountEmail').textContent = user ? (user.email || 'Correo no compartido') : (auth ? 'Inicia sesión para sincronizar tu progreso.' : 'Tu progreso se guarda localmente por ahora.');
    if ($('#authAvatar')) $('#authAvatar').textContent = initials(user?.displayName || user?.email || 'G');
    if (signInButton) signInButton.hidden = Boolean(user);
    if (signOutButton) signOutButton.hidden = !user;
    if (authBadge) authBadge.title = user?.uid ? `ID de cuenta: ${user.uid}` : '';
  }
  function requiredConfigIsValid(config) {
    return config && typeof config === 'object' && ['apiKey', 'authDomain', 'projectId', 'appId'].every(key => typeof config[key] === 'string' && config[key].trim());
  }
  async function configureFirebase(config) {
    if (!requiredConfigIsValid(config)) throw new Error('El JSON debe incluir apiKey, authDomain, projectId y appId.');
    cloudReady = false;
    try {
      if (authUnsubscribe) authUnsubscribe();
      authUnsubscribe = null;
      if (firebaseApp) {
        const oldApp = firebaseApp;
        firebaseApp = null;
        auth = null;
        db = null;
        await deleteApp(oldApp).catch(() => {});
      }
      firebaseApp = initializeApp(config, 'foxcrak-aps');
      auth = getAuth(firebaseApp);
      db = getFirestore(firebaseApp);
      authUnsubscribe = onAuthStateChanged(auth, user => {
        updateAuthUI(user);
        if (!user) {
          cloudReady = false;
          say('Sesión cerrada. El progreso seguirá guardado en este navegador.', 'muted');
          return;
        }
        loadOrCreateCloudProfile(user).catch(error => {
          cloudReady = false;
          say(`La cuenta inició sesión, pero no se pudo leer/guardar el progreso: ${friendlyError(error)}`, 'error');
        });
      });
      if (configBadge) {
        configBadge.textContent = 'CONFIGURADO';
        configBadge.classList.add('connected');
      }
      sayConfig('Configuración guardada. Ahora entra con Google desde Mi perfil.', 'success');
      say('Firebase está listo. Inicia sesión con Google para sincronizar.', 'muted');
    } catch (error) {
      if (configBadge) {
        configBadge.textContent = 'ERROR DE CONFIGURACIÓN';
        configBadge.classList.remove('connected');
      }
      throw error;
    }
  }
  function friendlyError(error) {
    const code = String(error?.code || '');
    if (code.includes('permission-denied')) return 'las reglas de Firestore no permiten este acceso. Revisa las reglas de usuario propietario.';
    if (code.includes('unauthorized-domain')) return 'el dominio actual no está autorizado en Firebase Authentication.';
    if (code.includes('popup-closed-by-user')) return 'se cerró la ventana de Google antes de terminar.';
    if (code.includes('popup-blocked')) return 'el navegador bloqueó la ventana emergente. Permite ventanas para este sitio.';
    if (code.includes('network')) return 'comprueba tu conexión a Internet.';
    return error?.message || 'Error desconocido.';
  }
  async function loadOrCreateCloudProfile(user) {
    if (!db || !window.FoxcrakApp) return;
    const profileRef = doc(db, 'users', user.uid);
    say('Cuenta identificada. Comprobando el progreso guardado…', 'muted');
    const snapshot = await getDoc(profileRef);
    if (snapshot.exists() && snapshot.data()?.state && typeof snapshot.data().state === 'object') {
      window.FoxcrakApp.applyCloudState(snapshot.data().state);
      cloudReady = true;
      say('Progreso cargado desde la nube. Los cambios nuevos se sincronizan automáticamente.', 'success');
      // Refresh profile metadata without changing the saved game state.
      await setDoc(profileRef, { displayName: user.displayName || '', updatedAt: serverTimestamp(), schemaVersion: 1 }, { merge: true });
    } else {
      cloudReady = true;
      await saveCloudState();
      say('Cuenta registrada en FOXCRAK SYSTEM APS. Tu progreso se guardará en la nube.', 'success');
    }
  }
  async function saveCloudState() {
    if (!currentUser || !db || !cloudReady || !window.FoxcrakApp) return;
    if (syncInProgress) { saveRequested = true; return; }
    syncInProgress = true;
    saveRequested = false;
    try {
      const profileRef = doc(db, 'users', currentUser.uid);
      await setDoc(profileRef, {
        displayName: currentUser.displayName || '',
        state: window.FoxcrakApp.getState(),
        updatedAt: serverTimestamp(),
        schemaVersion: 1
      }, { merge: true });
      say('Sincronizado ahora mismo. Tu progreso está guardado en la nube.', 'success');
    } catch (error) {
      say(`No se pudo sincronizar: ${friendlyError(error)}`, 'error');
    } finally {
      syncInProgress = false;
      if (saveRequested) { saveRequested = false; setTimeout(() => { saveCloudState(); }, 250); }
    }
  }
  window.addEventListener('foxcrak:state-changed', () => {
    if (!currentUser || !cloudReady) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveCloudState(); }, 800);
  });

  signInButton?.addEventListener('click', async () => {
    if (!auth) {
      say('Primero abre Ajustes y guarda la configuración de tu proyecto Firebase.', 'error');
      window.FoxcrakApp?.notify('Configura Firebase antes de conectar Google.');
      return;
    }
    signInButton.disabled = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      say(`No se pudo iniciar sesión: ${friendlyError(error)}`, 'error');
    } finally {
      signInButton.disabled = false;
    }
  });
  signOutButton?.addEventListener('click', async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      say('Sesión cerrada. La copia de tu progreso permanece en Firestore.', 'success');
    } catch (error) {
      say(`No se pudo cerrar sesión: ${friendlyError(error)}`, 'error');
    }
  });

  $('#firebaseConfigForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const parsed = JSON.parse(configInput?.value || '{}');
      if (!requiredConfigIsValid(parsed)) throw new Error('Faltan campos obligatorios: apiKey, authDomain, projectId o appId.');
      localStorage.setItem(CONFIG_KEY, JSON.stringify(parsed));
      await configureFirebase(parsed);
    } catch (error) {
      sayConfig(`No se pudo guardar: ${friendlyError(error)}`, 'error');
    }
  });
  $('#clearFirebaseConfigBtn')?.addEventListener('click', async () => {
    try {
      if (auth) await signOut(auth).catch(() => {});
      if (authUnsubscribe) authUnsubscribe();
      authUnsubscribe = null;
      if (firebaseApp) await deleteApp(firebaseApp).catch(() => {});
      firebaseApp = null; auth = null; db = null; currentUser = null; cloudReady = false;
      localStorage.removeItem(CONFIG_KEY);
      if (configInput) configInput.value = '';
      if (configBadge) { configBadge.textContent = 'SIN CONFIGURAR'; configBadge.classList.remove('connected'); }
      updateAuthUI(null);
      sayConfig('Configuración borrada de este navegador. El progreso local no se ha eliminado.', 'muted');
      say('Modo local. Vuelve a configurar Firebase para sincronizar.', 'muted');
    } catch (error) {
      sayConfig(`No se pudo borrar la sesión: ${friendlyError(error)}`, 'error');
    }
  });

  updateAuthUI(null);
  try {
    const savedConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    if (savedConfig) {
      if (configInput) configInput.value = JSON.stringify(savedConfig, null, 2);
      configureFirebase(savedConfig).catch(error => sayConfig(`Configuración guardada, pero no se pudo iniciar Firebase: ${friendlyError(error)}`, 'error'));
    }
  } catch (error) {
    sayConfig('La configuración guardada no es JSON válido. Pega el objeto web de Firebase otra vez.', 'error');
  }
})();
