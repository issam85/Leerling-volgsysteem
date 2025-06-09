// src/pages/ChildDetailPage.js - NIEUW BESTAND
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { 
  ArrowLeft, 
  User, 
  BookOpen as ClassIcon, 
  CalendarDays, 
  BookMarked, 
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  XCircle, 
  Clock,
  Info
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import QuranProgressView from '../features/parent/QuranProgressView';

// Sub-component voor het Rapport (placeholder)
const RapportView = () => (
    <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Rapport</h3>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <Info size={16} className="inline mr-2" />
            Deze functionaliteit wordt binnenkort geïmplementeerd. Hieronder ziet u een visueel voorbeeld van het toekomstige rapport.
        </div>
        {/* Hier zou je de afbeelding kunnen tonen of de structuur namaken */}
        <div className="mt-4 p-4 border rounded-lg shadow-sm overflow-x-auto">
            <p className="italic text-gray-600">Visueel voorbeeld van het rapport komt hier...</p>
            {/* Je kunt hier de structuur namaken met divs en grids als je wilt */}
        </div>
    </div>
);

// Sub-component voor het Absentie Overzicht
const AbsentieOverzichtView = ({ childId }) => {
    const { realData } = useData();
    const stats = realData.attendanceStats?.[childId];
    
    if (!stats) return <p className="italic text-gray-500">Geen aanwezigheidsstatistieken beschikbaar.</p>;

    const total = stats.aanwezig + stats.afwezig_ongeoorloofd + stats.afwezig_geoorloofd + stats.te_laat;
    const percentage = total > 0 ? Math.round(((stats.aanwezig + stats.te_laat) / total) * 100) : 0;

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Aanwezigheidsoverzicht</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="card p-4 text-center">
                    <div className={`text-4xl font-bold mb-1 ${percentage >= 90 ? 'text-green-600' : percentage >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>{percentage}%</div>
                    <div className="text-sm text-gray-500">Aanwezigheid</div>
                </div>
                 <div className="card p-4 text-center bg-green-50">
                    <div className="text-4xl font-bold text-green-700 mb-1">{stats.aanwezig}</div>
                    <div className="text-sm text-green-800">Aanwezig</div>
                </div>
                <div className="card p-4 text-center bg-orange-50">
                    <div className="text-4xl font-bold text-orange-700 mb-1">{stats.te_laat}</div>
                    <div className="text-sm text-orange-800">Te Laat</div>
                </div>
                 <div className="card p-4 text-center bg-red-50">
                    <div className="text-4xl font-bold text-red-700 mb-1">{stats.afwezig_ongeoorloofd}</div>
                    <div className="text-sm text-red-800">Afwezig</div>
                </div>
                <div className="card p-4 text-center bg-blue-50">
                    <div className="text-4xl font-bold text-blue-700 mb-1">{stats.afwezig_geoorloofd}</div>
                    <div className="text-sm text-blue-800">Geoorloofd</div>
                </div>
            </div>
        </div>
    );
};


const ChildDetailPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { realData } = useData();
    const { students, classes, users, loading: dataLoading } = realData;
    const [activeTab, setActiveTab] = useState('overzicht');

    if (dataLoading && !students?.length) {
        return <LoadingSpinner message="Leerlinggegevens laden..." />;
    }

    const student = students.find(s => s.id === studentId);

    if (!student) {
        return (
            <div className="card text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-semibold">Leerling niet gevonden</h2>
                <p className="text-gray-600 mt-2">De opgevraagde leerling kon niet worden gevonden.</p>
                <button onClick={() => navigate(-1)} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700">
                    <ArrowLeft size={16} className="mr-2"/> Terug naar overzicht
                </button>
            </div>
        );
    }

    const studentClass = classes?.find(c => c.id === student.class_id);
    const teacher = users?.find(u => u.id === studentClass?.teacher_id);
    
    const TabButton = ({ tabName, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center px-4 py-2 text-sm sm:text-base font-semibold border-b-2 transition-colors duration-150 ${
                activeTab === tabName 
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
        >
            <Icon size={18} className="mr-2" />
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button onClick={() => navigate('/parent/my-children')} className="p-2 mr-4 rounded-full hover:bg-gray-100">
                    <ArrowLeft size={24} className="text-gray-600"/>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{student.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="inline-flex items-center"><ClassIcon size={14} className="mr-1.5"/>{studentClass?.name || '-'}</span>
                        <span className="inline-flex items-center"><User size={14} className="mr-1.5"/>{teacher?.name || '-'}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigatie */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton tabName="overzicht" label="Aanwezigheid" icon={CalendarDays}/>
                    <TabButton tabName="quran" label="Qor'aan" icon={BookMarked}/>
                    <TabButton tabName="rapport" label="Rapport" icon={ClipboardList}/>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'overzicht' && <AbsentieOverzichtView childId={student.id} />}
                {activeTab === 'quran' && <QuranProgressView childId={student.id} childName={student.name} />}
                {activeTab === 'rapport' && <RapportView />}
            </div>
        </div>
    );
};

export default ChildDetailPage;