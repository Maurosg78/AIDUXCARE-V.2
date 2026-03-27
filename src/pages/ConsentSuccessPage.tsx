/**
 * Consent Success Page - Terminal State
 * 
 * Static success page shown after consent is recorded.
 * Prevents user confusion and back navigation.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function ConsentSuccessPage() {
  const [searchParams] = useSearchParams();
  const decision = searchParams.get('decision');
  const language = searchParams.get('lang') === 'es' ? 'es' : 'en';
  const isDeclined = decision === 'declined';
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [attemptingClose, setAttemptingClose] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const copy = language === 'es'
    ? {
        declinedTitle: 'Consentimiento rechazado',
        declinedBody: 'Tu decisión ha sido registrada. No se utilizará documentación asistida por IA en tu atención.',
        acceptedTitle: 'Consentimiento registrado',
        acceptedBody: 'Gracias por proporcionar tu consentimiento. Tu respuesta se ha registrado correctamente.',
        closing: 'Esta ventana se cerrará automáticamente...',
        shownBelow: 'Instrucciones visibles abajo ↓',
        closePage: 'Cerrar esta página',
        manualClose: 'Para cerrar esta página manualmente:',
        ios: 'iOS: desliza hacia arriba desde la parte inferior para ver las apps abiertas y luego cierra esta pestaña del navegador.',
        android: 'Android: pulsa varias veces Atrás o abre el menú del navegador (⋮) y selecciona "Cerrar pestaña".',
        windows: 'Windows/Linux: pulsa Ctrl + W o Ctrl + F4.',
        mac: 'Mac: pulsa Cmd + W.',
        tabClose: 'O haz clic en la X de la pestaña del navegador.',
        safeToCloseDeclined: 'Tu decisión ha sido registrada. Puedes cerrar esta página con seguridad.',
        safeToCloseAccepted: 'Tu consentimiento ha sido registrado. Puedes cerrar esta página con seguridad.',
        helpText: 'Si el botón no cierra la ventana, se mostrarán instrucciones detalladas.',
      }
    : {
        declinedTitle: 'Consent Declined',
        declinedBody: 'Your decision has been recorded. AI-assisted documentation will not be used for your care.',
        acceptedTitle: 'Consent Recorded',
        acceptedBody: 'Thank you for providing your consent. Your response has been successfully recorded.',
        closing: 'This window will close automatically...',
        shownBelow: 'Instructions Shown Below ↓',
        closePage: 'Close This Page',
        manualClose: 'To close this page manually:',
        ios: 'iOS: Swipe up from the bottom of the screen to see all apps, then swipe the browser tab upward.',
        android: 'Android: Tap the "Back" button several times or tap the browser menu (⋮) and select "Close tab".',
        windows: 'Windows/Linux: Press Ctrl + W or Ctrl + F4.',
        mac: 'Mac: Press Cmd + W.',
        tabClose: 'Or click the X on the browser tab.',
        safeToCloseDeclined: 'Your decision has been recorded. You can safely close this page.',
        safeToCloseAccepted: 'Your consent has been recorded. You can safely close this page.',
        helpText: "If the button doesn't close the window, detailed instructions will be shown.",
      };

  // ✅ Detect mobile
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // ✅ Prevent back navigation (history lock)
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };

    return () => {
      window.onpopstate = null;
    };
  }, []);

  // ✅ Attempt to close automatically, show button if it fails
  useEffect(() => {
    // Try to close after 2 seconds
    const closeTimer = setTimeout(() => {
      try {
        // Attempt to close
        window.close();

        // Check if we're still visible after 500ms
        setTimeout(() => {
          if (!document.hidden) {
            // Close didn't work, show button
            setShowCloseButton(true);
            setAttemptingClose(false);
          }
        }, 500);
      } catch (error) {
        // Close failed, show button
        setShowCloseButton(true);
        setAttemptingClose(false);
      }
    }, 2000);

    return () => clearTimeout(closeTimer);
  }, []);

  const handleManualClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Mark button as clicked for visual feedback
    setButtonClicked(true);
    console.log('[ConsentSuccess] Close button clicked');

    // Always try to close first
    try {
      const closed = window.close();
      console.log('[ConsentSuccess] window.close() called, result:', closed);
    } catch (error) {
      console.log('[ConsentSuccess] window.close() threw error:', error);
    }

    // Show instructions immediately (don't wait to see if close worked)
    // In mobile browsers, window.close() doesn't work but doesn't throw error either
    setShowInstructions(true);
    console.log('[ConsentSuccess] Instructions shown');

    // Also try to detect if we're still visible after a short delay
    // This is just for logging/debugging, instructions are already shown
    setTimeout(() => {
      if (!document.hidden) {
        console.log('[ConsentSuccess] Window still visible after close attempt - manual instructions displayed');
      } else {
        console.log('[ConsentSuccess] Window was closed successfully');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {isDeclined ? (
          <>
            <XCircle className="w-20 h-20 text-orange-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{copy.declinedTitle}</h1>
            <p className="text-gray-600 mb-6">{copy.declinedBody}</p>
            {attemptingClose && !showCloseButton && (
              <p className="text-sm text-gray-500 animate-pulse">
                {copy.closing}
              </p>
            )}
            {showCloseButton && (
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleManualClose}
                  disabled={buttonClicked && showInstructions}
                  className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-500 disabled:cursor-default text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <X className="w-5 h-5" />
                  {buttonClicked && showInstructions ? copy.shownBelow : copy.closePage}
                </button>
                {showInstructions && (
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg text-left animate-fadeIn">
                    <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <span className="text-lg">📱</span>
                      {copy.manualClose}
                    </p>
                    {isMobile ? (
                      <ul className="text-sm text-blue-800 space-y-2 list-none">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{copy.ios}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{copy.android}</span>
                        </li>
                      </ul>
                    ) : (
                      <ul className="text-sm text-blue-800 space-y-2 list-none">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{copy.windows}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{copy.mac}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{copy.tabClose}</span>
                        </li>
                      </ul>
                    )}
                    <p className="mt-3 text-xs text-blue-700 italic">
                      {copy.safeToCloseDeclined}
                    </p>
                  </div>
                )}
                {!showInstructions && (
                  <p className="text-xs text-gray-500 text-center">
                    {copy.helpText}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{copy.acceptedTitle}</h1>
            <p className="text-gray-600 mb-6">{copy.acceptedBody}</p>
            {attemptingClose && !showCloseButton && (
              <p className="text-sm text-gray-500 animate-pulse">
                {copy.closing}
              </p>
            )}
            {showCloseButton && (
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleManualClose}
                  disabled={buttonClicked && showInstructions}
                  className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-500 disabled:cursor-default text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <X className="w-5 h-5" />
                  {buttonClicked && showInstructions ? copy.shownBelow : copy.closePage}
                </button>
                {showInstructions && (
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg text-left animate-fadeIn">
                    <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <span className="text-lg">📱</span>
                      {copy.manualClose}
                    </p>
                    {isMobile ? (
                      <ul className="text-sm text-blue-800 space-y-2 list-none">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{copy.ios}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{copy.android}</span>
                        </li>
                      </ul>
                    ) : (
                      <ul className="text-sm text-blue-800 space-y-2 list-none">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{copy.windows}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{copy.mac}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{copy.tabClose}</span>
                        </li>
                      </ul>
                    )}
                    <p className="mt-3 text-xs text-blue-700 italic">
                      {copy.safeToCloseAccepted}
                    </p>
                  </div>
                )}
                {!showInstructions && (
                  <p className="text-xs text-gray-500 text-center">
                    {copy.helpText}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
