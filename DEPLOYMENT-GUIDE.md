# 🚀 PWA Deployment naar Netlify - Stap voor Stap

## ✅ Build is klaar!
Je PWA is succesvol gebuild in de `/build` folder.

## 📤 Stap 1: Deploy naar Netlify (Drag & Drop)

### 1. Ga naar Netlify
- Open: https://netlify.com
- Klik "Sign up" of log in

### 2. Drag & Drop Deployment
1. Ga naar je Netlify dashboard
2. Scroll naar beneden naar "Want to deploy a new site without connecting to Git?"
3. **Sleep de hele `/build` folder** naar het upload gebied
4. Wacht tot deployment compleet is
5. Kopieer de gegenereerde URL (bijv: `https://amazing-dragon-123.netlify.app`)

### 3. Custom Domain (Optioneel)
1. In Netlify dashboard → Site settings → Domain management
2. Klik "Add custom domain"
3. Voer je gewenste subdomain in (bijv: `mijnlvs.netlify.app`)

---

## 📱 Stap 2: Bubblewrap Setup

### 1. Installeer Bubblewrap
```bash
npm install -g @bubblewrap/cli
```

Als dat niet werkt door permissions:
```bash
npx @bubblewrap/cli init --manifest https://jouw-netlify-url.netlify.app/manifest.json
```

### 2. Initialiseer Android App
Vervang `https://jouw-netlify-url.netlify.app` met je echte Netlify URL:

```bash
bubblewrap init --manifest https://jouw-netlify-url.netlify.app/manifest.json
```

### 3. Beantwoord de vragen:
- **Package name**: `com.mijnlvs.moskee`
- **App name**: `MijnLVS`
- **Display mode**: `standalone`
- **Orientation**: `portrait`
- **Theme color**: `#059669`
- **Background color**: `#ffffff`

### 4. Build Android App
```bash
cd twa-mijnlvs  # Of de gegenereerde folder naam
bubblewrap build
```

---

## 🔧 Stap 3: Asset Links (Belangrijk!)

### 1. Maak Asset Links bestand
In je `/build` folder, maak deze structuur:
```
build/
├── .well-known/
│   └── assetlinks.json
```

### 2. Asset Links inhoud
Nadat je de Android app hebt gebuild, krijg je een SHA256 fingerprint.
Maak `build/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.mijnlvs.moskee",
    "sha256_cert_fingerprints": ["HIER_KOMT_JE_SHA256_FINGERPRINT"]
  }
}]
```

### 3. Re-deploy naar Netlify
Sleep de bijgewerkte `/build` folder opnieuw naar Netlify.

---

## 🧪 Stap 4: Test de Android App

### 1. Installeer op telefoon
```bash
adb install app-release-unsigned.apk
```

### 2. Test functionaliteit
- ✅ App start correct
- ✅ Netwerkconnectie werkt
- ✅ Supabase authenticatie werkt
- ✅ Navigatie werkt soepel
- ✅ Responsive design correct

---

## 📋 Stap 5: Play Store Voorbereiding

### 1. Vereiste Assets
- App Icon (512x512 PNG)
- Feature Graphic (1024x500 PNG)
- Screenshots (minimaal 2):
  - Phone screenshots
  - Tablet screenshots (optioneel)

### 2. App Signing voor Productie
```bash
# Genereer keystore
keytool -genkey -v -keystore mijnlvs-release.keystore -alias mijnlvs -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore mijnlvs-release.keystore app-release-unsigned.apk mijnlvs

# Zipalign
zipalign -v 4 app-release-unsigned.apk mijnlvs-release.apk
```

### 3. Play Console Upload
1. Ga naar https://play.google.com/console
2. Maak nieuw app project
3. Upload signed APK
4. Vul store listing in
5. Submit voor review

---

## ⚡ Snelle Checklist

- [ ] PWA gebuild (`npm run build`)
- [ ] Deployed naar Netlify (drag & drop `/build` folder)
- [ ] Netlify URL gekopieerd
- [ ] Bubblewrap geïnstalleerd
- [ ] Android app gegenereerd
- [ ] Asset links geconfigureerd
- [ ] Android app getest
- [ ] Play Store assets voorbereid
- [ ] App signed voor productie
- [ ] Uploaded naar Play Console

---

## 📞 Volgende Stappen

1. **Deploy eerst** - Sleep `/build` folder naar Netlify
2. **Deel je Netlify URL** - Dan kunnen we Bubblewrap configureren
3. **Android app genereren** - Met jouw specifieke URL
4. **Testen en Play Store** - Stap voor stap naar publicatie

**Heb je de build folder gedeployed naar Netlify? Deel dan je URL zodat we verder kunnen!**