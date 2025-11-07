// seed-users.js
// Usage: node seed-users.js /path/to/serviceAccountKey.json
const admin = require('firebase-admin');
const fs = require('fs');

const svcPath = process.argv[2];
if(!svcPath){ console.error('Pass path to service account JSON'); process.exit(1) }
const svc = require(require('path').resolve(svcPath));
admin.initializeApp({ credential: admin.credential.cert(svc) });

async function main(){
  const auth = admin.auth();
  const db = admin.firestore();
  const userCount = 33;
  const pw = 'ChangeMe123!'; // change after seed
  for(let i=1;i<=userCount;i++){
    const email = `user${i}@example.com`;
    try{
      const u = await auth.createUser({email, password: pw});
      await db.collection('users').doc(u.uid).set({email, role:'user', createdAt: admin.firestore.FieldValue.serverTimestamp()});
      console.log('Created', email);
    }catch(e){ console.error('Error creating', email, e.message) }
  }
  // create admin
  try{
    const adminUser = await auth.createUser({email:'admin@tbk.com', password:111111});
    await db.collection('users').doc(adminUser.uid).set({email:'admin@tbk.com', role:'admin', createdAt: admin.firestore.FieldValue.serverTimestamp()});
    console.log('Created admin@tbk.com');
  }catch(e){ console.error('Error creating admin', e.message) }
  process.exit(0);
}
main();
