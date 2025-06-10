// src/pages/DashboardPage.js - DEFINITIEVE, COMPLETE EN ROBUUSTE VERSIE
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateFinancialMetrics, calculateParentPaymentStatus } from '../utils/financials';
import { apiCall } from '../services/api';
import { DollarSign, Users, BookOpen as ClassIcon, User as UserIcon, Mail, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import MailModal from '../components/MailModal';
import { useNavigate, Link } from 'react-router-dom';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { realData } = useData();
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
        { label: 'Leerlingen', value: students?.length || 0, icon: Users, color: 'blue' },
        { label: 'Klassen', value: classes?.length || 0, icon: ClassIcon, color: 'emerald' },
        { label: 'Leraren', value: users?.filter(u => u.role === 'teacher').length || 0, icon: UserIcon, color: 'purple' },
        { label: 'Ouders', value: users?.filter(u => u.role === 'parent').length || 0, icon: Users, color: 'orange' },
      ],
      financialCards: financialMetrics ? [
        { label: 'Totaal Openstaand', value: `€${financialMetrics.totalOutstanding}`, IconComponent: DollarSign, color: 'red' },
        { label: 'Totaal Betaald', value: `€${financialMetrics.totalPaid}`, IconComponent: DollarSign, color: 'green' },
        { label: '% Betaald', value: `${financialMetrics.percentagePaid}%`, IconComponent: () => <span className="text-xl font-bold">%</span>, color: 'blue' }
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
      {/* Welkomstbanner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-6 md:p-8 text-white shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold mb-1">Welkom terug, {welcomeMessageName}!</h2>
        <p className="opacity-90 text-lg">{mosqueDisplayName}</p>
        <p className="opacity-80 text-sm mt-1">Je bent ingelogd als: <span className="font-semibold">{userRoleDisplay}</span></p>
      </div>

      {/* Admin Dashboard */}
      {currentUser.role === 'admin' && adminData && (
        <div className="space-y-8">
          {/* Financieel Overzicht */}
          {adminData.financialMetrics && (
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Financieel Overzicht</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {adminData.financialCards.map(card => (
                  <div key={card.label} className={`card border-l-4 border-${card.color}-500 flex justify-between items-center`}>
                    <div>
                      <p className={`text-sm font-medium text-gray-500`}>{card.label}</p>
                      <p className={`text-3xl font-bold text-${card.color}-600`}>{card.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-${card.color}-100 text-${card.color}-600`}>
                      <card.IconComponent className="w-7 h-7" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Systeem Statistieken */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Systeem Statistieken</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {adminData.statsCards.map(stat => { 
                const Icon = stat.icon; 
                return (
                  <div key={stat.label} className={`card border-l-4 border-${stat.color}-500 flex justify-between items-center`}>
                    <div>
                      <p className={`text-sm font-medium text-gray-500`}>{stat.label}</p>
                      <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                      <Icon className="w-7 h-7" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Leraar Dashboard */}
      {currentUser.role === 'teacher' && (
        <div className="card text-center p-8">
          <UserIcon className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Leraren Dashboard</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Welkom op uw dashboard. Selecteer een van uw klassen in het menu aan de linkerkant om te beginnen.
          </p>
        </div>
      )}

      {/* Ouder Dashboard */}
      {currentUser.role === 'parent' && parentData && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="card text-center">
            <Users className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-1">Ouder Dashboard</h3>
            <p className="text-gray-600 max-w-md mx-auto">Welkom op uw persoonlijke dashboard.</p>
          </div>

          {/* Mijn Kinderen Sectie */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-700">Mijn Kinderen</h3>

            {/* Lijst van kinderen */}
            {parentData.myChildren.length > 0 ? (
              <div className="space-y-4">
                {parentData.myChildren.map(child => {
                  const childClass = classes?.find(c => c.id === child.class_id);
                  const teacher = childClass && users ? users.find(u => u.id === childClass.teacher_id) : null;
                  
                  return (
                    <Link 
                      to={`/parent/my-children/${child.id}`} 
                      key={child.id} 
                      className="card block hover:bg-emerald-50 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xl font-semibold text-emerald-700">{child.name}</h4>
                          <div className="space-y-1 mt-1">
                            <span className="text-sm text-gray-500 block">
                              Bekijk voortgang, aanwezigheid en rapporten
                            </span>
                            {childClass && (
                              <span className="text-xs text-gray-400">
                                Klas: {childClass.name} • Leraar: {teacher?.name || 'Onbekend'}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={24} className="text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="card text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Er zijn nog geen kinderen aan uw account gekoppeld.</p>
              </div>
            )}

            {/* Financiën en Contact Sectie */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
              {/* Financieel Overzicht */}
              <div className="card md:col-span-2">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">Financieel Overzicht</h4>
                
                {/* Payment Info */}
                {parentData.paymentInfo ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-800">€{parentData.paymentInfo.amountDue}</div>
                      <div className="text-xs font-medium text-blue-600">Te Betalen</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-800">€{parentData.paymentInfo.totalPaid}</div>
                      <div className="text-xs font-medium text-green-600">Betaald</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-red-800">€{parentData.paymentInfo.remainingBalance}</div>
                      <div className="text-xs font-medium text-red-600">Openstaand</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Betalingsstatus wordt geladen...</p>
                )}
              </div>

              {/* Contact Card */}
              {mosque?.contact_committee_name && mosque?.contact_committee_email ? (
                <div className="card">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Vragen?</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Neem contact op met de {mosque.contact_committee_name}.
                  </p>
                  <Button icon={Mail} className="w-full" onClick={() => setIsMailModalOpen(true)}>
                    Stuur e-mail
                  </Button>
                </div>
              ) : (
                <div className="card">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Contact</h4>
                  <p className="text-sm text-gray-600">
                    Contactgegevens worden binnenkort beschikbaar gesteld.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fallback voor onbekende rollen */}
      {!['admin', 'teacher', 'parent'].includes(currentUser.role) && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-700">Dashboard</h3>
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

      {/* Email Feedback */}
      {mailFeedback.text && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          mailFeedback.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {mailFeedback.text}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;