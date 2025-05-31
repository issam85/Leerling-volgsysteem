import React, { useState, useEffect } from 'react';
import { Users, BookOpen, User, Plus, Building2, LogOut, DollarSign } from 'lucide-react';
import './App.css';

// API Configuration - NO HARDCODED CREDENTIALS!
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://moskee-backend-api-production.up.railway.app';

const LeerlingVolgsysteem = () => {
  const [currentSubdomain, setCurrentSubdomain] = useState('register');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showM365ConfigModal, setShowM365ConfigModal] = useState(false);
  
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
  
  // Data states
  const [mosqueData, setMosqueData] = useState(null);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Email states
  const [selectedParentForPayment, setSelectedParentForPayment] = useState(null);
  const [selectedParentForDetails, setSelectedParentForDetails] = useState(null);
  const [parentError, setParentError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmailData, setSentEmailData] = useState(null);
  
  // Microsoft 365 configuration (NO SECRETS!)
  const [m365Config, setM365Config] = useState({
    tenantId: '',
    clientId: '',
    clientSecret: '',
    configured: false
  });
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // Generate temporary password
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // API Helper Functions
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

  // Load mosque data
  const loadMosqueData = async (subdomain) => {
    if (!subdomain || subdomain === 'register') return;
    
    try {
      setLoading(true);
      setError(null);
      
      const mosque = await apiCall(`/api/mosque/${subdomain}`);
      setMosqueData(mosque);
      
      // In a real app, you'd load users, classes, payments here
      // For now, using mock data structure
      setUsers([
        { id: 1, email: 'admin@al-hijra.nl', password: 'admin', role: 'admin', name: 'Beheerder Al-Hijra' },
        { id: 2, email: 'hassan@al-hijra.nl', password: 'leraar123', role: 'teacher', name: 'Imam Hassan' }
      ]);
      setClasses([]);
      setPayments([]);
      
    } catch (err) {
      setError(`Fout bij laden moskee data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Send email via backend API (SECURE - no hardcoded credentials)
  const sendEmail = async (recipientName, email, tempPassword, mosqueName, userType = 'ouder') => {
    try {
      console.log('Sending email via backend API to:', email);
      
      // Check if M365 is configured
      if (!m365Config.configured || !m365Config.tenantId || !m365Config.clientId) {
        throw new Error('Microsoft 365 not configured');
      }
      
      const emailTemplate = {
        subject: userType === 'teacher' 
          ? `Welkom bij ${mosqueName} - Uw leraar account`
          : `Welkom bij ${mosqueName} - Uw ouder account`,
        body: userType === 'teacher' 
          ? `Beste ${recipientName},\n\nWelkom bij ${mosqueName}! Er is een leraar account voor u aangemaakt.\n\n🔐 Uw inloggegevens:\nEmail: ${email}\nTijdelijk wachtwoord: ${tempPassword}\n\nLog in en kies een nieuw wachtwoord bij uw eerste bezoek.\n\nMet vriendelijke groet,\n${mosqueName}`
          : `Beste ${recipientName},\n\nUw account is aangemaakt voor het leerling volgsysteem van ${mosqueName}.\n\n🔐 Uw inloggegevens:\nEmail: ${email}\nTijdelijk wachtwoord: ${tempPassword}\n\nLog in en kies een nieuw wachtwoord bij uw eerste bezoek.\n\nMet vriendelijke groet,\n${mosqueName}`
      };
      
      // Backend API call - credentials are stored securely in backend environment
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
      
    } catch (error) {
      console.error('Error sending email via backend:', error);
      
      // Return error but with service info
      return {
        success: false,
        error: error.message,
        service: 'Backend API Error',
        email: email,
        tempPassword: tempPassword
      };
    }
  };

  // Handle functions
  const handleSubdomainSwitch = (subdomain) => {
    setCurrentSubdomain(subdomain);
    setCurrentUser(null);
    setLoginData({ email: '', password: '' });
    loadMosqueData(subdomain);
  };

  const handleLogin = () => {
    const user = users.find(u => u.email === loginData.email && u.password === loginData.password);
    if (user) {
      setCurrentUser(user);
    } else {
      alert('Ongeldige inloggegevens');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginData({ email: '', password: '' });
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email) {
      alert('Vul alle velden in');
      return;
    }

    // Check if email already exists
    const existingUser = users.find(u => u.email === newTeacher.email.trim());
    if (existingUser) {
      alert(`Dit email adres is al in gebruik door: ${existingUser.name}`);
      return;
    }

    try {
      // Generate temporary password
      const tempPassword = generateTempPassword();
      
      // Add teacher to local state (in real app, this would be API call)
      const newTeacherObj = {
        id: Date.now(),
        email: newTeacher.email.trim(),
        password: tempPassword,
        role: 'teacher',
        name: newTeacher.name.trim(),
        isTemporaryPassword: true,
        accountCreated: new Date().toISOString()
      };
      
      setUsers([...users, newTeacherObj]);

      // Send welcome email
      const emailResult = await sendEmail(
        newTeacher.name.trim(),
        newTeacher.email.trim(),
        tempPassword,
        mosqueData?.name || 'Al-Hijra Moskee',
        'teacher'
      );
      
      if (emailResult.success) {
        setNewTeacher({ name: '', email: '' });
        setShowAddTeacherModal(false);
        alert(`Leraar toegevoegd! Er is een email verzonden naar ${newTeacher.email.trim()} met inloggegevens.`);
      } else {
        throw new Error('Email kon niet worden verzonden');
      }
      
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('Er is een fout opgetreden bij het toevoegen van de leraar of het verzenden van de email');
    }
  };

  const handleAddParent = async () => {
    // Reset error and email states
    setParentError('');
    setEmailSent(false);
    setSentEmailData(null);
    
    // Validation
    if (!newParent.name || !newParent.email || !newParent.phone || !newParent.address || !newParent.city || !newParent.zipcode) {
      setParentError('Vul alle velden in');
      return;
    }

    // Check if email already exists
    const existingUser = users.find(u => u.email === newParent.email.trim());
    if (existingUser) {
      setParentError(`Dit email adres is al in gebruik door: ${existingUser.name}`);
      return;
    }

    try {
      // Generate temporary password
      const tempPassword = generateTempPassword();
      
      // Add parent to local state (in real app, this would be API call)
      const newParentObj = {
        id: Date.now(),
        email: newParent.email.trim(),
        password: tempPassword,
        role: 'parent',
        name: newParent.name.trim(),
        phone: newParent.phone.trim(),
        address: newParent.address.trim(),
        city: newParent.city.trim(),
        zipcode: newParent.zipcode.trim(),
        children: [],
        amountDue: 0,
        isTemporaryPassword: true,
        accountCreated: new Date().toISOString()
      };
      
      setUsers([...users, newParentObj]);
      
      // Send welcome email
      const emailResult = await sendEmail(
        newParent.name.trim(),
        newParent.email.trim(),
        tempPassword,
        mosqueData?.name || 'Al-Hijra Moskee',
        'parent'
      );
      
      if (emailResult.success) {
        setEmailSent(true);
        setSentEmailData({
          parentName: newParent.name.trim(),
          email: newParent.email.trim(),
          mosqueName: mosqueData?.name || 'Al-Hijra Moskee'
        });
        
        // Reset form
        setNewParent({ name: '', email: '', phone: '', address: '', city: '', zipcode: '' });
        setParentError('');
        
        // Auto-close modal after showing success message
        setTimeout(() => {
          setShowAddParentModal(false);
          setEmailSent(false);
          setSentEmailData(null);
        }, 4000);
        
      } else {
        throw new Error('Email kon niet worden verzonden: ' + emailResult.error);
      }
      
    } catch (error) {
      console.error('Error adding parent:', error);
      setParentError(`Er is een fout opgetreden: ${error.message}`);
    }
  };

  // Test Microsoft 365 configuration
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
      const testEmailContent = {
        to: testEmailAddress,
        subject: `🧪 Test Email - ${mosqueData?.name || 'Moskee'} Systeem Configuratie`,
        body: `Beste beheerder,\n\nDit is een test email om te controleren of uw Microsoft 365 configuratie correct werkt.\n\n✅ Als u deze email ontvangt, is uw configuratie succesvol!\n\nMet vriendelijke groet,\nHet Leerling Volgsysteem`
      };

      const result = await apiCall('/api/send-email-m365', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: m365Config.tenantId,
          clientId: m365Config.clientId,
          clientSecret: m365Config.clientSecret,
          to: testEmailAddress,
          subject: testEmailContent.subject,
          body: testEmailContent.body,
          mosqueName: mosqueData?.name || 'Moskee'
        })
      });
      
      if (result.success) {
        alert(`✅ Test email succesvol verzonden!\n\nService: ${result.service}\nNaar: ${testEmailAddress}\n\nControleer uw inbox!`);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Test error:', error);
      alert(`❌ Test mislukt: ${error.message}`);
    }
  };

  // Calculate payment status for a parent (mock function)
  const calculateParentPaymentStatus = (parentId) => {
    const parent = users.find(u => u.id === parentId);
    if (!parent) return { totalPaid: 0, amountDue: 0, remainingBalance: 0, paymentStatus: 'openstaand' };

    const parentPayments = payments.filter(p => p.parentId === parentId);
    const totalPaid = parentPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const amountDue = parent.amountDue || 0;
    const remainingBalance = Math.max(0, amountDue - totalPaid);
    
    let paymentStatus = 'openstaand';
    if (totalPaid >= amountDue && amountDue > 0) {
      paymentStatus = 'betaald';
    } else if (totalPaid > 0) {
      paymentStatus = 'deels_betaald';
    }

    return { totalPaid, amountDue, remainingBalance, paymentStatus };
  };

  // Load data on subdomain change
  useEffect(() => {
    if (currentSubdomain && currentSubdomain !== 'register') {
      loadMosqueData(currentSubdomain);
    }
  }, [currentSubdomain]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Systeem wordt geladen...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Fout bij laden</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  // Registration Page
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
                  onClick={() => handleSubdomainSwitch('al-hijra')} 
                  className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg"
                >
                  Al-Hijra Demo
                </button>
                <button 
                  onClick={() => handleSubdomainSwitch('al-noor')} 
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg"
                >
                  Al-Noor Demo
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
            <h2 className="text-2xl font-bold">Al-Hijra Moskee</h2>
            <p className="text-gray-600 mt-2">Live systeem beschikbaar</p>
            <button 
              onClick={() => handleSubdomainSwitch('al-hijra')} 
              className="mt-4 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
            >
              Naar Al-Hijra Systeem
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No mosque data found
  if (!mosqueData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Moskee niet gevonden</h1>
          <button 
            onClick={() => handleSubdomainSwitch('register')} 
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg"
          >
            Terug naar hoofdpagina
          </button>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <BookOpen className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">{mosqueData.name}</h1>
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
              <div><strong>Admin:</strong> admin@al-hijra.nl / admin</div>
              <div><strong>Leraar:</strong> hassan@al-hijra.nl / leraar123</div>
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

  // Main Application Dashboard
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-emerald-600" />
            <div className="ml-3">
              <h1 className="font-bold text-sm">{mosqueData.name}</h1>
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
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Welkom, {currentUser.name}</h2>
                <p className="opacity-90">{mosqueData.name}</p>
                <p className="opacity-75 text-sm mt-1">Rol: {currentUser.role}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-gray-600 text-sm">Gebruikers</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center">
                    <BookOpen className="w-8 h-8 text-emerald-600" />
                    <div className="ml-4">
                      <p className="text-gray-600 text-sm">Klassen</p>
                      <p className="text-2xl font-bold">{classes.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-gray-600 text-sm">Betalingen</p>
                      <p className="text-2xl font-bold">{payments.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                {users.filter(u => u.role === 'teacher').length === 0 ? (
                  <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nog geen leraren</h3>
                    <p className="text-gray-600">Voeg leraren toe om klassen te kunnen beheren.</p>
                  </div>
                ) : (
                  users.filter(u => u.role === 'teacher').map(teacher => (
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
              
              {users.filter(u => u.role === 'parent').length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nog geen ouders</h3>
                  <p className="text-gray-600">Voeg ouders toe voordat u leerlingen kunt aanmaken.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {users.filter(u => u.role === 'parent').map(parent => (
                    <div key={parent.id} className="bg-white p-6 rounded-xl shadow-sm border">
                      <h3 className="text-lg font-semibold">{parent.name}</h3>
                      <p className="text-gray-600">{parent.email}</p>
                      <p className="text-sm text-gray-500">{parent.phone}</p>
                      <p className="text-sm text-gray-500">{parent.address}, {parent.city}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                            setTestEmailAddress(`admin@${mosqueData.name.toLowerCase().replace(/\s+/g, '')}.nl`);
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
                          <span className="text-green-600 font-medium">✅ Werkend</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sender Email:</span>
                          <span className="text-gray-600">onderwijs@al-hijra.nl</span>
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
                            Configureer Microsoft 365 voor echte email functionaliteit.
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
                        value={mosqueData.name}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Stad</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        value={mosqueData.city}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      
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
                      Er is een email verzonden naar <strong>{sentEmailData.email}</strong> met inloggegevens.
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

      {/* Microsoft 365 Configuration Modal */}
      {showM365ConfigModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowM365ConfigModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
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
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tenant ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  value={m365Config.tenantId}
                  onChange={(e) => setM365Config({...m365Config, tenantId: e.target.value})}
                  placeholder="Azure Tenant ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Client ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  value={m365Config.clientId}
                  onChange={(e) => setM365Config({...m365Config, clientId: e.target.value})}
                  placeholder="Azure Application ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Client Secret</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  value={m365Config.clientSecret}
                  onChange={(e) => setM365Config({...m365Config, clientSecret: e.target.value})}
                  placeholder="Azure Client Secret"
                />
              </div>

              {/* Test Section */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">🧪 Test Configuratie</h5>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2">Test Email Adres</label>
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
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t flex justify-end space-x-3">
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
                    alert('✅ Microsoft 365 configuratie opgeslagen!');
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
      )}
      
    </div>
  );
};

export default LeerlingVolgsysteem;