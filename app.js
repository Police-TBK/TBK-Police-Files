
// app.js - TBK-Police Files frontend (compat SDK)

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const state = {
  user: null,
  isAdmin: false,
  lang: localStorage.getItem('lang') || 'en',
  theme: localStorage.getItem('theme') || 'light'
};

document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : 'light');

const i18n = {
  en: {
    login: 'Login', signup: 'Sign Up', logout: 'Logout',
    submitTitle: 'Submit Document', upload: 'Upload', mySubmissions: 'Your Submissions',
    aggregate: 'Download CSV', contact: 'Contact', admin: 'Admin Dashboard',
    uploadSuccess: 'Uploaded successfully', markDone: 'Mark Done'
  },
  km: {
    login: 'ចូល', signup: 'ចុះឈ្មោះ', logout: 'ចាកចេញ',
    submitTitle: 'ដាក់ឯកសារ', upload: 'ផ្ទុកឡើង', mySubmissions: 'ការស្នើរសុំរបស់ខ្ញុំ',
    aggregate: 'ទាញយក CSV', contact: 'ទំនាក់ទំនង', admin: 'ផ្ទាំងរដ្ឋបាល',
    uploadSuccess: 'ផ្ទុកឡើងដោយជោគជ័យ', markDone: 'បញ្ចប់'
  }
};

function t(key){
  return (i18n[state.lang] && i18n[state.lang][key]) || i18n.en[key] || key;
}

// UI elements
const emailInp = document.getElementById('email');
const passwordInp = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const signedOut = document.getElementById('signed-out');
const signedIn = document.getElementById('signed-in');
const welcomeSpan = document.getElementById('welcome');
const nav = document.getElementById('main-nav');
const viewArea = document.getElementById('view-area');

const langSwitch = document.getElementById('lang-switch');
langSwitch.value = state.lang;
langSwitch.addEventListener('change', e => {
  state.lang = e.target.value;
  localStorage.setItem('lang', state.lang);
  renderText();
});
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : 'light');
  localStorage.setItem('theme', state.theme);
});

function renderText(){
  document.getElementById('auth-title').innerText = t('login');
  loginBtn.innerText = t('login');
  signupBtn.innerText = t('signup');
  logoutBtn.innerText = t('logout');
  document.querySelector('button[data-view="submit"]').innerText = '1. ' + t('submitTitle');
  document.querySelector('button[data-view="track"]').innerText = '2. ' + t('mySubmissions');
  document.querySelector('button[data-view="aggregate"]').innerText = '3. ' + t('aggregate');
  document.querySelector('button[data-view="contact"]').innerText = '4. ' + t('contact');
  document.getElementById('upload-btn').innerText = t('upload');
  document.getElementById('download-csv').innerText = t('aggregate');
}
renderText();

// Auth flows
loginBtn.addEventListener('click', async () => {
  try{
    const email = emailInp.value, pw = passwordInp.value;
    await auth.signInWithEmailAndPassword(email, pw);
  }catch(e){ alert(e.message) }
});
signupBtn.addEventListener('click', async () => {
  try{
    const email = emailInp.value, pw = passwordInp.value;
    const cred = await auth.createUserWithEmailAndPassword(email, pw);
    await db.collection('users').doc(cred.user.uid).set({
      email,
      role: 'user',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e){ alert(e.message) }
});
logoutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(async user => {
  state.user = user;
  if(!user){
    signedOut.style.display = '';
    signedIn.style.display = 'none';
    nav.style.display = 'none';
    return;
  }

  const doc = await db.collection('users').doc(user.uid).get();
  const data = doc.exists ? doc.data() : {role:'user', email:user.email};
  state.isAdmin = data.role === 'admin';
  signedOut.style.display = 'none';
  signedIn.style.display = '';
  nav.style.display = '';
  welcomeSpan.innerText = (state.lang === 'km' ? 'ស្វាគមន៍' : 'Welcome') + ' ' + (data.displayName || user.email);
  document.getElementById('admin-btn').style.display = state.isAdmin ? '' : 'none';
  switchView('submit');
  loadMySubmissions();
});

// navigation
document.querySelectorAll('#main-nav button[data-view]').forEach(function(btn){
  btn.addEventListener('click', function(){ switchView(btn.getAttribute('data-view'))});
});
function switchView(name){
  document.querySelectorAll('.view').forEach(function(v){ v.style.display='none' });
  var el = document.getElementById('view-' + name);
  if(el) el.style.display = '';
}

// Upload documents
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const uploadStatus = document.getElementById('upload-status');

uploadBtn.addEventListener('click', async ()=>{
  if(!state.user) return alert('Login first');
  const file = fileInput.files[0];
  if(!file) return alert('Select a file');
  const title = document.getElementById('title').value || file.name;
  const desc = document.getElementById('desc').value || '';

  const id = db.collection('submissions').doc().id;
  const storageRef = storage.ref().child('uploads/' + state.user.uid + '/' + id + '_' + file.name);
  const uploadTask = storageRef.put(file);
  uploadStatus.innerText = 'Uploading...';

  uploadTask.on('state_changed', function(snap){
    const pct = (snap.bytesTransferred / snap.totalBytes * 100).toFixed(0);
    uploadStatus.innerText = 'Uploading ' + pct + '%';
  }, function(err){
    uploadStatus.innerText = 'Upload failed: ' + err.message;
  }, async function(){
    const url = await storageRef.getDownloadURL();
    await db.collection('submissions').doc(id).set({
      id: id, title: title, desc: desc, fileName: file.name, filePath: storageRef.fullPath,
      fileUrl: url, userId: state.user.uid, userEmail: state.user.email,
      status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    uploadStatus.innerText = t('uploadSuccess');
    loadMySubmissions();
  });
});

// load my submissions
async function loadMySubmissions(){
  if(!state.user) return;
  const snap = await db.collection('submissions').where('userId','==',state.user.uid).orderBy('createdAt','desc').get();
  const container = document.getElementById('my-submissions');
  container.innerHTML = '';
  snap.forEach(function(doc){
    var d = doc.data();
    var div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = '<strong>' + d.title + '</strong> <div class="small">' + d.fileName + ' • ' + d.status + '</div>'
      + '<a href="' + d.fileUrl + '" target="_blank" download>Download</a>';
    container.appendChild(div);
  });
  renderAggregateList();
}

// aggregate CSV download
document.getElementById('download-csv').addEventListener('click', async function(){
  const snap = await db.collection('submissions').orderBy('createdAt','desc').get();
  const rows = [['id','title','fileName','userEmail','status','createdAt','fileUrl']];
  snap.forEach(function(s){
    const d = s.data();
    rows.push([d.id, d.title, d.fileName, d.userEmail, d.status, d.createdAt ? d.createdAt.toDate().toISOString() : '', d.fileUrl]);
  });
  const csv = rows.map(function(r){ return r.map(function(v){ return '"' + ( (v||'').toString().replace(/"/g,'""') ) + '"'}).join(',')}).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'tbk_submissions.csv';
  document.body.appendChild(a); a.click(); a.remove();
});

// simple aggregate listing
async function renderAggregateList(){
  const snap = await db.collection('submissions').orderBy('createdAt','desc').limit(50).get();
  const cont = document.getElementById('agg-list');
  cont.innerHTML = '';
  snap.forEach(function(s){
    var d = s.data();
    var div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = '<strong>' + d.title + '</strong> <div class="small">' + d.fileName + ' • ' + d.userEmail + ' • ' + d.status + '</div>'
      + '<a href="' + d.fileUrl + '" target="_blank">Open</a>';
    cont.appendChild(div);
  });
}

// contact
document.getElementById('show-contact').addEventListener('click', function(){
  document.getElementById('contact-details').style.display = '';
  document.getElementById('telegram-link').href = 'https://t.me/domunlocked';
});

// admin actions
async function loadAdminList(){
  const filter = document.getElementById('filter-status').value;
  let q = db.collection('submissions');
  if(filter !== 'all') q = q.where('status','==',filter);
  const sort = document.getElementById('sort-by').value;
  if(sort === 'date_desc') q = q.orderBy('createdAt','desc');
  else if(sort === 'date_asc') q = q.orderBy('createdAt','asc');
  else if(sort === 'title') q = q.orderBy('title','asc');
  else if(sort === 'user') q = q.orderBy('userEmail','asc');

  const snap = await q.get();
  const cont = document.getElementById('admin-list');
  cont.innerHTML = '';
  snap.forEach(function(s){
    const d = s.data();
    const div = document.createElement('div');
    div.className = 'item';
    const okBtn = document.createElement('button');
    okBtn.innerText = t('markDone');
    okBtn.addEventListener('click', async function(){
      await db.collection('submissions').doc(d.id).update({status:'done', doneAt: firebase.firestore.FieldValue.serverTimestamp()});
      loadAdminList();
    });
    const openA = document.createElement('a');
    openA.href = d.fileUrl; openA.target = '_blank'; openA.innerText = 'Open';
    const delBtn = document.createElement('button');
    delBtn.innerText = 'Delete';
    delBtn.addEventListener('click', async function(){
      if(!confirm('Delete file?')) return;
      try {
        await storage.ref(d.filePath).delete();
        await db.collection('submissions').doc(d.id).delete();
        alert('Deleted');
        loadAdminList();
      } catch(e){ alert('Deletion failed: ' + e.message) }
    });

    div.appendChild(document.createTextNode(d.title + ' — ' + d.fileName + ' — ' + d.userEmail + ' — ' + d.status + ' '));
    div.appendChild(document.createTextNode(' '));
    div.appendChild(openA);
    div.appendChild(document.createTextNode(' '));
    div.appendChild(okBtn);
    div.appendChild(document.createTextNode(' '));
    div.appendChild(delBtn);
    cont.appendChild(div);
  });
}
document.getElementById('filter-status').addEventListener('change', loadAdminList);
document.getElementById('sort-by').addEventListener('change', loadAdminList);
document.getElementById('admin-btn').addEventListener('click', function(){
  switchView('admin');
  loadAdminList();
});
