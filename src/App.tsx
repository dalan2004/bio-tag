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
import { SetupWizardModal } from './components/modals/SetupWizardModal';
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { BiomedicalEquipment } from './types/biomedical';
import { Radio, Loader2, Activity } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    isAuthLoading,
    isAuthenticated,
    isAdminHospital,
    activeTab,
    selectedEquipment,
    institutions,
    users,
    bindNewTag,
    scanFeedback,
    setScanFeedback,
    isDirectScanMode,
    isPublicScanLoading,
    requiresLoginToScan,
    isSetupWizardOpen,
    setIsSetupWizardOpen,
  } = useBiomedical();

  // Modals state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
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

  // While checking session and syncing with Firestore, show a loading screen and not the login modal
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-5 animate-pulse shadow-lg shadow-teal-500/10">
          <Activity className="w-8 h-8 text-teal-400" />
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-2 text-white">BIO-TAG</h1>
        <div className="flex items-center gap-2.5 text-xs text-slate-400 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700/60">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
          <span>Comprobando sesión y sincronizando con Cloud Firestore...</span>
        </div>
      </div>
    );
  }

  if (isDirectScanMode && isPublicScanLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
          <span>Validando etiqueta segura...</span>
        </div>
      </div>
    );
  }

  // If not authenticated: STRICT ACCESS CONTROL. Public direct scans are the
  // only exception and are resolved by a callable function without listing data.
  // The user can NEVER see any screen, dashboard, or data without a valid active session.
  if (!isAuthenticated && (!isDirectScanMode || requiresLoginToScan)) {
    const hasAnyAdmin = users.some((u) => u.role === 'admin_hospital' && u.active);
    return (
      <>
        <AuthScreen
          onOpenSetupWizard={!hasAnyAdmin && !isDirectScanMode ? () => setIsSetupWizardOpen(true) : undefined}
        />
        {/* If first time with no admin registered, allow setup wizard modal */}
        {!hasAnyAdmin && !isDirectScanMode && (
          <SetupWizardModal
            isOpen={isSetupWizardOpen}
            onClose={() => setIsSetupWizardOpen(false)}
          />
        )}
      </>
    );
  }

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

        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
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
        onOpenNfcScanner={() => setIsNfcScannerOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        
        {/* Mobile Top Header */}
        <MobileTopBar
          onOpenNfcScanner={() => setIsNfcScannerOpen(true)}
          onOpenNewEquipment={handleOpenNewEquipment}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
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

          {activeTab === 'configuracion' && isAdminHospital && <CompanySettingsSection />}
        </main>

        {/* Discrete BIO-TAG footer */}
        <footer className="no-print border-t border-slate-200 dark:border-slate-800 py-3 text-center text-xs text-slate-400 mt-auto">
          Con tecnología <strong className="text-slate-600 dark:text-slate-300 font-semibold">BIO-TAG</strong>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenNfcScanner={() => setIsNfcScannerOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Global Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
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
