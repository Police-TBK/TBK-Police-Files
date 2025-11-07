// Cloud Functions example (optional)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

const TELEGRAM_TOKEN = functions.config().telegram && functions.config().telegram.bot_token;
const TELEGRAM_CHAT_ID = functions.config().telegram && functions.config().telegram.chat_id;

exports.notifyOnSubmission = functions.firestore.document('submissions/{subId}').onCreate(async (snap, ctx) => {
  const data = snap.data();
  const text = `New submission\nTitle: ${data.title}\nBy: ${data.userEmail}\nFile: ${data.fileName}`;
  if(!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return null;
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({chat_id: TELEGRAM_CHAT_ID, text})
  });
  return null;
});

exports.adminDeleteFile = functions.https.onCall(async (data, context) => {
  if(!context.auth) throw new functions.https.HttpsError('unauthenticated','not auth');
  const uid = context.auth.uid;
  const userDoc = await db.collection('users').doc(uid).get();
  if(!userDoc.exists || userDoc.data().role !== 'admin') throw new functions.https.HttpsError('permission-denied','not admin');
  const {filePath, submissionId} = data;
  if(!filePath) throw new functions.https.HttpsError('invalid-argument','missing file path');

  const bucket = admin.storage().bucket();
  await bucket.file(filePath).delete().catch(err => {
    throw new functions.https.HttpsError('internal','delete failed: '+err.message);
  });

  if(submissionId) await db.collection('submissions').doc(submissionId).delete();

  return {ok:true};
});
