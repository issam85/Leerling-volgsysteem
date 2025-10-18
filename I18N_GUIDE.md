# Meertaligheid (i18n) Gids

Dit project ondersteunt nu meertaligheid (internationalisatie) met Nederlands en Arabisch.

## Hoe werkt het?

Het systeem gebruikt React Context om de huidige taal bij te houden en vertalingen te beheren.

### Vertaalbestanden

Vertaalbestanden bevinden zich in `/src/locales/`:
- `nl.js` - Nederlandse vertalingen
- `ar.js` - Arabische vertalingen

### Taalwisselaar

De `LanguageSwitcher` component toont een dropdown waarmee gebruikers kunnen wisselen tussen talen.
Deze is al toegevoegd aan de Sidebar voor alle gebruikers.

## Vertalingen toevoegen

### Stap 1: Voeg de vertaling toe aan beide taalbestanden

In `src/locales/nl.js`:
```javascript
export const nl = {
  teacher: {
    myClasses: 'Mijn Klassen',
    attendance: 'Aanwezigheid',
    // ... meer vertalingen
  }
};
```

In `src/locales/ar.js`:
```javascript
export const ar = {
  teacher: {
    myClasses: 'فصولي',
    attendance: 'الحضور',
    // ... meer vertalingen
  }
};
```

### Stap 2: Gebruik vertalingen in je componenten

```javascript
import { useLanguage } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div>
      <h1>{t('teacher.myClasses')}</h1>
      <p>{t('teacher.attendance')}</p>
    </div>
  );
};
```

## Belangrijke functies

### `t(key)` - Vertaalfunctie
Haalt de vertaling op basis van de huidige taal:
```javascript
const { t } = useLanguage();
console.log(t('common.save')); // Output: "Opslaan" (Nederlands) of "حفظ" (Arabisch)
```

### `isRTL` - Right-to-Left detectie
Voor Arabisch moet de layout soms anders zijn (rechts-naar-links):
```javascript
const { isRTL } = useLanguage();

<div className={isRTL ? 'text-right' : 'text-left'}>
  {t('some.text')}
</div>
```

### `language` - Huidige taal
De huidige taalcode ('nl' of 'ar'):
```javascript
const { language } = useLanguage();
console.log(language); // 'nl' of 'ar'
```

### `changeLanguage(lang)` - Verander taal
Handmatig de taal wijzigen:
```javascript
const { changeLanguage } = useLanguage();
changeLanguage('ar'); // Wissel naar Arabisch
```

## RTL Support

Het systeem past automatisch de HTML `dir` attribute aan:
- Nederlands: `<html dir="ltr">`
- Arabisch: `<html dir="rtl">`

Dit zorgt ervoor dat de hele layout automatisch wordt gespiegeld voor Arabisch.

## Voorbeelden

### Een vertaalde knop
```javascript
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/Button';

const SaveButton = () => {
  const { t } = useLanguage();

  return (
    <Button onClick={handleSave}>
      {t('common.save')}
    </Button>
  );
};
```

### Een vertaalde tabel header
```javascript
const StudentsTable = () => {
  const { t } = useLanguage();

  return (
    <table>
      <thead>
        <tr>
          <th>{t('student.firstName')}</th>
          <th>{t('student.lastName')}</th>
          <th>{t('student.class')}</th>
        </tr>
      </thead>
      {/* ... */}
    </table>
  );
};
```

### Conditionele RTL styling
```javascript
const MyComponent = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={isRTL ? 'ml-4' : 'mr-4'}>
        {t('some.label')}
      </div>
    </div>
  );
};
```

## Bestaande vertalingen uitbreiden

Als je nieuwe vertalingen wilt toevoegen, volg dit patroon:

1. Bepaal de categorie (bijv. `teacher`, `student`, `common`)
2. Voeg de sleutel toe aan BEIDE taalbestanden
3. Gebruik de sleutel in je component met `t('category.key')`

### Voorbeeld: Nieuwe lerarenvertaling toevoegen

**nl.js:**
```javascript
teacher: {
  // Bestaande vertalingen...
  quranProgress: 'Koran Voortgang',
  updateProgress: 'Update Voortgang'
}
```

**ar.js:**
```javascript
teacher: {
  // Bestaande vertalingen...
  quranProgress: 'تقدم القرآن',
  updateProgress: 'تحديث التقدم'
}
```

**Component:**
```javascript
const QuranProgressPage = () => {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t('teacher.quranProgress')}</h1>
      <Button>{t('teacher.updateProgress')}</Button>
    </div>
  );
};
```

## Vragen?

De taalinstelling wordt opgeslagen in `localStorage`, zodat de gebruiker bij de volgende keer inloggen dezelfde taal behoudt.

Om een pagina volledig te vertalen:
1. Identificeer alle hardcoded tekst
2. Voeg vertalingen toe aan `nl.js` en `ar.js`
3. Vervang de hardcoded tekst met `t('key')` aanroepen
4. Test beide talen!
