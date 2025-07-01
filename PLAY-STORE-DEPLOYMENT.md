# 📱 MijnLVS Play Store Deployment Guide

## 🎯 Overzicht

Je hebt 2 opties om MijnLVS in de Play Store te krijgen:

### 1. **TWA (Trusted Web Activity) - Aanbevolen**
- Native Android app die je PWA wrappt
- Volledige Android app ervaring
- Meer controle over app store listing

### 2. **Bubblewrap - Snelste**
- Google's automatische TWA generator
- Minder configuratie
- Snel resultaat

## 🚀 Optie 1: TWA (Trusted Web Activity)

### Vereisten
- Android Studio
- Google Play Console account (€25 eenmalig)
- Geldige HTTPS domein voor je PWA

### Stap 1: PWA Publiceren
Eerst moet je PWA online staan op HTTPS:

```bash
# Build voor productie
npm run build

# Deploy naar hosting (bijv. Netlify, Vercel, Firebase)
# Voorbeeld voor Netlify:
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

### Stap 2: Android Studio Project
1. Download Android Studio
2. Maak nieuw project: "Empty Activity"
3. App naam: "MijnLVS"
4. Package name: `com.jouwbedrijf.mijnlvs`

### Stap 3: TWA Dependencies
In `app/build.gradle`:

```gradle
dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
    implementation 'androidx.browser:browser:1.4.0'
}
```

### Stap 4: Manifest Configuration
In `app/src/main/AndroidManifest.xml`:

```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:theme="@android:style/Theme.Translucent.NoTitleBar">
    
    <activity android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
        android:exported="true">
        <intent-filter android:autoVerify="true">
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
        <intent-filter android:autoVerify="true">
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https"
                android:host="jouw-domein.com" />
        </intent-filter>
    </activity>
</application>
```

### Stap 5: TWA Configuration
Maak `app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">MijnLVS</string>
    <string name="twa_url">https://jouw-domein.com</string>
    <string name="twa_name">MijnLVS</string>
</resources>
```

---

## ⚡ Optie 2: Bubblewrap (Snelste)

### Installatie
```bash
npm install -g @bubblewrap/cli
```

### Stap 1: Initialisatie
```bash
# In je project root
bubblewrap init --manifest https://jouw-domein.com/manifest.json
```

### Stap 2: Configuratie
Beantwoord de vragen:
- Package name: `com.jouwbedrijf.mijnlvs`
- App name: `MijnLVS`
- Display mode: `standalone`
- Orientation: `portrait`

### Stap 3: Build
```bash
# Genereer Android project
bubblewrap build

# Of voor development
bubblewrap build --dev
```

### Stap 4: Test
```bash
# Installeer op telefoon
adb install app-release-unsigned.apk
```

---

## 🔧 Vereiste Configuraties

### 1. Asset Links (Belangrijk!)
Maak `.well-known/assetlinks.json` in je web root:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.jouwbedrijf.mijnlvs",
    "sha256_cert_fingerprints": ["YOUR_APP_FINGERPRINT"]
  }
}]
```

### 2. App Icons
Je hebt Android icons nodig:
- `ic_launcher.png` (48x48, 72x72, 96x96, 144x144, 192x192)
- Adaptieve icons voor Android 8+

### 3. App Signing
Voor Play Store:
```bash
# Genereer keystore
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release-unsigned.apk alias_name
```

---

## 📋 Play Store Submission

### Vereiste Materialen
- App APK (signed)
- App icons (512x512 voor store)
- Screenshots (phone + tablet)
- Feature graphic (1024x500)
- App beschrijving
- Privacy policy URL

### Store Listing
- **Titel**: MijnLVS - Moskee Beheer
- **Korte beschrijving**: Leerling volgsysteem voor moskeeën
- **Volledige beschrijving**: Uitgebreide beschrijving van features
- **Categorie**: Education
- **Content rating**: Everyone

### Screenshots Vereisten
- Minimaal 2 screenshots
- Phone: 320dp tot 3840dp
- Tablet: 600dp tot 3840dp
- Geen borders of decoratie

---

## 🏃‍♂️ Snelle Start (Aanbevolen)

### Stap 1: Deploy PWA
```bash
# Build
npm run build

# Deploy naar Netlify (gratis HTTPS)
netlify deploy --prod --dir=build
```

### Stap 2: Bubblewrap
```bash
# Installeer tool
npm install -g @bubblewrap/cli

# Genereer Android app
bubblewrap init --manifest https://jouw-netlify-url.netlify.app/manifest.json

# Build APK
bubblewrap build
```

### Stap 3: Test
```bash
# Test op Android device
adb install app-release-unsigned.apk
```

### Stap 4: Publiceren
1. Sign APK voor productie
2. Upload naar Play Console
3. Vul store listing in
4. Submit voor review

---

## 💡 Tips

### Performance
- Zorg dat je PWA <3 seconden laadt
- Optimaliseer afbeeldingen
- Minimize JavaScript bundles

### SEO & Discovery
- Implementeer structured data
- Optimaliseer voor mobile-first indexing
- Voeg app indexing toe

### Monitoring
- Google Analytics voor app usage
- Firebase Crashlytics voor crash reporting
- Play Console voor app metrics

---

## 🎯 Geschatte Tijd

- **Bubblewrap route**: 2-4 uur
- **Handmatige TWA**: 1-2 dagen
- **Play Store review**: 1-3 dagen

---

## 📞 Volgende Stappen

1. **Kies optie** - Bubblewrap voor snelheid, TWA voor controle
2. **Deploy PWA** - Op HTTPS hosting
3. **Genereer Android app** - Met gekozen methode
4. **Test grondig** - Op echte Android devices
5. **Play Store submission** - Met alle vereiste assets

Welke optie wil je proberen? Ik help je stap voor stap!