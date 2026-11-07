import React, { useState } from 'react';
import { BiomedicalProvider, useBiomedical } from './context/BiomedicalContext';
import { AppSidebar } from './components/layout/AppSidebar';
import { MobileTopBar } from './components/layout/MobileTopBar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { EquipmentSelectorBar } from './components/EquipmentSelectorBar';
import { DashboardHomeSection } from './components/sections/DashboardHomeSection';
import { ServiceReportSection } from './components/sections/ServiceReportSection';
import { EquipmentLifeSheetSection } from './components/sections/EquipmentLifeSheetSection';
import { AllEquipmentSection } from './components/sections/AllEquipmentSection';
import { MaintenanceDatesRhSection } from './components/sections/MaintenanceDatesRhSection';
import { EngineerAlertsSection } from './components/sections/EngineerAlertsSection';
import { CompanySettingsSection } from './components/sections/CompanySettingsSection';
import { DirectMobileScanView } from './components/scan/DirectMobileScanView';
import { NfcQrModal } from './components/modals/NfcQrModal';
import { NfcSimulatorModal } from './components/modals/NfcSimulatorModal';
import { NewMaintenanceModal } from './components/modals/NewMaintenanceModal';
import { EquipmentFormModal } from './components/modals/EquipmentFormModal';
import { ReportIncidentModal } from './components/modals/ReportIncidentModal';
import { LoginModal } from './components/modals/LoginModal';
import { SetupWizardModal } from './components/modals/SetupWizardModal';
import { BiomedicalEquipment } from './types/biomedical';
import { Radio } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    selectedEquipment,
    institutions,
    bindNewTag,
    scanFeedback,
    setScanFeedback,
    isDirectScanMode,
    isSetupWizardOpen,
    setIsSetupWizardOpen,
  } = useBiomedical();

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNfcScannerOpen, setIsNfcScannerOpen] = useState(false);
  const [isNfcQrModalOpen, setIsNfcQrModalOpen] = useState(false);
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);
  const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);
  const [isReportIncidentOpen, setIsReportIncidentOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<BiomedicalEquipment | undefined>(undefined);
  const [targetEquipmentForSticker, setTargetEquipmentForSticker] = useState<BiomedicalEquipment | undefined>(undefined);
  const [preselectedMaintEqId, setPreselectedMaintEqId] = useState<string | undefined>(undefined);

  const handleOpenEditEquipment = () => {
    setEquipmentToEdit(selectedEquipment);
    setIsEquipmentFormOpen(true);
  };

  const handleOpenNewEquipment = () => {
    setEquipmentToEdit(undefined);
    setIsEquipmentFormOpen(true);
  };

  const handleOpenStickerForSpecificEquipment = (eq: BiomedicalEquipment) => {
    setTargetEquipmentForSticker(eq);
    setIsNfcQrModalOpen(true);
  };

  const handleOpenNewMaintenanceFor = (equipmentId?: string) => {
    setPreselectedMaintEqId(equipmentId);
    setIsNewMaintenanceOpen(true);
  };

  const stickerEquipment = targetEquipmentForSticker || selectedEquipment;
  const stickerInstitution = institutions.find((i) => i.id === stickerEquipment?.institutionId);

  // If URL points to /e/[TOKEN] or direct mobile scan mode is active:
  // Directly render the dedicated scan view without prior menus!
  if (isDirectScanMode) {
    return (
      <>
        <DirectMobileScanView
          onOpenEditEquipment={handleOpenEditEquipment}
          onOpenNewMaintenance={() => {
            setPreselectedMaintEqId(undefined);
            setIsNewMaintenanceOpen(true);
          }}
          onOpenReportIncident={() => setIsReportIncidentOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        {/* Global Modals operable within scan view */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />

        <NewMaintenanceModal
          isOpen={isNewMaintenanceOpen}
          preselectedEquipmentId={preselectedMaintEqId}
          onClose={() => {
            setIsNewMaintenanceOpen(false);
            setPreselectedMaintEqId(undefined);
          }}
        />

        <EquipmentFormModal
          isOpen={isEquipmentFormOpen}
          equipmentToEdit={equipmentToEdit}
          onClose={() => setIsEquipmentFormOpen(false)}
        />

        <ReportIncidentModal
          isOpen={isReportIncidentOpen}
          onClose={() => setIsReportIncidentOpen(false)}
        />
      </>
    );
  }

  // Standard App Mode with Left Sidebar (Desktop) and Mobile Layout
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans">
      
      {/* 3-Step Setup Wizard for initial onboarding */}
      <SetupWizardModal
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
      />

      {/* Desktop Left Sidebar */}
      <AppSidebar
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenNfcScanner={() => setIsNfcScannerOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        
        {/* Mobile Top Header */}
        <MobileTopBar
          onOpenNfcScanner={() => setIsNfcScannerOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenNewEquipment={handleOpenNewEquipment}
        />

        {/* Global Toast Notification */}
        {scanFeedback && (
          <div className="no-print fixed bottom-20 lg:bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white dark:bg-teal-900 border border-teal-500/50 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-teal-400 animate-pulse" />
            </div>
            <p className="text-xs font-medium leading-relaxed flex-1">{scanFeedback}</p>
            <button
              onClick={() => setScanFeedback(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Shared Equipment Selector Bar for Sections 1, 2, and 4 */}
          {(activeTab === 'ultimo_mantenimiento' ||
            activeTab === 'hoja_de_vida' ||
            activeTab === 'fechas_rh') && (
            <EquipmentSelectorBar
              onOpenNfcQrModal={() => {
                setTargetEquipmentForSticker(selectedEquipment);
                setIsNfcQrModalOpen(true);
              }}
              onOpenNewMaintenanceModal={() => {
                setPreselectedMaintEqId(undefined);
                setIsNewMaintenanceOpen(true);
              }}
              onOpenReportIncidentModal={() => setIsReportIncidentOpen(true)}
            />
          )}

          {/* Tab Views */}
          {activeTab === 'inicio' && (
            <DashboardHomeSection
              onOpenNewEquipment={handleOpenNewEquipment}
              onOpenNewMaintenance={handleOpenNewMaintenanceFor}
              onOpenReportIncident={() => setIsReportIncidentOpen(true)}
              onOpenNfcScanner={() => setIsNfcScannerOpen(true)}
            />
          )}

          {activeTab === 'ultimo_mantenimiento' && (
            <ServiceReportSection
              onOpenNewMaintenance={() => {
                setPreselectedMaintEqId(undefined);
                setIsNewMaintenanceOpen(true);
              }}
              onOpenNewEquipment={handleOpenNewEquipment}
            />
          )}

          {activeTab === 'hoja_de_vida' && (
            <EquipmentLifeSheetSection
              onOpenEditModal={handleOpenEditEquipment}
              onOpenNfcQrModal={() => {
                setTargetEquipmentForSticker(selectedEquipment);
                setIsNfcQrModalOpen(true);
              }}
              onOpenNewEquipment={handleOpenNewEquipment}
            />
          )}

          {activeTab === 'todos_los_equipos' && (
            <AllEquipmentSection
              onOpenNewEquipment={handleOpenNewEquipment}
              onOpenNfcQrModal={handleOpenStickerForSpecificEquipment}
            />
          )}

          {activeTab === 'fechas_rh' && <MaintenanceDatesRhSection />}

          {activeTab === 'alertas_ingenieria' && (
            <EngineerAlertsSection
              onOpenNewMaintenanceFor={handleOpenNewMaintenanceFor}
            />
          )}

          {activeTab === 'configuracion' && <CompanySettingsSection />}
        </main>

        {/* Discrete BIO-TAG footer */}
        <footer className="no-print border-t border-slate-200 dark:border-slate-800 py-3 text-center text-xs text-slate-400 mt-auto">
          Con tecnología <strong className="text-slate-600 dark:text-slate-300 font-semibold">BIO-TAG</strong>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenNfcScanner={() => setIsNfcScannerOpen(true)}
      />

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {stickerEquipment && (
        <NfcQrModal
          equipment={stickerEquipment}
          institution={stickerInstitution}
          isOpen={isNfcQrModalOpen}
          onClose={() => setIsNfcQrModalOpen(false)}
          onRegenerateToken={(id) => bindNewTag(id)}
        />
      )}

      <NfcSimulatorModal
        isOpen={isNfcScannerOpen}
        onClose={() => setIsNfcScannerOpen(false)}
      />

      <NewMaintenanceModal
        isOpen={isNewMaintenanceOpen}
        preselectedEquipmentId={preselectedMaintEqId}
        onClose={() => {
          setIsNewMaintenanceOpen(false);
          setPreselectedMaintEqId(undefined);
        }}
      />

      <EquipmentFormModal
        isOpen={isEquipmentFormOpen}
        equipmentToEdit={equipmentToEdit}
        onClose={() => setIsEquipmentFormOpen(false)}
      />

      <ReportIncidentModal
        isOpen={isReportIncidentOpen}
        onClose={() => setIsReportIncidentOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BiomedicalProvider>
      <MainAppContent />
    </BiomedicalProvider>
  );
}
