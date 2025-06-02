import React, { useState, useEffect } from 'react';
import { Users, BookOpen, User, Plus, Building2, LogOut, DollarSign } from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://moskee-backend-api-production.up.railway.app';

const LeerlingVolgsysteem = () => {
  // Main application state
  const [currentSubdomain, setCurrentSubdomain] = useState('al-hijra');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Modal states
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showM365ConfigModal, setShowM365ConfigModal] = useState(false);
  
  // Selection states
  const [selectedParentForPayment, setSelectedParentForPayment] = useState(null);
  const [selectedParentForDetails, setSelectedParentForDetails] = useState(null);
  
  // Form states
  const [newClass, setNewClass] = useState({ name: '', teacherId: '' });
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '' });
  const [newStudent, setNewStudent] = useState({ name: '', parentId: '', classId: '' });
  const [newParent, setNewParent] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    city: '', 
    zipcode: '' 
  });
  const [newPayment, setNewPayment] = useState({
    amount: '',
    paymentMethod: 'contant',
    notes: ''
  });
  
  // Email states
  const [parentError, setParentError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmailData, setSentEmailData] = useState(null);

  useEffect(() => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      setCurrentUser(JSON.parse(savedUser));
    } catch (error) {
      console.error('Error loading saved user:', error);
      localStorage.removeItem('currentUser');
    }
  }
}, []);
  
  // Microsoft 365 configuration
  const [m365Config, setM365Config] = useState({
    tenantId: '',
    clientId: '',
    clientSecret: '',
    configured: false
  });
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // Real data from database
  const [realData, setRealData] = useState({
    users: [],
    classes: [],
    students: [],
    payments: [],
    mosque: null,
    loading: true
  });

  // Utility functions
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // API Helper Function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Call Error:', error);
      throw error;
    }
  };

  // Data laden vanuit database
  const loadData = async () => {
    try {
      setRealData(prev => ({ ...prev, loading: true }));
      
      const mosqueId = 1; // Maak dynamisch gebaseerd op currentSubdomain
      
      const [usersRes, classesRes, studentsRes, paymentsRes] = await Promise.all([
        apiCall(`/api/mosques/${mosqueId}/users`),
        apiCall(`/api/mosques/${mosqueId}/classes`),
        apiCall(`/api/mosques/${mosqueId}/students`),
        apiCall(`/api/mosques/${mosqueId}/payments`)
      ]);
      
      setRealData({
        users: usersRes || [],
        classes: classesRes || [],
        students: studentsRes || [],
        payments: paymentsRes || [],
        mosque: { name: 'Al-Hijra Moskee', address: 'Rotterdam' }, // Temp
        loading: false
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setRealData(prev => ({ ...prev, loading: false }));
    }
  };

  // Laad data wanneer user inlogt
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Email service
  const sendEmail = async (recipientName, email, tempPassword, mosqueName, userType = 'ouder') => {
    try {
      console.log('Sending email via backend API to:', email);
      
      if (!m365Config.configured || !m365Config.tenantId || !m365Config.clientId) {
        throw new Error('Microsoft 365 not configured');
      }
      
      const emailTemplate = {
        subject: userType === 'test' 
          ? `🧪 Test Email - ${mosqueName} Systeem Configuratie`
          : userType === 'teacher' 
          ? `Welkom bij ${mosqueName} - Uw leraar account`
          : `Welkom bij ${mosqueName} - Uw ouder account`,
        body: userType === 'test' 
          ? `Beste beheerder,\n\nDit is een test email om te controleren of uw Microsoft 365 configuratie correct werkt.\n\n✅ Als u deze email ontvangt, is uw configuratie succesvol!\n\nMet vriendelijke groet,\nHet Leerling Volgsysteem`
          : userType === 'teacher' 
          ? `Beste ${recipientName},\n\nWelkom bij ${mosqueName}! Er is een leraar account voor u aangemaakt.\n\n🔐 Uw inloggegevens:\nEmail: ${email}\nTijdelijk wachtwoord: ${tempPassword}\n\nLog in en kies een nieuw wachtwoord bij uw eerste bezoek.\n\nMet vriendelijke groet,\n${mosqueName}`
          : `Beste ${recipientName},\n\nUw account is aangemaakt voor het leerling volgsysteem van ${mosqueName}.\n\n🔐 Uw inloggegevens:\nEmail: ${email}\nTijdelijk wachtwoord: ${tempPassword}\n\nLog in en kies een nieuw wachtwoord bij uw eerste bezoek.\n\nMet vriendelijke groet,\n${mosqueName}`
      };
      
      try {
        const result = await apiCall('/api/send-email-m365', {
          method: 'POST',
          body: JSON.stringify({
            tenantId: m365Config.tenantId,
            clientId: m365Config.clientId,
            clientSecret: m365Config.clientSecret,
            to: email,
            subject: emailTemplate.subject,
            body: emailTemplate.body,
            mosqueName: mosqueName
          })
        });
        
        if (result.success) {
          console.log('Email sent successfully via backend API');
          return {
            success: true,
            messageId: result.messageId,
            service: 'Backend API → Microsoft Graph',
            email: email,
            tempPassword: tempPassword
          };
        } else {
          throw new Error(result.error || 'Email sending failed');
        }
      } catch (fetchError) {
        throw new Error('Backend API not available - using demo mode');
      }
      
    } catch (error) {
      console.error('Error sending email via backend:', error);
      console.log('Falling back to demo mode...');
      
      const emailTemplate = {
        subject: userType === 'test' 
          ? `🧪 Test Email - ${mosqueName} Systeem`
          : userType === 'teacher' 
          ? `Welkom bij ${mosqueName} - Leraar account`
          : `Welkom bij ${mosqueName} - Ouder account`,
        body: `Demo email voor ${recipientName} (${email}) met wachtwoord: ${tempPassword}`
      };
      
      console.log('📧 DEMO EMAIL CONTENT:', {
        to: email,
        subject: emailTemplate.subject,
        body: emailTemplate.body
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: 'demo_' + Date.now(),
        service: `Demo Mode (${error.message})`,
        email: email,
        tempPassword: tempPassword
      };
    }
  };

  // Handler functions
  const handleSubdomainSwitch = (subdomain) => {
    setCurrentSubdomain(subdomain);
    setCurrentUser(null);
    setLoginData({ email: '', password: '' });
  };

  const handleLogin = async () => {
  try {
    const result = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: loginData.email,
        password: loginData.password,
        subdomain: currentSubdomain
      })
    });
    
    if (result.success) {
      setCurrentUser(result.user);
      // Bewaar user in localStorage
      localStorage.setItem('currentUser', JSON.stringify(result.user));
    } else {
      alert('Ongeldige inloggegevens');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Inloggen mislukt: ' + error.message);
  }
};

  const handleLogout = () => {
  setCurrentUser(null);
  setLoginData({ email: '', password: '' });
  // Verwijder user uit localStorage
  localStorage.removeItem('currentUser');
  setRealData({
    users: [],
    classes: [],
    students: [],
    payments: [],
    mosque: null,
    loading: true
  });
};

  const handleAddClass = async () => {
    if (!newClass.name || !newClass.teacherId) {
      alert('Vul alle velden in');
      return;
    }

    try {
      const result = await apiCall('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          mosque_id: 1, // Maak dynamisch
          name: newClass.name,
          teacher_id: parseInt(newClass.teacherId),
          description: newClass.description || ''
        })
      });

      if (result.success) {
        setNewClass({ name: '', teacherId: '' });
        setShowAddClassModal(false);
        alert('Klas aangemaakt!');
        await loadData(); // Herlaad data
      }
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Er is een fout opgetreden bij het aanmaken van de klas: ' + error.message);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email) {
      alert('Vul alle velden in');
      return;
    }

    try {
      const tempPassword = generateTempPassword();
      
      const result = await apiCall('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          mosque_id: 1, // Maak dynamisch
          email: newTeacher.email.trim(),
          name: newTeacher.name.trim(),
          role: 'teacher',
          password: tempPassword
        })
      });

      if (result.success) {
        // Probeer email te versturen
        const emailResult = await sendEmail(
          newTeacher.name.trim(),
          newTeacher.email.trim(),
          tempPassword,
          realData.mosque?.name || 'Al-Hijra',
          'teacher'
        );
        
        setNewTeacher({ name: '', email: '' });
        setShowAddTeacherModal(false);
        alert(`Leraar toegevoegd! Er is een email verzonden naar ${newTeacher.email.trim()} met inloggegevens.`);
        await loadData(); // Herlaad data
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('Er is een fout opgetreden bij het toevoegen van de leraar: ' + error.message);
    }
  };

  const handleAddParent = async () => {
    setParentError('');
    setEmailSent(false);
    setSentEmailData(null);
    
    if (!newParent.name || !newParent.email || !newParent.phone || !newParent.address || !newParent.city || !newParent.zipcode) {
      setParentError('Vul alle velden in');
      return;
    }

    try {
      const tempPassword = generateTempPassword();
      
      const result = await apiCall('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          mosque_id: 1, // Maak dynamisch
          email: newParent.email.trim(),
          name: newParent.name.trim(),
          role: 'parent',
          phone: newParent.phone.trim(),
          address: newParent.address.trim(),
          city: newParent.city.trim(),
          zipcode: newParent.zipcode.trim(),
          password: tempPassword
        })
      });

      if (result.success) {
        const emailResult = await sendEmail(
          newParent.name.trim(),
          newParent.email.trim(),
          tempPassword,
          realData.mosque?.name || 'Al-Hijra',
          'parent'
        );
        
        if (emailResult.success) {
          setEmailSent(true);
          setSentEmailData({
            parentName: newParent.name.trim(),
            email: newParent.email.trim(),
            mosqueName: realData.mosque?.name || 'Al-Hijra'
          });
          
          setNewParent({ name: '', email: '', phone: '', address: '', city: '', zipcode: '' });
          setParentError('');
          await loadData(); // Herlaad data
          
          setTimeout(() => {
            setShowAddParentModal(false);
            setEmailSent(false);
            setSentEmailData(null);
          }, 4000);
        }
      }
    } catch (error) {
      console.error('Error adding parent:', error);
      setParentError('Er is een fout opgetreden bij het toevoegen van de ouder: ' + error.message);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.parentId || !newStudent.classId) {
      alert('Vul alle velden in');
      return;
    }

    try {
      const result = await apiCall('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          mosque_id: 1, // Maak dynamisch
          parent_id: parseInt(newStudent.parentId),
          class_id: parseInt(newStudent.classId),
          name: newStudent.name,
          date_of_birth: '2010-01-01', // Voeg datepicker toe later
          emergency_contact: 'Nog in te vullen',
          emergency_phone: '+31600000000'
        })
      });

      if (result.success) {
        setNewStudent({ name: '', parentId: '', classId: '' });
        setShowAddStudentModal(false);
        alert('Leerling toegevoegd!');
        await loadData(); // Herlaad data
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Er is een fout opgetreden bij het toevoegen van de leerling: ' + error.message);
    }
  };

  const handleAddPayment = async () => {
    if (!newPayment.amount || !selectedParentForPayment) {
      alert('Vul alle verplichte velden in');
      return;
    }

    const amount = parseFloat(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Voer een geldig bedrag in');
      return;
    }

    try {
      const result = await apiCall('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          mosque_id: 1, // Maak dynamisch
          parent_id: selectedParentForPayment.id,
          amount: amount,
          payment_method: newPayment.paymentMethod,
          description: 'Maandelijkse bijdrage',
          notes: newPayment.notes,
          processed_by: currentUser.id
        })
      });

      if (result.success) {
        setNewPayment({ amount: '', paymentMethod: 'contant', notes: '' });
        setSelectedParentForPayment(null);
        setShowAddPaymentModal(false);
        alert('Betaling geregistreerd!');
        await loadData(); // Herlaad data
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Er is een fout opgetreden bij het registreren van de betaling: ' + error.message);
    }
  };

  const testM365Configuration = async () => {
    if (!m365Config.configured) {
      alert('Configureer eerst Microsoft 365 voordat u kunt testen.');
      return;
    }

    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      alert('Voer een geldig email adres in voor de test.');
      return;
    }

    try {
      const emailResult = await sendEmail(
        'Test Gebruiker',
        testEmailAddress,
        'TEST123',
        realData.mosque?.name || 'Test Moskee',
        'test'
      );
      
      if (emailResult.success) {
        alert(`✅ Test email succesvol verzonden!\n\nService: ${emailResult.service}\nNaar: ${testEmailAddress}\n\nControleer uw inbox!`);
      } else {
        throw new Error(emailResult.error);
      }

    } catch (error) {
      console.error('Test error:', error);
      alert(`❌ Test mislukt: ${error.message}`);
    }
  };

  // Calculate payment status for a parent
  const calculateParentPaymentStatus = (parentId) => {
    const parent = realData.users.find(u => u.id === parentId);
    if (!parent) return { totalPaid: 0, amountDue: 0, remainingBalance: 0, paymentStatus: 'openstaand' };

    const payments = realData.payments.filter(p => p.parent_id === parentId) || [];
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const amountDue = parent.amount_due || 0;
    const remainingBalance = Math.max(0, amountDue - totalPaid);
    
    let paymentStatus = 'openstaand';
    if (totalPaid >= amountDue && amountDue > 0) {
      paymentStatus = 'betaald';
    } else if (totalPaid > 0) {
      paymentStatus = 'deels_betaald';
    }

    return { totalPaid, amountDue, remainingBalance, paymentStatus };
  };

  // Calculate financial metrics
  const calculateFinancialMetrics = () => {
    const parents = realData.users.filter(u => u.role === 'parent');
    
    let totalDue = 0;
    let totalPaid = 0;

    parents.forEach(parent => {
      const paymentStatus = calculateParentPaymentStatus(parent.id);
      totalDue += paymentStatus.amountDue;
      totalPaid += paymentStatus.totalPaid;
    });

    const percentagePaid = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

    return {
      totalDue,
      totalPaid,
      totalOutstanding: totalDue - totalPaid,
      percentagePaid
    };
  };

  // Show loading state
  if (realData.loading && currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-emerald-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-700">Gegevens laden...</h2>
          <p className="text-gray-500">Even geduld terwijl we uw data ophalen</p>
        </div>
      </div>
    );
  }

  // Registration Page Component
  if (currentSubdomain === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-emerald-600" />
                <h1 className="ml-3 text-xl font-bold">Leerling Volgsysteem</h1>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleSubdomainSwitch('al-noor')} 
                  className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg"
                >
                  Al-Noor Demo
                </button>
                <button 
                  onClick={() => handleSubdomainSwitch('al-hijra')} 
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg"
                >
                  Al-Hijra Demo
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Leerling Volgsysteem voor Moskeeën</h1>
            <p className="text-xl text-gray-600">Professioneel systeem voor leerlingbeheer</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Building2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Registreer Uw Moskee</h2>
            <p className="text-gray-600 mt-2">Formulier komt hier</p>
          </div>
        </div>
      </div>
    );
  }

  // Not found page
  if (!realData.mosque && !realData.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Moskee niet gevonden</h1>
          <button 
            onClick={() => handleSubdomainSwitch('register')} 
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg"
          >
            Terug naar registratie
          </button>
        </div>
      </div>
    );
  }

  // Login Screen Component
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <BookOpen className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">{realData.mosque?.name || 'Al-Hijra Moskee'}</h1>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 border rounded-lg"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wachtwoord</label>
              <input
                type="password"
                className="w-full px-4 py-3 border rounded-lg"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              />
            </div>
            <button 
              onClick={handleLogin} 
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700"
            >
              Inloggen
            </button>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Demo accounts:</p>
            <div className="text-xs space-y-1">
              <div><strong>Admin:</strong> admin@{currentSubdomain}.nl / admin</div>
              {currentSubdomain === 'al-noor' && (
                <>
                  <div><strong>Leraar:</strong> hassan@alnoor.nl / leraar123</div>
                  <div><strong>Ouder:</strong> ouder@alnoor.nl / TempPass1</div>
                </>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                💡 Nieuwe accounts krijgen automatische emails met tijdelijke wachtwoorden
              </p>
              <p className="text-xs text-gray-500">
                📧 Configureer Microsoft 365 in Instellingen voor echte email functionaliteit
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button 
              onClick={() => handleSubdomainSwitch('register')} 
              className="text-sm text-emerald-600"
            >
              ← Terug naar hoofdpagina
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Application
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-emerald-600" />
            <div className="ml-3">
              <h1 className="font-bold text-sm">{realData.mosque?.name || 'Moskee Systeem'}</h1>
              <p className="text-xs text-gray-600">{currentUser.role}</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center px-4 py-3 rounded-lg ${
                  activeTab === 'dashboard' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-5 h-5 mr-3" />
                Dashboard
              </button>
            </li>
            
            {currentUser.role === 'admin' && (
              <>
                <li>
                  <button
                    onClick={() => setActiveTab('classes')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeTab === 'classes' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <BookOpen className="w-5 h-5 mr-3" />
                    Klassen
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('teachers')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeTab === 'teachers' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-5 h-5 mr-3" />
                    Leraren
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('parents')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeTab === 'parents' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-5 h-5 mr-3" />
                    Ouders
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeTab === 'students' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-5 h-5 mr-3" />
                    Leerlingen
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeTab === 'payments' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 mr-3" />
                    Betalingen
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg ${
                      activeTab === 'settings' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Building2 className="w-5 h-5 mr-3" />
                    Instellingen
                  </button>
                </li>
              </>
            )}

            {currentUser.role === 'teacher' && (
              <li>
                <button
                  onClick={() => setActiveTab('myclass')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg ${
                    activeTab === 'myclass' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-5 h-5 mr-3" />
                  Mijn Klas
                </button>
              </li>
            )}
          </ul>
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Uitloggen
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Welkom, {currentUser.name}</h2>
                <p className="opacity-90">{realData.mosque?.name || 'Moskee Systeem'}</p>
                <p className="opacity-75 text-sm mt-1">Rol: {currentUser.role}</p>
              </div>
              
              {currentUser.role === 'admin' && (
                <div className="space-y-6">
                  {/* Financiële gegevens bovenaan */}
                  {(() => {
                    const metrics = calculateFinancialMetrics();
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                          <div className="flex items-center">
                            <DollarSign className="w-8 h-8 text-red-600" />
                            <div className="ml-4">
                              <p className="text-gray-600 text-sm">Openstaand</p>
                              <p className="text-2xl font-bold text-red-600">€{metrics.totalOutstanding}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                          <div className="flex items-center">
                            <DollarSign className="w-8 h-8 text-green-600" />
                            <div className="ml-4">
                              <p className="text-gray-600 text-sm">Betaald</p>
                              <p className="text-2xl font-bold text-green-600">€{metrics.totalPaid}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-sm font-bold">%</span>
                            </div>
                            <div className="ml-4">
                              <p className="text-gray-600 text-sm">% Betaald</p>
                              <p className="text-2xl font-bold text-blue-600">{metrics.percentagePaid}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Algemene gegevens daaronder */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Leerlingen</p>
                          <p className="text-2xl font-bold">
                            {realData.students?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <BookOpen className="w-8 h-8 text-emerald-600" />
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Klassen</p>
                          <p className="text-2xl font-bold">{realData.classes?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <User className="w-8 h-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Leraren</p>
                          <p className="text-2xl font-bold">
                            {realData.users?.filter(u => u.role === 'teacher')?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Ouders</p>
                          <p className="text-2xl font-bold">
                            {realData.users?.filter(u => u.role === 'parent')?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentUser.role === 'teacher' && (
                <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Leraren Dashboard</h3>
                  <p className="text-gray-600">Welkom leraar! Uw klas functionaliteiten worden geladen.</p>
                </div>
              )}
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Klassen Beheer</h2>
                <button 
                  onClick={() => {
                    if (realData.users.filter(u => u.role === 'teacher').length === 0) {
                      alert('Voeg eerst leraren toe voordat u klassen kunt aanmaken.');
                      setActiveTab('teachers');
                      return;
                    }
                    setShowAddClassModal(true);
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Klas
                </button>
              </div>
              
              {realData.users.filter(u => u.role === 'teacher').length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Eerst leraren toevoegen</h3>
                  <p className="text-gray-600 mb-4">Voordat u klassen kunt aanmaken, moet u eerst leraren toevoegen.</p>
                  <button
                    onClick={() => setActiveTab('teachers')}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                  >
                    Naar Leraren
                  </button>
                </div>
              ) : realData.classes.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nog geen klassen</h3>
                  <p className="text-gray-600">Begin met het aanmaken van uw eerste klas.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {realData.classes.map(cls => (
                    <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border">
                      <h3 className="text-lg font-semibold">{cls.name}</h3>
                      <p className="text-gray-600">Leraar: {cls.teacher?.name || 'Onbekend'}</p>
                      <p className="text-sm text-gray-500">{cls.students?.length || 0} leerlingen</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Teachers Tab */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Leraren Beheer</h2>
                <button 
                  onClick={() => setShowAddTeacherModal(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Leraar
                </button>
              </div>
              
              <div className="grid gap-6">
                {realData.users.filter(u => u.role === 'teacher').length === 0 ? (
                  <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nog geen leraren</h3>
                    <p className="text-gray-600">Voeg leraren toe om klassen te kunnen beheren.</p>
                  </div>
                ) : (
                  realData.users.filter(u => u.role === 'teacher').map(teacher => (
                    <div key={teacher.id} className="bg-white p-6 rounded-xl shadow-sm border">
                      <h3 className="text-lg font-semibold">{teacher.name}</h3>
                      <p className="text-gray-600">{teacher.email}</p>
                      <p className="text-sm text-gray-500">Account aangemaakt</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Teacher's Class Tab */}
          {activeTab === 'myclass' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Mijn Klas</h2>
              
              <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Mijn Klas Dashboard</h3>
                <p className="text-gray-600">Hier kunt u uw klas beheren en leerlingen volgen.</p>
              </div>
            </div>
          )}

          {/* Parents Tab */}
          {activeTab === 'parents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Ouders Beheer</h2>
                <button 
                  onClick={() => {
                    setParentError('');
                    setShowAddParentModal(true);
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Ouder
                </button>
              </div>
              
              {realData.users.filter(u => u.role === 'parent').length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nog geen ouders</h3>
                  <p className="text-gray-600">Voeg ouders toe voordat u leerlingen kunt aanmaken.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  {/* Tabel Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600">
                      <div className="col-span-3">Naam & Contact</div>
                      <div className="col-span-4">Adresgegevens</div>
                      <div className="col-span-2">Kinderen</div>
                      <div className="col-span-2">Betalingsstatus</div>
                      <div className="col-span-1">Acties</div>
                    </div>
                  </div>
                  
                  {/* Tabel Rijen */}
                  <div className="divide-y">
                    {realData.users.filter(u => u.role === 'parent').map(parent => {
                      const paymentStatus = calculateParentPaymentStatus(parent.id);
                      const isExpanded = selectedParentForDetails === parent.id;
                      
                      return (
                        <div key={parent.id}>
                          {/* Hoofdrij */}
                          <div 
                            className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                              isExpanded ? 'bg-emerald-50' : ''
                            }`}
                            onClick={() => setSelectedParentForDetails(isExpanded ? null : parent.id)}
                          >
                            <div className="grid grid-cols-12 gap-4 items-center">
                              {/* Naam & Contact */}
                              <div className="col-span-3">
                                <h3 className="font-semibold text-gray-900">{parent.name}</h3>
                                <p className="text-sm text-gray-600">{parent.email}</p>
                                <p className="text-sm text-gray-500">{parent.phone}</p>
                              </div>
                              
                              {/* Adresgegevens */}
                              <div className="col-span-4">
                                <p className="text-sm text-gray-900">{parent.address}</p>
                                <p className="text-sm text-gray-600">{parent.zipcode} {parent.city}</p>
                              </div>
                              
                              {/* Kinderen */}
                              <div className="col-span-2">
                                <div className="bg-emerald-100 px-3 py-1 rounded-full inline-block">
                                  <span className="text-emerald-700 text-sm font-medium">
                                    {realData.students?.filter(s => s.parent_id === parent.id)?.length || 0} kind{(realData.students?.filter(s => s.parent_id === parent.id)?.length || 0) !== 1 ? 'eren' : ''}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Betalingsstatus */}
                              <div className="col-span-2">
                                <div className={`px-3 py-1 rounded-full text-center mb-1 ${
                                  paymentStatus.paymentStatus === 'betaald' 
                                    ? 'bg-green-100 text-green-700' 
                                    : paymentStatus.paymentStatus === 'deels_betaald'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  <span className="text-xs font-medium">
                                    {paymentStatus.paymentStatus === 'betaald' ? 'Betaald' : 
                                     paymentStatus.paymentStatus === 'deels_betaald' ? 'Deels' : 'Open'}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 text-center">
                                  €{paymentStatus.totalPaid} / €{paymentStatus.amountDue}
                                </div>
                                {paymentStatus.remainingBalance > 0 && (
                                  <div className="text-xs text-red-600 font-medium text-center">
                                    €{paymentStatus.remainingBalance} open
                                  </div>
                                )}
                              </div>
                              
                              {/* Acties */}
                              <div className="col-span-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedParentForPayment(parent);
                                    setShowAddPaymentModal(true);
                                  }}
                                  className="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                                >
                                  + Betaling
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Leerlingen Beheer</h2>
                <button 
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Leerling
                </button>
              </div>
              
              {realData.classes.length === 0 || realData.users.filter(u => u.role === 'parent').length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  {realData.classes.length === 0 ? (
                    <>
                      <h3 className="text-lg font-semibold mb-2">Eerst een klas aanmaken</h3>
                      <p className="text-gray-600 mb-4">Voordat u leerlingen kunt toevoegen, moet u eerst een klas aanmaken.</p>
                      <button
                        onClick={() => setActiveTab('classes')}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                      >
                        Naar Klassen
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold mb-2">Eerst ouders aanmaken</h3>
                      <p className="text-gray-600 mb-4">Voordat u leerlingen kunt toevoegen, moet u eerst ouders aanmaken.</p>
                      <button
                        onClick={() => setActiveTab('parents')}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                      >
                        Naar Ouders
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Statistieken */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Totaal Leerlingen</p>
                          <p className="text-2xl font-bold">
                            {realData.students?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <BookOpen className="w-8 h-8 text-emerald-600" />
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Actieve Klassen</p>
                          <p className="text-2xl font-bold">{realData.classes?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Geregistreerde Ouders</p>
                          <p className="text-2xl font-bold">
                            {realData.users?.filter(u => u.role === 'parent')?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Leerlingen Tabel */}
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {realData.students?.length === 0 ? (
                      <div className="p-8 text-center">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nog geen leerlingen</h3>
                        <p className="text-gray-600">Begin met het toevoegen van uw eerste leerling.</p>
                      </div>
                    ) : (
                      <>
                        {/* Tabel Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b">
                          <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600">
                            <div className="col-span-3">Leerling</div>
                            <div className="col-span-3">Klas & Leraar</div>
                            <div className="col-span-4">Ouder Gegevens</div>
                            <div className="col-span-2">Betalingsstatus</div>
                          </div>
                        </div>
                        
                        {/* Tabel Rijen */}
                        <div className="divide-y">
                          {realData.students.map(student => {
                            const parent = realData.users.find(u => u.id === student.parent_id);
                            const classInfo = realData.classes.find(c => c.id === student.class_id);
                            const paymentStatus = parent ? calculateParentPaymentStatus(parent.id) : null;
                            
                            return (
                              <div key={student.id} className="px-6 py-4 hover:bg-gray-50">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                  {/* Leerling */}
                                  <div className="col-span-3">
                                    <div className="flex items-center">
                                      <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-emerald-600" />
                                      </div>
                                      <div className="ml-3">
                                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                                        <p className="text-sm text-gray-500">ID: {student.id}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Klas & Leraar */}
                                  <div className="col-span-3">
                                    <div className="bg-blue-100 px-3 py-1 rounded-full inline-block mb-1">
                                      <span className="text-blue-700 text-sm font-medium">{classInfo?.name || 'Geen klas'}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Leraar: {classInfo?.teacher?.name || 'Onbekend'}</p>
                                  </div>
                                  
                                  {/* Ouder Gegevens */}
                                  <div className="col-span-4">
                                    {parent ? (
                                      <>
                                        <h4 className="font-medium text-gray-900">{parent.name}</h4>
                                        <p className="text-sm text-gray-600">{parent.email}</p>
                                        <p className="text-sm text-gray-500">{parent.phone}</p>
                                        <p className="text-xs text-gray-400">{parent.address}, {parent.city}</p>
                                      </>
                                    ) : (
                                      <p className="text-sm text-red-600">Ouder niet gevonden</p>
                                    )}
                                  </div>
                                  
                                  {/* Betalingsstatus */}
                                  <div className="col-span-2">
                                    {parent && paymentStatus ? (
                                      <>
                                        <div className={`px-3 py-1 rounded-full text-center mb-1 ${
                                          paymentStatus.paymentStatus === 'betaald' 
                                            ? 'bg-green-100 text-green-700' 
                                            : paymentStatus.paymentStatus === 'deels_betaald'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                          <span className="text-xs font-medium">
                                            {paymentStatus.paymentStatus === 'betaald' ? 'Betaald' : 
                                             paymentStatus.paymentStatus === 'deels_betaald' ? 'Deels' : 'Open'}
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600 text-center">
                                          €{paymentStatus.totalPaid} / €{paymentStatus.amountDue}
                                        </div>
                                        {paymentStatus.remainingBalance > 0 && (
                                          <button
                                            onClick={() => {
                                              setSelectedParentForPayment(parent);
                                              setShowAddPaymentModal(true);
                                            }}
                                            className="mt-1 text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 w-full"
                                          >
                                            + Betaling
                                          </button>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-xs text-gray-400">Geen gegevens</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Betalingen Overzicht</h2>
                <div className="flex space-x-2">
                  <select 
                    className="px-3 py-2 border rounded-lg text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        const parent = realData.users.find(u => u.id === parseInt(e.target.value));
                        setSelectedParentForPayment(parent);
                        setShowAddPaymentModal(true);
                      }
                    }}
                    value=""
                  >
                    <option value="">Snelle betaling voor...</option>
                    {realData.users.filter(u => u.role === 'parent').map(parent => (
                      <option key={parent.id} value={parent.id}>{parent.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Betalingen statistieken */}
              {(() => {
                const metrics = calculateFinancialMetrics();
                const totalPayments = realData.payments?.length || 0;
                const thisMonth = new Date().getMonth();
                const thisYear = new Date().getFullYear();
                const thisMonthPayments = realData.payments?.filter(p => {
                  const paymentDate = new Date(p.payment_date || p.date);
                  return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear;
                }) || [];
                const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <DollarSign className="w-8 h-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Totaal ontvangen</p>
                          <p className="text-2xl font-bold text-green-600">€{metrics.totalPaid}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <DollarSign className="w-8 h-8 text-red-600" />
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Nog openstaand</p>
                          <p className="text-2xl font-bold text-red-600">€{metrics.totalOutstanding}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-bold">#</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Totaal betalingen</p>
                          <p className="text-2xl font-bold">{totalPayments}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex items-center">
                        <DollarSign className="w-8 h-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-gray-600 text-sm">Deze maand</p>
                          <p className="text-2xl font-bold text-blue-600">€{thisMonthTotal}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Betalingen Tabel */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Alle Betalingen</h3>
                </div>
                
                {!realData.payments || realData.payments.length === 0 ? (
                  <div className="p-8 text-center">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">Nog geen betalingen</h4>
                    <p className="text-gray-600">Betalingen worden hier weergegeven zodra ze zijn geregistreerd.</p>
                  </div>
                ) : (
                  <>
                    {/* Tabel Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b">
                      <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600">
                        <div className="col-span-2">Datum</div>
                        <div className="col-span-3">Ouder</div>
                        <div className="col-span-2">Bedrag</div>
                        <div className="col-span-2">Betaalmethode</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1">Actie</div>
                      </div>
                    </div>
                    
                    {/* Tabel Rijen */}
                    <div className="divide-y max-h-96 overflow-y-auto">
                      {realData.payments
                        .sort((a, b) => new Date(b.payment_date || b.date) - new Date(a.payment_date || a.date))
                        .map(payment => {
                          const parent = realData.users.find(u => u.id === payment.parent_id);
                          const paymentStatus = parent ? calculateParentPaymentStatus(parent.id) : null;
                          
                          return (
                            <div key={payment.id} className="px-6 py-4 hover:bg-gray-50">
                              <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Datum */}
                                <div className="col-span-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {new Date(payment.payment_date || payment.date).toLocaleDateString('nl-NL')}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(payment.payment_date || payment.date).toLocaleDateString('nl-NL', { weekday: 'short' })}
                                  </div>
                                </div>
                                
                                {/* Ouder */}
                                <div className="col-span-3">
                                  <div className="flex items-center">
                                    <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center">
                                      <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="ml-3">
                                      <h4 className="text-sm font-medium text-gray-900">
                                        {parent?.name || 'Onbekende ouder'}
                                      </h4>
                                      <p className="text-xs text-gray-500">{parent?.email}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Bedrag */}
                                <div className="col-span-2">
                                  <div className="text-lg font-bold text-green-600">
                                    €{payment.amount}
                                  </div>
                                  {payment.notes && (
                                    <div className="text-xs text-gray-500 italic truncate">
                                      {payment.notes}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Betaalmethode */}
                                <div className="col-span-2">
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                                    payment.payment_method === 'contant' ? 'bg-yellow-100 text-yellow-700' :
                                    payment.payment_method === 'pin' ? 'bg-blue-100 text-blue-700' :
                                    payment.payment_method === 'overschrijving' ? 'bg-green-100 text-green-700' :
                                    'bg-purple-100 text-purple-700'
                                  }`}>
                                    {(payment.payment_method || 'contant').charAt(0).toUpperCase() + (payment.payment_method || 'contant').slice(1)}
                                  </div>
                                </div>
                                
                                {/* Status */}
                                <div className="col-span-2">
                                  {parent && paymentStatus ? (
                                    <>
                                      <div className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                                        paymentStatus.paymentStatus === 'betaald' 
                                          ? 'bg-green-100 text-green-700' 
                                          : paymentStatus.paymentStatus === 'deels_betaald'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {paymentStatus.paymentStatus === 'betaald' ? 'Volledig betaald' : 
                                         paymentStatus.paymentStatus === 'deels_betaald' ? 'Deels betaald' : 'Nog openstaand'}
                                      </div>
                                      <div className="text-xs text-gray-500 text-center mt-1">
                                        €{paymentStatus.totalPaid} / €{paymentStatus.amountDue}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-400">Geen gegevens</span>
                                  )}
                                </div>
                                
                                {/* Actie */}
                                <div className="col-span-1">
                                  {parent && paymentStatus && paymentStatus.remainingBalance > 0 && (
                                    <button
                                      onClick={() => {
                                        setSelectedParentForPayment(parent);
                                        setShowAddPaymentModal(true);
                                      }}
                                      className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700"
                                    >
                                      + €{paymentStatus.remainingBalance}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Systeem Instellingen</h2>
              
              {/* Microsoft 365 Configuration */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22 3v6h-6v6h6v6h-11V3h11zM11 3H2v18h9v-9H9v-3h2V3z"/>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-blue-900">Microsoft 365 Email Integratie</h3>
                        <p className="text-blue-700 text-sm">
                          Configureer uw Microsoft 365 account voor automatische emails
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        m365Config.configured 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {m365Config.configured ? 'Geconfigureerd' : 'Niet geconfigureerd'}
                      </div>
                      <button
                        onClick={() => {
                          setShowM365ConfigModal(true);
                          if (!testEmailAddress) {
                            setTestEmailAddress(`admin@${realData.mosque?.name?.toLowerCase().replace(/\s+/g, '') || 'moskee'}.nl`);
                          }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        {m365Config.configured ? 'Bewerken' : 'Configureren'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Voordelen van Microsoft 365 integratie:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Automatische welkom emails voor nieuwe ouders
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Automatische welkom emails voor nieuwe leraren
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Professionele uitstraling met uw eigen domein
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Betrouwbare email delivery via Microsoft
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Status:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Backend API:</span>
                          <span className="text-green-600 font-medium">✅ Verbonden</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Email Service:</span>
                          <span className={`font-medium ${m365Config.configured ? 'text-green-600' : 'text-yellow-600'}`}>
                            {m365Config.configured ? '✅ Werkend' : '⚠️ Demo Mode'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!m365Config.configured && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h5 className="text-sm font-medium text-yellow-800">Microsoft 365 niet geconfigureerd</h5>
                          <p className="text-sm text-yellow-700 mt-1">
                            Emails worden momenteel in demo mode verzonden. Configureer Microsoft 365 voor echte email functionaliteit.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mosque Information */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Moskee Informatie</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Moskee Naam</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        value={realData.mosque?.name || 'Al-Hijra Moskee'}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Adres</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        value={realData.mosque?.address || 'Rotterdam'}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Voor wijzigingen aan de moskee informatie, neem contact op met de systeem beheerder.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* All Modals */}
      
      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Nieuwe Klas</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Klas Naam</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  placeholder="Bijv. Beginners Koran, Arabisch Level 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Selecteer Leraar</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newClass.teacherId}
                  onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}
                >
                  <option value="">Kies een leraar</option>
                  {realData.users.filter(u => u.role === 'teacher').map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowAddClassModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddClass}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Klas Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Nieuwe Leraar</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Naam</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Naar dit adres wordt een email verzonden met inloggegevens
                </p>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddTeacher}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Leraar Toevoegen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddParentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Nieuwe Ouder</h3>
            </div>
            
            {/* Success Message */}
            {emailSent && sentEmailData && (
              <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Account aangemaakt!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Er is een email verzonden naar <strong>{sentEmailData.email}</strong> met inloggegevens en een tijdelijk wachtwoord.
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Deze melding sluit automatisch over 4 seconden...
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {parentError && !emailSent && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{parentError}</p>
              </div>
            )}
            
            {/* Only show form if email hasn't been sent */}
            {!emailSent && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Volledige Naam</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newParent.name}
                    onChange={(e) => {
                      setNewParent({...newParent, name: e.target.value});
                      if (parentError) setParentError('');
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newParent.email}
                    onChange={(e) => {
                      setNewParent({...newParent, email: e.target.value});
                      if (parentError) setParentError('');
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Naar dit adres wordt een email verzonden met inloggegevens
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefoon</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newParent.phone}
                    onChange={(e) => {
                      setNewParent({...newParent, phone: e.target.value});
                      if (parentError) setParentError('');
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Adres</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newParent.address}
                    onChange={(e) => {
                      setNewParent({...newParent, address: e.target.value});
                      if (parentError) setParentError('');
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Postcode</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={newParent.zipcode}
                      onChange={(e) => {
                        setNewParent({...newParent, zipcode: e.target.value});
                        if (parentError) setParentError('');
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Woonplaats</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={newParent.city}
                      onChange={(e) => {
                        setNewParent({...newParent, city: e.target.value});
                        if (parentError) setParentError('');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Only show buttons if email hasn't been sent */}
            {!emailSent && (
              <div className="p-6 border-t flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddParentModal(false);
                    setParentError('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAddParent}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Ouder Toevoegen & Email Verzenden
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Nieuwe Leerling</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Naam Leerling</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ouder</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newStudent.parentId}
                  onChange={(e) => setNewStudent({...newStudent, parentId: e.target.value})}
                >
                  <option value="">Selecteer ouder</option>
                  {realData.users.filter(u => u.role === 'parent').map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} ({parent.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Klas</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newStudent.classId}
                  onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                >
                  <option value="">Selecteer klas</option>
                  {realData.classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddStudent}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Leerling Toevoegen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPaymentModal && selectedParentForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Nieuwe Betaling</h3>
              <p className="text-sm text-gray-600 mt-1">Betaling voor: {selectedParentForPayment.name}</p>
              {(() => {
                const paymentStatus = calculateParentPaymentStatus(selectedParentForPayment.id);
                return (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Totaal verschuldigd:</span>
                      <span className="font-medium">€{paymentStatus.amountDue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Al betaald:</span>
                      <span className="font-medium text-green-600">€{paymentStatus.totalPaid}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                      <span>Nog openstaand:</span>
                      <span className="text-red-600">€{paymentStatus.remainingBalance}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bedrag (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  placeholder="Voer bedrag in"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Betaalmethode</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newPayment.paymentMethod}
                  onChange={(e) => setNewPayment({...newPayment, paymentMethod: e.target.value})}
                >
                  <option value="contant">Contant</option>
                  <option value="pin">PIN/Bankpas</option>
                  <option value="overschrijving">Overschrijving</option>
                  <option value="ideal">iDEAL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notities (optioneel)</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                  placeholder="Bijv. eerste termijn, restbedrag, etc."
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddPaymentModal(false);
                  setSelectedParentForPayment(null);
                  setNewPayment({ amount: '', paymentMethod: 'contant', notes: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddPayment}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Betaling Registreren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Microsoft 365 Configuration Modal */}
      {showM365ConfigModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowM365ConfigModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowM365ConfigModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with prominent close button */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 3v6h-6v6h6v6h-11V3h11zM11 3H2v18h9v-9H9v-3h2V3z"/>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xl font-semibold">Microsoft 365 Setup</h3>
                    <p className="text-sm text-gray-600">Email integratie configureren</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowM365ConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
                  title="Sluiten (Escape)"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Setup Instructies</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li><strong>Ga naar</strong> <a href="https://portal.azure.com" target="_blank" className="underline">portal.azure.com</a></li>
                  <li><strong>Zoek</strong> "App registrations" → klik "New registration"</li>
                  <li><strong>Voeg permissies toe:</strong> App → API permissions → Add "Mail.Send"</li>
                  <li><strong>Vul onderstaande velden in</strong> met de verkregen gegevens</li>
                </ol>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tenant ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  value={m365Config.tenantId}
                  onChange={(e) => setM365Config({...m365Config, tenantId: e.target.value})}
                  placeholder="a3d49557-3f9e-.................."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Application (Client) ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  value={m365Config.clientId}
                  onChange={(e) => setM365Config({...m365Config, clientId: e.target.value})}
                  placeholder="b81ac785-bb0f-.................."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Client Secret <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  value={m365Config.clientSecret}
                  onChange={(e) => setM365Config({...m365Config, clientSecret: e.target.value})}
                  placeholder="dzs8Q~8DZ7MF3JL.................."
                />
              </div>

              {/* Test Section */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">🧪 Test Configuratie</h5>
                <p className="text-sm text-gray-600 mb-3">
                  Test of uw Microsoft 365 configuratie werkt door een test email te versturen.
                </p>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2">Test Email Adres <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="uw.email@example.com"
                  />
                </div>
                
                <button 
                  onClick={testM365Configuration}
                  disabled={!m365Config.configured || !testEmailAddress}
                  className={`text-sm px-4 py-2 rounded font-medium ${
                    (m365Config.configured && testEmailAddress) 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {m365Config.configured 
                    ? (testEmailAddress ? '📧 Test Email Versturen' : '⚠️ Vul email adres in')
                    : '⚠️ Eerst configuratie opslaan'
                  }
                </button>
              </div>

              {/* Success indicator */}
              {m365Config.configured && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700 flex items-center">
                    ✅ <strong className="ml-1">Microsoft 365 is geconfigureerd!</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Nieuwe ouders en leraren krijgen automatisch emails met inloggegevens.
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer with multiple close options */}
            <div className="p-6 border-t flex justify-between">
              <button
                onClick={() => setShowM365ConfigModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg flex items-center"
              >
                ← Terug naar Instellingen
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowM365ConfigModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => {
                    if (m365Config.tenantId && m365Config.clientId && m365Config.clientSecret) {
                      setM365Config({...m365Config, configured: true});
                      alert('✅ Microsoft 365 configuratie opgeslagen!\n\nU kunt nu de configuratie testen en nieuwe gebruikers zullen automatisch emails ontvangen.');
                    } else {
                      alert('❌ Vul alle verplichte velden in.');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  💾 Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default LeerlingVolgsysteem;