// ============================================================
// prestige-forms.js
// Include this on ALL pages that have contact / inquiry forms
// Replace the existing form submit handlers with this
// ============================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyANFWqwFqFuWGNzjZS2crbr_WJ29eSDdRU",
  authDomain: "prestigevacations.firebaseapp.com",
  projectId: "prestigevacations",
  storageBucket: "prestigevacations.firebasestorage.app",
  messagingSenderId: "294803443782",
  appId: "1:294803443782:web:a3433f81c5af6a56153a47"
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/**
 * submitInquiry(data, formName)
 * Call this from any form's submit handler.
 *
 * data = { name, email, phone, message, subject, ...any extra fields }
 * formName = 'contact' | 'membership' | 'resort' | 'corporate' | 'other'
 *
 * Returns: true on success, false on failure
 */
window.submitInquiry = async function(data, formName = 'contact') {
  try {
    await addDoc(collection(db, 'inquiries'), {
      ...data,
      form: formName,
      status: 'unread',
      starred: false,
      created: serverTimestamp()
    });
    return true;
  } catch(e) {
    console.error('Form submission error:', e);
    return false;
  }
};
