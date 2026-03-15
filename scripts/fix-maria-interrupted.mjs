import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const raw = readFileSync('/Users/mauriciosobarzo/aiduxcare-stable/.env.local', 'utf8');
const env = Object.fromEntries(
  raw.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

// IDs a cancelar (basura de pruebas - Juan test Doe)
const testIds = [
  '6ETQ8TOtE4XxejPzUbzokGHK0It2-1772702716634',
  '6ETQ8TOtE4XxejPzUbzokGHK0It2-1772703362966',
  '6ETQ8TOtE4XxejPzUbzokGHK0It2-1772703574671',
  '6ETQ8TOtE4XxejPzUbzokGHK0It2-1772704019924',
  '6ETQ8TOtE4XxejPzUbzokGHK0It2-1772704754946',
  '6ETQ8TOtE4XxejPzUbzokGHK0It2-1772704859389',
  '6ETQ8TOtE4XxejPzUbzokGHK0It2-1772705081144',
];

// María Castro — marcar como completed
const mariaId = '6ETQ8TOtE4XxejPzUbzokGHK0It2-1773005324507';

for (const id of testIds) {
  await updateDoc(doc(db, 'sessions', id), { status: 'cancelled' });
  console.log(`cancelled: ${id}`);
}

await updateDoc(doc(db, 'sessions', mariaId), { status: 'completed', soapStatus: 'finalized' });
console.log(`completed: ${mariaId}`);

console.log('Done.');
