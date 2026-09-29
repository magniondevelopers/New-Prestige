# Prestige Admin Panel — Integration Guide

## Files in this package

| File | Purpose |
|---|---|
| `admin.html` | Complete admin panel — upload to GitHub repo root |
| `firebase-forms.js` | Contact form handler — already in repo as firebase-config.js (replace) |
| `HOW-TO-INTEGRATE.md` | This file |

---

## STEP 1 — Firebase Console Setup (do this first)

Go to https://console.firebase.google.com → Select "prestigevacations" project

### Enable Firestore
- Click "Firestore Database" → Create database → Start in test mode → Chennai region

### Enable Storage  
- Click "Storage" → Get started → Start in test mode

### Create Admin User
- Click "Authentication" → Get started → Email/Password → Enable
- Click "Users" tab → Add user → Enter your admin email + password

### Firestore Security Rules (paste this)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public can only submit inquiries
    match /inquiries/{doc} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    // Everything else — authenticated admin only
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Security Rules (paste this)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## STEP 2 — Upload admin.html to GitHub

Push `admin.html` to your GitHub repo root (replacing the old one).
It will be accessible at: `www.prestigevacations.in/admin.html`

---

## STEP 3 — Integrate Contact Forms

For every page that has a contact or inquiry form, add this to the `<head>`:

```html
<script type="module" src="firebase-forms.js"></script>
```

Then change the form's submit handler. Find forms like:
```html
<form onsubmit="...">
```

Replace with:
```html
<form onsubmit="submitToFirebase(event, 'Contact')">
  <!-- all your existing fields stay the same -->
  <div class="form-success" style="display:none;color:green;padding:12px;"></div>
</form>
```

Change the formType label to match the page:
- Contact page → `'Contact'`
- Day Outing enquiry → `'Day Outing'`  
- Membership enquiry → `'Membership'`
- Resort booking → `'Resort Booking'`
- Wedding enquiry → `'Wedding'`

Make sure each form field has a `name` attribute:
```html
<input type="text" name="name" placeholder="Your name"/>
<input type="email" name="email" placeholder="Your email"/>
<input type="tel" name="phone" placeholder="Your phone"/>
<textarea name="message" placeholder="Your message"></textarea>
```

---

## STEP 4 — Connect Gallery Page

In `prestige-gallery.html`, replace the static photo grid with this:

```html
<!-- Add to <head> -->
<script type="module">
import{initializeApp,getApps}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import{getFirestore,collection,getDocs,query,orderBy,where}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const app=getApps().length?getApps()[0]:initializeApp({apiKey:"AIzaSyANFWqwFqFuWGNzjZS2crbr_WJ29eSDdRU",authDomain:"prestigevacations.firebaseapp.com",projectId:"prestigevacations",storageBucket:"prestigevacations.firebasestorage.app",messagingSenderId:"294803443782",appId:"1:294803443782:web:a3433f81c5af6a56153a47"});
const db=getFirestore(app);

async function loadGallery(filterTag=''){
  const q=filterTag?query(collection(db,'gallery_photos'),where('tag','==',filterTag),orderBy('createdAt','desc')):query(collection(db,'gallery_photos'),orderBy('createdAt','desc'));
  const snap=await getDocs(q);
  const grid=document.getElementById('gallery-grid');
  grid.innerHTML=snap.docs.map(d=>{const p=d.data();return`<div class="gallery-item" data-tag="${p.tag}"><img src="${p.url}" alt="${p.tag}" loading="lazy"/></div>`;}).join('');
}

async function loadTags(){
  const snap=await getDocs(collection(db,'gallery_tags'));
  const tags=snap.docs.map(d=>d.data().name);
  const bar=document.getElementById('tag-filter-bar');
  if(bar){
    bar.innerHTML='<button class="filter-btn active" onclick="filterGallery(\'\',this)">All</button>'+tags.map(t=>`<button class="filter-btn" onclick="filterGallery('${t}',this)">${t}</button>`).join('');
  }
  loadGallery();
}

window.filterGallery=(tag,btn)=>{
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  loadGallery(tag);
};

loadTags();
</script>

<!-- In your page body, replace static gallery with: -->
<div id="tag-filter-bar" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;"></div>
<div id="gallery-grid" class="gallery-grid"></div>
```

---

## STEP 5 — Connect Blog Pages

### prestige-blog-index.html — Replace static blog cards with:

```html
<script type="module">
import{initializeApp,getApps}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import{getFirestore,collection,getDocs,query,orderBy,where}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const app=getApps().length?getApps()[0]:initializeApp({apiKey:"AIzaSyANFWqwFqFuWGNzjZS2crbr_WJ29eSDdRU",authDomain:"prestigevacations.firebaseapp.com",projectId:"prestigevacations",storageBucket:"prestigevacations.firebasestorage.app",messagingSenderId:"294803443782",appId:"1:294803443782:web:a3433f81c5af6a56153a47"});
const db=getFirestore(app);
const snap=await getDocs(query(collection(db,'blogs'),where('status','==','published'),orderBy('createdAt','desc')));
document.getElementById('blog-grid').innerHTML=snap.docs.map(d=>{
  const b=d.data();
  return`<a href="prestige-blog-post.html?id=${d.id}" class="blog-card">
    ${b.coverUrl?`<img src="${b.coverUrl}" alt="${b.title}"/>`:''}
    <div class="blog-card-body">
      <div class="blog-category">${b.category||''}</div>
      <h3>${b.title}</h3>
      <div class="blog-meta">${b.author||''} · ${b.createdAt?.toDate?b.createdAt.toDate().toLocaleDateString():''}</div>
    </div>
  </a>`;
}).join('')||'<p>No blog posts yet.</p>';
</script>
<div id="blog-grid" class="blog-grid"></div>
```

### prestige-blog-post.html — Replace static content with:

```html
<script type="module">
import{initializeApp,getApps}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import{getFirestore,doc,getDoc}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const app=getApps().length?getApps()[0]:initializeApp({apiKey:"AIzaSyANFWqwFqFuWGNzjZS2crbr_WJ29eSDdRU",authDomain:"prestigevacations.firebaseapp.com",projectId:"prestigevacations",storageBucket:"prestigevacations.firebasestorage.app",messagingSenderId:"294803443782",appId:"1:294803443782:web:a3433f81c5af6a56153a47"});
const db=getFirestore(app);
const id=new URLSearchParams(location.search).get('id');
if(id){
  const snap=await getDoc(doc(db,'blogs',id));
  if(snap.exists()){
    const b=snap.data();
    document.title=b.title+' | Prestige Vacations';
    document.getElementById('post-title').textContent=b.title;
    document.getElementById('post-meta').textContent=(b.author||'')+(b.createdAt?.toDate?' · '+b.createdAt.toDate().toLocaleDateString():'');
    document.getElementById('post-cover').src=b.coverUrl||'';
    document.getElementById('post-cover').style.display=b.coverUrl?'block':'none';
    document.getElementById('post-content').innerHTML=b.content||'';
  }
}
</script>
<h1 id="post-title"></h1>
<div id="post-meta" style="color:#9ca3af;font-size:13px;margin:8px 0 24px;"></div>
<img id="post-cover" style="width:100%;border-radius:10px;margin-bottom:24px;"/>
<div id="post-content" class="blog-content"></div>
```

---

## STEP 6 — Connect Reviews Page

```html
<script type="module">
import{initializeApp,getApps}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import{getFirestore,collection,getDocs,query,orderBy,where}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const app=getApps().length?getApps()[0]:initializeApp({apiKey:"AIzaSyANFWqwFqFuWGNzjZS2crbr_WJ29eSDdRU",authDomain:"prestigevacations.firebaseapp.com",projectId:"prestigevacations",storageBucket:"prestigevacations.firebasestorage.app",messagingSenderId:"294803443782",appId:"1:294803443782:web:a3433f81c5af6a56153a47"});
const db=getFirestore(app);
const snap=await getDocs(query(collection(db,'reviews'),where('status','==','published'),orderBy('createdAt','desc')));
document.getElementById('reviews-grid').innerHTML=snap.docs.map(d=>{
  const r=d.data();
  return`<div class="review-card">
    <div class="stars">${'★'.repeat(r.rating||5)}</div>
    <p class="review-text">"${r.text}"</p>
    <div class="reviewer-name">${r.name}</div>
    <div class="reviewer-location">${r.location||''}</div>
    <div class="review-date">${r.date||''}</div>
  </div>`;
}).join('')||'<p>No reviews yet.</p>';
</script>
<div id="reviews-grid" class="reviews-grid"></div>
```

---

## STEP 7 — Connect Video Testimonials Page

```html
<script type="module">
import{initializeApp,getApps}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import{getFirestore,collection,getDocs,query,orderBy,where}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const app=getApps().length?getApps()[0]:initializeApp({apiKey:"AIzaSyANFWqwFqFuWGNzjZS2crbr_WJ29eSDdRU",authDomain:"prestigevacations.firebaseapp.com",projectId:"prestigevacations",storageBucket:"prestigevacations.firebasestorage.app",messagingSenderId:"294803443782",appId:"1:294803443782:web:a3433f81c5af6a56153a47"});
const db=getFirestore(app);
const snap=await getDocs(query(collection(db,'testimonials'),where('status','==','published'),orderBy('order','asc')));
document.getElementById('reels-grid').innerHTML=snap.docs.map(d=>{
  const r=d.data();
  return`<div class="reel-card" onclick="openReel('${r.reelUrl}')" style="cursor:pointer;">
    <div class="reel-thumb" style="position:relative;background:#1a1a17;border-radius:10px;overflow:hidden;aspect-ratio:9/16;">
      ${r.thumbnail?`<img src="${r.thumbnail}" style="width:100%;height:100%;object-fit:cover;"/>`:
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,.3);font-size:48px;">▶</div>'}
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:56px;height:56px;border-radius:50%;background:rgba(201,164,75,.9);display:flex;align-items:center;justify-content:center;font-size:20px;color:#1a1a17;">▶</div>
      </div>
    </div>
    <div style="padding:12px 0;">
      <div style="font-weight:700;">${r.title||''}</div>
      <div style="font-size:12px;color:#9ca3af;">${r.caption||''}</div>
    </div>
  </div>`;
}).join('')||'<p>No testimonials yet.</p>';

// Lightbox
window.openReel = url => {
  const modal=document.getElementById('reel-lightbox');
  const embedUrl=url.replace('instagram.com/reel/','instagram.com/p/')+'/embed/';
  document.getElementById('reel-iframe').src=embedUrl;
  modal.style.display='flex';
};
window.closeReel = () => {
  document.getElementById('reel-lightbox').style.display='none';
  document.getElementById('reel-iframe').src='';
};
</script>
<div id="reels-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;"></div>

<!-- Lightbox (add before </body>) -->
<div id="reel-lightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;align-items:center;justify-content:center;" onclick="if(event.target===this)closeReel()">
  <button onclick="closeReel()" style="position:absolute;top:20px;right:24px;background:none;border:none;color:#fff;font-size:32px;cursor:pointer;">×</button>
  <iframe id="reel-iframe" src="" width="400" height="711" frameborder="0" allowfullscreen style="border-radius:12px;max-width:95vw;max-height:90vh;"></iframe>
</div>
```

---

## Firebase Collections Created by Admin Panel

| Collection | Purpose |
|---|---|
| `gallery_photos` | Gallery images (url, tag, name, createdAt) |
| `gallery_tags` | Gallery category tags (name, createdAt) |
| `blogs` | Blog posts (title, author, content, coverUrl, status, slug…) |
| `reviews` | Member reviews (name, rating, text, status…) |
| `testimonials` | Instagram reels (reelUrl, thumbnail, title, status, order…) |
| `inquiries` | Contact form submissions (name, email, message, formType, read, replied…) |
