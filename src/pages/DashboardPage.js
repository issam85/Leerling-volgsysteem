// src/pages/DashboardPage.js - VOLLEDIGE, COMPLETE EN BIJGEWERKTE VERSIE
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateFinancialMetrics, calculateParentPaymentStatus } from '../utils/financials';
import { DollarSign, Users, BookOpen as ClassIcon, User as UserIcon, Mail } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { realData } = useData();
  const { users, students, classes, payments, mosque, loading: dataLoading, error: dataError } = realData;
  const navigate = useNavigate();

  if (dataLoading || !currentUser) {
    return <LoadingSpinner message="Dashboard laden..." />;
  }
  if (dataError && !mosque) {
      return <div className="p-8 text-center text-red-600">Fout bij laden moskee-informatie: {dataError}</div>;
  }
  if (!mosque && currentUser.role !== 'parent' && currentUser.role !== 'teacher') {
      return <LoadingSpinner message="Moskee-informatie ophalen..." />;
  }

  // Admin specifieke data
  const financialMetrics = (currentUser.role === 'admin' && users && payments)
    ? calculateFinancialMetrics(users, payments)
    : null;
  const statsCardsDefinitionAdmin = currentUser.role === 'admin' ? [
    { label: 'Leerlingen', value: students?.length || 0, icon: Users, color: 'blue' },
    { label: 'Klassen', value: classes?.length || 0, icon: ClassIcon, color: 'emerald' },
    { label: 'Leraren', value: users?.filter(u => u.role === 'teacher')?.length || 0, icon: UserIcon, color: 'purple' },
    { label: 'Ouders', value: users?.filter(u => u.role === 'parent')?.length || 0, icon: Users, color: 'orange' },
  ] : [];
  const financialCardsDefinitionAdmin = (currentUser.role === 'admin' && financialMetrics) ? [
    { label: 'Totaal Openstaand', value: `€${financialMetrics.totalOutstanding}`, IconComponent: DollarSign, color: 'red' },
    { label: 'Totaal Betaald', value: `€${financialMetrics.totalPaid}`, IconComponent: DollarSign, color: 'green' },
    { label: '% Betaald', value: `${financialMetrics.percentagePaid}%`, IconComponent: () => <span className="text-xl font-bold">%</span>, color: 'blue' }
  ] : [];

  // Ouder specifieke data
  let parentPaymentInfo = null;
  let childrenCount = 0;
  if (currentUser.role === 'parent') {
    if (users && payments) {
        parentPaymentInfo = calculateParentPaymentStatus(currentUser.id, users, payments);
    }
    if (students) {
        childrenCount = students.filter(s => String(s.parent_id) === String(currentUser.id)).length;
    }
  }

  const welcomeMessageName = currentUser.name || "Gebruiker";
  const mosqueDisplayName = mosque?.name || 'Leerling Volgsysteem';
  const userRoleDisplay = currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : "Onbekend";

  return (
    <div className="space-y-8 p-1">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-6 md:p-8 text-white shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold mb-1">Welkom terug, {welcomeMessageName}!</h2>
        <p className="opacity-90 text-lg">{mosqueDisplayName}</p>
        <p className="opacity-80 text-sm mt-1">Je bent ingelogd als: <span className="font-semibold">{userRoleDisplay}</span></p>
      </div>

      {/* Admin Dashboard */}
      {currentUser.role === 'admin' && financialMetrics && (
        <>
          {/* Financial Overview */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Financieel Overzicht</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {financialCardsDefinitionAdmin.map(card => (
                <div key={card.label} className={`card border-l-4 border-${card.color}-500 flex justify-between items-center`}>
                  <div> 
                    <p className={`text-sm font-medium text-gray-500`}>{card.label}</p> 
                    <p className={`text-3xl font-bold text-${card.color}-600`}>{card.value !== undefined ? String(card.value) : '-'}</p> 
                  </div>
                  <div className={`p-3 rounded-full bg-${card.color}-100 text-${card.color}-600`}> 
                    {card.IconComponent && <card.IconComponent className="w-7 h-7" />} 
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Statistics */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Systeem Statistieken</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {statsCardsDefinitionAdmin.map(stat => { 
                const Icon = stat.icon; 
                return (
                  <div key={stat.label} className={`card border-l-4 border-${stat.color}-500 flex justify-between items-center`}>
                    <div> 
                      <p className={`text-sm font-medium text-gray-500`}>{stat.label}</p> 
                      <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value !== undefined ? String(stat.value) : '-'}</p> 
                    </div>
                    <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}> 
                      {Icon && <Icon className="w-7 h-7" />} 
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Teacher Dashboard */}
      {currentUser.role === 'teacher' && (
        <div className="card text-center">
          <UserIcon className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Leraren Dashboard</h3>
          <p className="text-gray-600 max-w-md mx-auto"> 
            Welkom op uw persoonlijke dashboard. Selecteer een van uw klassen in het menu om te beginnen.
          </p>
        </div>
      )}

      {/* Parent Dashboard */}
      {currentUser.role === 'parent' && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="card text-center">
            <Users className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-1">Ouder Dashboard</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6"> 
              Welkom op uw persoonlijke dashboard. Hier vindt u informatie over uw kinderen en betalingen. 
            </p>
          </div>

          {/* Parent Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Children Card */}
            <div className="card lg:col-span-1">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">Mijn Kinderen</h4>
              <p className="text-gray-600 mb-3">U heeft <span className="font-bold">{childrenCount}</span> kind(eren) ingeschreven.</p>
              <Button 
                variant="primary" 
                onClick={() => {
                  const firstChild = students.find(s => String(s.parent_id) === String(currentUser.id));
                  if (firstChild) {
                    navigate(`/parent/my-children/${firstChild.id}`);
                  } else {
                    navigate('/parent/my-children');
                  }
                }} 
                icon={Users}
              > 
                Bekijk Mijn Kinderen 
              </Button>
            </div>

            {/* Payment Status Card */}
            {parentPaymentInfo && (
              <div className="card lg:col-span-1">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">Betalingsstatus</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">
                    Te betalen bijdrage: <span className="font-semibold">€{parentPaymentInfo.amountDue}</span>
                  </p>
                  <p className="text-green-600">
                    Reeds betaald: <span className="font-semibold">€{parentPaymentInfo.totalPaid}</span>
                  </p>
                  {parseFloat(parentPaymentInfo.remainingBalance) > 0 ? (
                    <p className="text-red-600 font-semibold">
                      Nog openstaand: €{parentPaymentInfo.remainingBalance}
                    </p>
                  ) : parseFloat(parentPaymentInfo.amountDue) > 0 ? (
                    <p className="text-green-600 font-semibold">
                      Alle bijdragen zijn voldaan!
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      Geen openstaande bijdrage.
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Contact Card - NEW */}
            {mosque?.contact_committee_name && mosque?.contact_committee_email && (
              <div className="card lg:col-span-1 bg-sky-50 border-sky-200">
                <h4 className="text-lg font-semibold text-sky-800 mb-3">Vragen?</h4>
                <p className="text-sky-700 mb-3 text-sm">
                  Neem contact op met de {mosque.contact_committee_name}.
                </p>
                <a href={`mailto:${mosque.contact_committee_email}`}>
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white border-sky-600 text-sky-700 hover:bg-sky-100" 
                    icon={Mail}
                  >
                    Stuur een e-mail
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fallback for unknown roles */}
      {!['admin', 'teacher', 'parent'].includes(currentUser.role) && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-700">Dashboard</h3>
          <p className="text-gray-600">
            Er is nog geen specifieke dashboard weergave voor uw rol ({userRoleDisplay}).
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;