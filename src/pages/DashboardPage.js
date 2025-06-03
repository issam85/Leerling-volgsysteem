import React, { useEffect } from 'react'; // useEffect toegevoegd voor logging als je dat wilt
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateFinancialMetrics } from '../utils/financials';
import { DollarSign, Users, BookOpen, User as UserIcon } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner'; // Importeer LoadingSpinner

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { realData } = useData();
  const { users, students, classes, payments, mosque, loading: dataLoading, error: dataError } = realData;

  // Tijdelijke log om data te inspecteren
  // useEffect(() => {
  //   console.log("[DashboardPage] currentUser:", currentUser);
  //   console.log("[DashboardPage] realData:", realData);
  // }, [currentUser, realData]);

  // Wacht tot essentiële data geladen is
  if (dataLoading || !currentUser) {
    return <LoadingSpinner message="Dashboard laden..." />;
  }

  // Als er een error is bij het laden van de moskee, toon die
  if (dataError && !mosque) {
      return <div className="p-8 text-center text-red-600">Fout bij laden moskee-informatie: {dataError}</div>;
  }
  // Als moskee nog niet geladen is, maar geen error (kan gebeuren bij initiële state)
  if (!mosque) {
      return <LoadingSpinner message="Moskee-informatie ophalen..." />;
  }


  // Bereken financialMetrics alleen als data er is en user admin is
  const financialMetrics = (currentUser.role === 'admin' && users && payments)
    ? calculateFinancialMetrics(users, payments)
    : null;

  // Definieer stats array
  const statsCardsDefinition = [
    { label: 'Leerlingen', value: students?.length || 0, icon: Users, color: 'blue', adminOnly: true },
    { label: 'Klassen', value: classes?.length || 0, icon: BookOpen, color: 'emerald', adminOnly: true },
    { label: 'Leraren', value: users?.filter(u => u.role === 'teacher')?.length || 0, icon: UserIcon, color: 'purple', adminOnly: true },
    { label: 'Ouders', value: users?.filter(u => u.role === 'parent')?.length || 0, icon: Users, color: 'orange', adminOnly: true },
  ];

  // Definieer financial cards array
  const financialCardsDefinition = (currentUser.role === 'admin' && financialMetrics) ? [
    { label: 'Totaal Openstaand', value: `€${financialMetrics.totalOutstanding}`, IconComponent: DollarSign, color: 'red' },
    { label: 'Totaal Betaald', value: `€${financialMetrics.totalPaid}`, IconComponent: DollarSign, color: 'green' },
    { label: '% Betaald', value: `${financialMetrics.percentagePaid}%`, IconComponent: () => <span className="text-xl font-bold">%</span>, color: 'blue' } // Icoon als functiecomponent
  ] : [];

  const welcomeMessageName = currentUser.name || "Gebruiker";
  const mosqueDisplayName = mosque?.name || 'Moskee Leerling Volgsysteem';
  const userRoleDisplay = currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : "Onbekend";

  return (
    <div className="space-y-8 p-1"> {/* Extra padding p-1 voor het geval dat */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-6 md:p-8 text-white shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold mb-1">Welkom terug, {welcomeMessageName}!</h2>
        <p className="opacity-90 text-lg">{mosqueDisplayName}</p>
        <p className="opacity-80 text-sm mt-1">Je bent ingelogd als: <span className="font-semibold">{userRoleDisplay}</span></p>
      </div>

      {currentUser.role === 'admin' && financialMetrics && (
        <>
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Financieel Overzicht</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {financialCardsDefinition.map(card => (
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

          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Systeem Statistieken</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {statsCardsDefinition.filter(s => s.adminOnly).map(stat => {
                const Icon = stat.icon; // Haal de component uit het object
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

      {currentUser.role === 'teacher' && (
        <div className="card text-center">
          <UserIcon className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Leraren Dashboard</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Welkom op uw persoonlijke dashboard. Hier kunt u binnenkort informatie over uw klassen en leerlingen vinden.
          </p>
        </div>
      )}
       {currentUser.role === 'parent' && (
        <div className="card text-center">
          <Users className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Ouder Dashboard</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Welkom op uw persoonlijke dashboard. Hier kunt u binnenkort informatie over uw kinderen, hun voortgang en betalingen vinden.
          </p>
        </div>
      )}
      {/* Fallback als geen specifieke rol content */}
      {currentUser.role !== 'admin' && currentUser.role !== 'teacher' && currentUser.role !== 'parent' && (
           <div className="card">
               <h3 className="text-xl font-semibold text-gray-700">Dashboard</h3>
               <p className="text-gray-600">Er is nog geen specifieke dashboard weergave voor uw rol ({userRoleDisplay}).</p>
           </div>
      )}
    </div>
  );
};

export default DashboardPage;