// src/pages/DashboardPage.js - MODERNE EN PROFESSIONELE VERSIE
import React, { useState } from 'react';
import TrialBanner from '../components/TrialBanner';
import { useTrialStatus } from '../hooks/useTrialStatus';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateFinancialMetrics, calculateParentPaymentStatus } from '../utils/financials';
import { apiCall } from '../services/api';
import { 
  DollarSign, 
  Users, 
  BookOpen as ClassIcon, 
  User as UserIcon, 
  Mail, 
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  Bell,
  Euro
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import MailModal from '../components/MailModal';
import { useNavigate, Link } from 'react-router-dom';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { realData } = useData();
  const { trialStatus } = useTrialStatus();
  const { users, students, classes, payments, mosque, loading: dataLoading, error: dataError } = realData;
  const navigate = useNavigate();

  // State voor de email modal
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailFeedback, setMailFeedback] = useState({ type: '', text: '' });

  // Loading en Error states
  if (dataLoading || !currentUser) {
    return <LoadingSpinner message="Dashboard laden..." />;
  }
  if (dataError) {
    return <div className="p-8 text-center text-red-600">Fout bij laden: {dataError}</div>;
  }

  // Functie om email naar commissie te versturen
  const handleSendCommitteeEmail = async ({ subject, body }) => {
    setMailLoading(true);
    setMailFeedback({ type: '', text: '' });
    try {
      const result = await apiCall('/api/email/send-generic', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: mosque.contact_committee_email,
          subject,
          body
        })
      });
      if (!result.success) throw new Error(result.error || 'Versturen mislukt');
      
      setMailFeedback({ type: 'success', text: 'E-mail succesvol verzonden!' });
      setIsMailModalOpen(false);
    } catch (error) {
      setMailFeedback({ type: 'error', text: `Fout: ${error.message}` });
    } finally {
      setMailLoading(false);
    }
  };

  // --- Data voorbereiden voor de UI ---

  // Admin Data
  const adminData = (() => {
    if (currentUser.role !== 'admin') return null;
    const financialMetrics = (users && payments) ? calculateFinancialMetrics(users, payments) : null;
    return {
      financialMetrics,
      statsCards: [
        { 
          label: 'Leerlingen', 
          value: students?.length || 0, 
          icon: Users, 
          color: 'emerald',
          bgGradient: 'from-emerald-500 to-emerald-600',
          change: '+12%',
          changeType: 'positive'
        },
        { 
          label: 'Klassen', 
          value: classes?.length || 0, 
          icon: ClassIcon, 
          color: 'blue',
          bgGradient: 'from-blue-500 to-blue-600',
          change: '+2',
          changeType: 'positive'
        },
        { 
          label: 'Leraren', 
          value: users?.filter(u => u.role === 'teacher').length || 0, 
          icon: UserIcon, 
          color: 'purple',
          bgGradient: 'from-purple-500 to-purple-600',
          change: 'Stabiel',
          changeType: 'neutral'
        },
        { 
          label: 'Ouders', 
          value: users?.filter(u => u.role === 'parent').length || 0, 
          icon: Users, 
          color: 'orange',
          bgGradient: 'from-orange-500 to-orange-600',
          change: '+8%',
          changeType: 'positive'
        },
      ],
      financialCards: financialMetrics ? [
        { 
          label: 'Totaal Openstaand', 
          value: `€${financialMetrics.totalOutstanding}`, 
          icon: TrendingUp, 
          color: 'red',
          bgGradient: 'from-red-500 to-red-600',
          description: 'Dit kwartaal'
        },
        { 
          label: 'Totaal Betaald', 
          value: `€${financialMetrics.totalPaid}`, 
          icon: Euro, 
          color: 'green',
          bgGradient: 'from-green-500 to-green-600',
          description: 'Deze maand'
        },
        { 
          label: 'Betalingsratio', 
          value: `${financialMetrics.percentagePaid}%`, 
          icon: Award, 
          color: 'indigo',
          bgGradient: 'from-indigo-500 to-indigo-600',
          description: 'Van totaal'
        }
      ] : []
    };
  })();

  // Parent Data
  const parentData = (() => {
    if (currentUser.role !== 'parent') return null;
    const myChildren = students ? students.filter(s => String(s.parent_id) === String(currentUser.id)) : [];
    const firstChild = myChildren[0];
    const firstClass = firstChild && classes ? classes.find(c => c.id === firstChild.class_id) : null;
    const teacherOfFirstChild = firstClass && users ? users.find(u => u.id === firstClass.teacher_id) : null;
    
    return {
      myChildren,
      childrenCount: myChildren.length,
      paymentInfo: (users && payments) ? calculateParentPaymentStatus(currentUser.id, users, payments) : null,
      firstChildId: firstChild?.id,
      teacherEmail: teacherOfFirstChild?.email
    };
  })();

  const welcomeMessageName = currentUser.name || "Gebruiker";
  const mosqueDisplayName = mosque?.name || 'Leerling Volgsysteem';
  const userRoleDisplay = currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : "Onbekend";

  return (
    <div className="space-y-8">
      <TrialBanner trialStatus={trialStatus} />
      {/* Moderne Welkomstbanner met meer visuele impact */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-8 text-white shadow-2xl">
        {/* Decoratieve elementen */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Welkom terug, {welcomeMessageName}! ✨
              </h2>
              <p className="opacity-90 text-xl mb-1">{mosqueDisplayName}</p>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                  <UserIcon className="w-4 h-4 mr-2" />
                  {userRoleDisplay}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <Bell className="w-8 h-8 opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard - Verbeterde Styling */}
      {currentUser.role === 'admin' && adminData && (
        <div className="space-y-8">
          {/* Financieel Overzicht - Moderne Cards */}
          {adminData.financialMetrics && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">💰 Financieel Overzicht</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Live data
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminData.financialCards.map(card => (
                  <div key={card.label} className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    <div className="relative p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-${card.color}-100 shadow-sm`}>
                          <card.icon className={`w-6 h-6 text-${card.color}-600`} />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-500">{card.label}</p>
                          <p className="text-xs text-gray-400">{card.description}</p>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-800 mb-1">{card.value}</div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${card.bgGradient} rounded-full`} style={{width: '75%'}}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Systeem Statistieken - Verbeterde Cards */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">📊 Systeem Statistieken</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Realtime
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {adminData.statsCards.map(stat => { 
                const Icon = stat.icon; 
                return (
                  <div key={stat.label} className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    <div className="relative p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-${stat.color}-100 shadow-sm`}>
                          <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                        </div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          stat.changeType === 'positive' ? 'bg-green-100 text-green-700' :
                          stat.changeType === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {stat.change}
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


        </div>
      )}

      {/* Leraar Dashboard - Verbeterde Styling */}
      {currentUser.role === 'teacher' && (
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-xl p-12 max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <UserIcon className="w-12 h-12 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Leraren Dashboard</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
              Welkom op uw persoonlijke dashboard. Selecteer een van uw klassen in het menu om te beginnen met het bijhouden van leerlinggegevens.
            </p>
            <div className="bg-emerald-50 p-4 rounded-xl">
              <p className="text-emerald-700 text-sm font-medium">💡 Tip: Gebruik het menu aan de linkerkant om naar uw klassen te navigeren</p>
            </div>
          </div>
        </div>
      )}

      {/* Ouder Dashboard - Verbeterde Layout en Styling */}
      {currentUser.role === 'parent' && parentData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Hoofdcontent: Mijn Kinderen */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-800">👶 Mijn Kinderen</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {parentData.childrenCount} {parentData.childrenCount === 1 ? 'kind' : 'kinderen'}
              </span>
            </div>
            
            {parentData.childrenCount > 0 ? (
              <div className="space-y-4">
                {students.filter(s => String(s.parent_id) === String(currentUser.id)).map(child => {
                  const childClass = classes?.find(c => String(c.id) === String(child.class_id));
                  const teacher = users?.find(u => u.id === childClass?.teacher_id);
                  return (
                    <Link 
                      to={`/parent/my-children/${child.id}`} 
                      key={child.id} 
                      className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-3">
                              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-bold text-lg mr-4 shadow-sm">
                                {child.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                                  {child.name}
                                </h4>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="inline-flex items-center text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                    <ClassIcon size={14} className="mr-1.5"/>
                                    {childClass?.name || 'Geen klas'}
                                  </span>
                                  <span className="inline-flex items-center text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                                    <UserIcon size={14} className="mr-1.5"/>
                                    {teacher?.name || 'Geen leraar'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={24} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                      </div>
                      {/* Gradient border effect */}
                      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Geen kinderen gevonden</h3>
                <p className="text-gray-600 max-w-md mx-auto">Er zijn nog geen leerlingen aan uw account gekoppeld.</p>
              </div>
            )}
          </div>

          {/* Zijbalk: Financiën & Contact */}
          <div className="lg:col-span-1 space-y-6">
            {/* Financieel Overzicht Card - Verbeterd */}
            {parentData.paymentInfo && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-gray-800">💳 Financiën</h4>
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Te Betalen</div>
                    <div className="text-2xl font-bold text-blue-800">€{parentData.paymentInfo.amountDue}</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Betaald</div>
                    <div className="text-2xl font-bold text-green-800">€{parentData.paymentInfo.totalPaid}</div>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                    <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Openstaand</div>
                    <div className="text-2xl font-bold text-red-800">€{parentData.paymentInfo.remainingBalance}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Card - Verbeterd */}
            {mosque?.contact_committee_name && mosque?.contact_committee_email && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-800">💬 Contact</h4>
                  <Mail className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Heeft u vragen? Neem contact op met de {mosque.contact_committee_name}.
                </p>
                <Button 
                  icon={Mail} 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-md hover:shadow-lg transition-all duration-200" 
                  onClick={() => setIsMailModalOpen(true)}
                >
                  Stuur E-mail
                </Button>
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-700">
                    📧 {mosque.contact_committee_email}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Fallback voor onbekende rollen */}
      {!['admin', 'teacher', 'parent'].includes(currentUser.role) && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Dashboard</h3>
          <p className="text-gray-600">
            Er is nog geen specifieke dashboard weergave voor uw rol ({userRoleDisplay}).
          </p>
        </div>
      )}

      {/* Email Modal */}
      <MailModal
        isOpen={isMailModalOpen}
        onClose={() => setIsMailModalOpen(false)}
        onSend={handleSendCommitteeEmail}
        isLoading={mailLoading}
        title={`Bericht aan ${mosque?.contact_committee_name || 'Onderwijscommissie'}`}
        recipientInfo={mosque?.contact_committee_email}
      />

      {/* Email Feedback - Verbeterd */}
      {mailFeedback.text && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl z-50 backdrop-blur-sm border ${
          mailFeedback.type === 'success' 
            ? 'bg-green-50/90 text-green-800 border-green-200' 
            : 'bg-red-50/90 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center">
            {mailFeedback.type === 'success' ? '✅' : '❌'}
            <span className="ml-2 font-medium">{mailFeedback.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;