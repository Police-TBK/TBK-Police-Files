// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyD3kI3RlOIeGd4r5evCwjpzDe-47utaWco",
  authDomain: "pl-tbk-file.firebaseapp.com",
  projectId: "pl-tbk-file",
  storageBucket: "pl-tbk-file.appspot.com",
  messagingSenderId: "392294785491",
  appId: "1:392294785491:web:479dddf03d5ded40bf4f26"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("Firebase initialized");

// === Login Functionality ===
document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.textContent = "";

  if (!email || !password) {
    errorMsg.textContent = "Please enter your email and password.";
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("Login success:", user.email);

      if (user.email === "admin@tbk.com") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "user.html";
      }
    })
    .catch((error) => {
      console.error("Login error:", error.message);
      errorMsg.textContent = "Login failed: " + error.message;
    });
});
