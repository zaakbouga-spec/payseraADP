import React, { useState, useEffect } from 'react';
import Header from '@/components/Header.tsx';
import ToolCard from '@/components/ToolCard.tsx';
import Modal from '@/components/Modal.tsx';
import { TransferIcon, CompanyValidationIcon, IbanIcon } from '@/components/Icons.tsx';
import { TransferChecker, CompanyValidator, IbanSwiftValidator } from '@/components/Tools.tsx';
import { ToolType } from '@/types.ts';

const App = () => {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsModalOpen(!!activeTool);
  }, [activeTool]);

  const openTool = (tool: ToolType) => setActiveTool(tool);
  const closeTool = () => setActiveTool(null);

  const renderTool = () => {
    switch (activeTool) {
      case ToolType.TRANSFER_CHECK:
        return <TransferChecker />;
      case ToolType.COMPANY_VALIDATION:
        return <CompanyValidator />;
      case ToolType.IBAN_SWIFT_VALIDATOR:
        return <IbanSwiftValidator />;
      default:
        return null;
    }
  };

  const Footer = () => (
      <footer className="w-full mt-auto text-center py-4 bg-gray-100">
          <p className="text-xs text-gray-500">
              Powered by Google Gemini | &copy; {new Date().getFullYear()} P-Advisor. All rights reserved.
          </p>
          <div className="h-2 flex mt-2">
              <div className="w-1/4 bg-[#4DB5B5]"></div>
              <div className="w-1/4 bg-[#2C75B4]"></div>
              <div className="w-1/4 bg-[#6B4DA8]"></div>
              <div className="w-1/4 bg-[#5A9A5A]"></div>
          </div>
      </footer>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-5xl text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ToolCard
              title="Transfer Check"
              description="Verify transaction details"
              icon={<TransferIcon />}
              colorClass="bg-[#4DB5B5] hover:bg-[#45a3a3]"
              onClick={() => openTool(ToolType.TRANSFER_CHECK)}
            />
            <ToolCard
              title="Company Validation"
              description="Check company eligibility"
              icon={<CompanyValidationIcon />}
              colorClass="bg-[#2C75B4] hover:bg-[#2563a3]"
              onClick={() => openTool(ToolType.COMPANY_VALIDATION)}
            />
             <ToolCard
              title="IBAN & SWIFT Validator"
              description="Analyze IBAN/SWIFT details"
              icon={<IbanIcon />}
              colorClass="bg-[#6B4DA8] hover:bg-[#5a3f90]"
              onClick={() => openTool(ToolType.IBAN_SWIFT_VALIDATOR)}
            />
            </div>
             <p className="text-gray-500 mt-10 text-lg">
                Your AI-powered assistant for navigating Paysera's financial services.
            </p>
        </div>
      </main>
      <Footer />
      {activeTool && (
        <Modal title={activeTool} isOpen={isModalOpen} onClose={closeTool}>
          {renderTool()}
        </Modal>
      )}
    </div>
  );
};

export default App;
