# 🕌 Al-Hijra Moskee - Frontend

React frontend voor het Leerling Volgsysteem van Al-Hijra Moskee.

## 🚀 Quick Deploy naar Vercel

### 1. GitHub Repository Setup
```bash
# Maak nieuwe repository op GitHub
# Repository naam: al-hijra-moskee-frontend

# Upload deze bestanden:
# ✅ src/App.js (uit artifacts)
# ✅ src/App.css (bestaande CSS)
# ✅ package.json (uit artifacts)
# ✅ .env.local (uit artifacts)
# ✅ public/ folder (standaard React)
```

### 2. Vercel Deployment
1. **Ga naar** [vercel.com](https://vercel.com)
2. **Sign up** met GitHub account
3. **Import project** → Select je GitHub repository
4. **Environment Variables** toevoegen:
   - `REACT_APP_API_BASE_URL` = `https://moskee-backend-api-production.up.railway.app`
5. **Deploy**

### 3. Custom Domain (Optioneel)
1. **Vercel Dashboard** → **Settings** → **Domains**
2. **Add** je TransIP domein
3. **Update DNS** bij TransIP

## 🔧 Lokale Development

### Setup
```bash
npm install
npm start
```

### Environment Variables
Maak `.env.local`:
```bash
REACT_APP_API_BASE_URL=https://moskee-backend-api-production.up.railway.app
```

## 🏗️ Architecture

```
Frontend (Vercel)     →     Backend (Railway)     →     Database (Supabase)
React App                   Node.js API               PostgreSQL
├── Authentication          ├── /api/health           ├── mosques
├── User Management          ├── /api/send-email-m365  ├── users  
├── Email Integration        ├── /api/mosque/:id       ├── classes
└── Dashboard                └── /api/config-check     └── payments
```

## 📧 Email Configuratie

Microsoft 365 credentials worden **veilig** ingevoerd via de UI:
1. **Login** als admin
2. **Ga naar** Instellingen → Microsoft 365 Setup  
3. **Vul in** Tenant ID, Client ID, Secret
4. **Test** email functionaliteit

**🔐 Geen credentials in code - alleen via gebruikersinterface!**

## 🧪 Testing

### Health Check
```
https://[vercel-url] → Login → Dashboard
```

### Email Test
```
Instellingen → Microsoft 365 → Test Email
```

## 🔒 Security Features

- ✅ **No hardcoded secrets** in repository
- ✅ **Environment variables** voor configuratie
- ✅ **HTTPS** only via Vercel
- ✅ **Secure API calls** naar Railway backend
- ✅ **Input validation** en error handling

## 🌐 Live URLs

- **Frontend**: `https://al-hijra-moskee.vercel.app`
- **Backend API**: `https://moskee-backend-api-production.up.railway.app`
- **Database**: Supabase (private)

## 📞 Support

- **Frontend Issues**: Check Vercel logs
- **API Issues**: Check Railway backend logs  
- **Email Issues**: Test M365 configuratie
- **Database**: Check Supabase dashboard

## 🔄 Updates

1. **Update code** in GitHub repository
2. **Vercel** deploy automatisch
3. **Check** deployment logs voor errors
4. **Test** live website

---

**🎉 Resultaat: Complete professionele moskee website met email functionaliteit!**