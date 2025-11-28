/**
 * Mobile Test Harness
 * 
 * Tool for testing mobile-specific functionality:
 * - Microphone permissions
 * - Audio playback
 * - Touch interactions
 * - Performance metrics
 * - DOM performance
 */

import React, { useState, useEffect } from 'react';
import { mobileInstrumentation, type MobileMetrics } from '../../utils/mobileInstrumentation';
import { getMobileInfo } from '../../utils/mobileDetection';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  details?: any;
}

export const MobileTestHarness: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [metrics, setMetrics] = useState<MobileMetrics | null>(null);
  const [mobileInfo, setMobileInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      mobileInstrumentation.initialize();
      setMobileInfo(getMobileInfo());
      
      // Update metrics every second
      const interval = setInterval(() => {
        setMetrics(mobileInstrumentation.getMetrics());
      }, 1000);

      return () => {
        clearInterval(interval);
        mobileInstrumentation.stopFPSTracking();
      };
    }
  }, [isOpen]);

  const runTests = async () => {
    const results: TestResult[] = [];

    // Test 1: Microphone Access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      results.push({
        name: 'Microphone Access',
        status: 'fail',
        message: 'getUserMedia not available. Ensure HTTPS or localhost.',
        details: {
          hasMediaDevices: !!navigator.mediaDevices,
          hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          protocol: window.location.protocol,
          hostname: window.location.hostname
        }
      });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        results.push({
          name: 'Microphone Access',
          status: 'pass',
          message: 'Microphone permission granted'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          name: 'Microphone Access',
          status: 'fail',
          message: `Microphone permission denied: ${errorMessage}`,
          details: {
            error: errorMessage,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            note: 'On mobile, this may require HTTPS or user gesture'
          }
        });
      }
    }

    // Test 2: MediaRecorder Support
    if (typeof MediaRecorder !== 'undefined') {
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
      ];
      const supportedTypes = mimeTypes.filter(type => MediaRecorder.isTypeSupported(type));
      
      results.push({
        name: 'MediaRecorder Support',
        status: supportedTypes.length > 0 ? 'pass' : 'fail',
        message: supportedTypes.length > 0 
          ? `Supported: ${supportedTypes.join(', ')}`
          : 'No supported MIME types found',
        details: { supportedTypes }
      });
    } else {
      results.push({
        name: 'MediaRecorder Support',
        status: 'fail',
        message: 'MediaRecorder not available'
      });
    }

    // Test 3: Touch Support
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    results.push({
      name: 'Touch Support',
      status: hasTouch ? 'pass' : 'fail',
      message: hasTouch ? 'Touch events supported' : 'Touch events not supported',
      details: {
        ontouchstart: 'ontouchstart' in window,
        maxTouchPoints: navigator.maxTouchPoints
      }
    });

    // Test 4: Viewport Size
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobileViewport = viewportWidth < 768;
    
    results.push({
      name: 'Viewport Size',
      status: isMobileViewport ? 'pass' : 'fail',
      message: `Viewport: ${viewportWidth}x${viewportHeight}px`,
      details: { width: viewportWidth, height: viewportHeight }
    });

    // Test 5: Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText('test');
        results.push({
          name: 'Clipboard API',
          status: 'pass',
          message: 'Clipboard API available and working'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          name: 'Clipboard API',
          status: 'fail',
          message: `Clipboard API error: ${errorMessage}`,
          details: {
            error: errorMessage,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            note: 'On mobile, clipboard may require HTTPS or user gesture'
          }
        });
      }
    } else {
      // Check for fallback methods
      const hasExecCommand = document.execCommand && typeof document.execCommand === 'function';
      results.push({
        name: 'Clipboard API',
        status: hasExecCommand ? 'fail' : 'fail',
        message: hasExecCommand 
          ? 'Clipboard API not available, but execCommand fallback exists'
          : 'Clipboard API not available',
        details: {
          hasClipboard: !!(navigator.clipboard && navigator.clipboard.writeText),
          hasExecCommand,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          note: 'Modern clipboard API requires HTTPS. Fallback available via execCommand.'
        }
      });
    }

    // Test 6: Audio Context
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      results.push({
        name: 'Audio Context',
        status: 'pass',
        message: `Audio Context available (sample rate: ${audioContext.sampleRate}Hz)`,
        details: { sampleRate: audioContext.sampleRate }
      });
      audioContext.close();
    } catch (error) {
      results.push({
        name: 'Audio Context',
        status: 'fail',
        message: `Audio Context error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 7: Performance API
    if ('performance' in window && 'now' in performance) {
      const perfTime = performance.now();
      results.push({
        name: 'Performance API',
        status: 'pass',
        message: 'Performance API available',
        details: { currentTime: perfTime }
      });
    } else {
      results.push({
        name: 'Performance API',
        status: 'fail',
        message: 'Performance API not available'
      });
    }

    setTestResults(results);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 min-w-[48px] min-h-[48px] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        aria-label="Open Mobile Test Harness"
        title="Mobile Test Harness"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mobile Test Harness</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Device Info */}
          {mobileInfo && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Device Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Device Type:</span> {mobileInfo.deviceType}</div>
                <div><span className="font-medium">Is Mobile:</span> {mobileInfo.isMobile ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Is iOS:</span> {mobileInfo.isIOS ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Is Android:</span> {mobileInfo.isAndroid ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Is Safari:</span> {mobileInfo.isSafari ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Is Chrome:</span> {mobileInfo.isChrome ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Screen:</span> {mobileInfo.screenWidth}x{mobileInfo.screenHeight}</div>
                <div><span className="font-medium">Has Touch:</span> {mobileInfo.hasTouch ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Has Microphone:</span> {mobileInfo.hasMicrophone ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Has MediaRecorder:</span> {mobileInfo.hasMediaRecorder ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {metrics && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">FPS:</span> {metrics.fps}</div>
                <div><span className="font-medium">Frame Drops:</span> {metrics.frameDrops}</div>
                <div><span className="font-medium">Scroll Jank:</span> {metrics.scrollJank}</div>
                <div><span className="font-medium">Touch Latency:</span> {metrics.touchLatency.toFixed(2)}ms</div>
                <div><span className="font-medium">Initial Render:</span> {metrics.initialRenderTime.toFixed(2)}ms</div>
                <div><span className="font-medium">Layout Time:</span> {metrics.domPerformance.layoutTime.toFixed(2)}ms</div>
                <div><span className="font-medium">Paint Time:</span> {metrics.domPerformance.paintTime.toFixed(2)}ms</div>
                <div><span className="font-medium">Composite Time:</span> {metrics.domPerformance.compositeTime.toFixed(2)}ms</div>
              </div>
            </div>
          )}

          {/* Test Results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Test Results</h3>
              <button
                onClick={runTests}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
              >
                Run Tests
              </button>
            </div>
            {testResults.length > 0 ? (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.status === 'pass'
                        ? 'bg-green-50 border-green-200'
                        : result.status === 'fail'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{result.name}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.status === 'pass'
                            ? 'bg-green-100 text-green-800'
                            : result.status === 'fail'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                        <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Click "Run Tests" to start testing</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

