// frontend/src/components/student/ViolationMonitor.jsx
import React, { useEffect, useRef } from 'react';

const ViolationMonitor = ({ onViolation, onForceSubmit }) => {
  const visibilityRef = useRef(true);
  const violationCountRef = useRef(0);
  const MAX_VIOLATIONS = 1; // Auto-submit on first serious violation

  useEffect(() => {
    // Tab visibility change detection - AUTO-SUBMIT on tab switch
    const handleVisibilityChange = () => {
      if (document.hidden && visibilityRef.current) {
        visibilityRef.current = false;
        violationCountRef.current++;
        onViolation('tab_switch', 'User switched to another tab or application');
        
        // AUTO-SUBMIT immediately for tab switching
        console.log('🚨 Tab switch detected - auto-submitting exam');
        onForceSubmit('Tab switching detected. Exam submitted automatically.');
      } else if (!document.hidden) {
        visibilityRef.current = true;
      }
    };

    // Developer tools detection
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 100;
      const heightThreshold = window.outerHeight - window.innerHeight > 100;
      
      if (widthThreshold || heightThreshold) {
        violationCountRef.current++;
        onViolation('devtools_opened', 'Developer tools detected');
        
        // AUTO-SUBMIT for developer tools
        console.log('🚨 Developer tools detected - auto-submitting exam');
        onForceSubmit('Developer tools detected. Exam submitted automatically.');
      }
    };

    // Periodic devtools check
    const devToolsCheckInterval = setInterval(checkDevTools, 1000);

    // Key combinations that indicate cheating attempts
    const handleKeyDown = (e) => {
      // Developer tools shortcuts - AUTO-SUBMIT
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        (e.metaKey && e.altKey && e.key === 'i') // Mac dev tools
      ) {
        e.preventDefault();
        violationCountRef.current++;
        onViolation('devtools_shortcut', `Developer tools shortcut attempted: ${e.key}`);
        
        // AUTO-SUBMIT for dev tools shortcuts
        console.log('🚨 Dev tools shortcut detected - auto-submitting exam');
        onForceSubmit('Developer tools access attempted. Exam submitted automatically.');
        return false;
      }

      // Print screen / screenshot attempts
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        violationCountRef.current++;
        onViolation('screenshot_attempt', 'Screenshot attempt detected');
        
        // AUTO-SUBMIT for screenshot attempts
        console.log('🚨 Screenshot attempt detected - auto-submitting exam');
        onForceSubmit('Screenshot attempt detected. Exam submitted automatically.');
        return false;
      }

      // Alt+Tab detection (though less reliable)
      if (e.altKey && e.key === 'Tab') {
        violationCountRef.current++;
        onViolation('alt_tab', 'Alt+Tab switching detected');
        
        // AUTO-SUBMIT for Alt+Tab
        console.log('🚨 Alt+Tab detected - auto-submitting exam');
        onForceSubmit('Application switching detected. Exam submitted automatically.');
      }
    };

    // Copy prevention (but don't auto-submit for minor violations)
    const handleCopy = (e) => {
      e.preventDefault();
      onViolation('copy_attempt', 'Copy action attempted');
      // Just prevent, don't auto-submit for copy attempts
      return false;
    };

    // Prevent drag and drop of content
    const handleDragStart = (e) => {
      e.preventDefault();
      onViolation('drag_attempt', 'Content drag attempt detected');
      return false;
    };

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('dragstart', handleDragStart);

    // Blur/focus events as additional protection
    const handleBlur = () => {
      // If window loses focus, it might indicate tab switching or app switching
      setTimeout(() => {
        if (!document.hasFocus()) {
          violationCountRef.current++;
          onViolation('window_blur', 'Window lost focus - possible app switching');
          
          // AUTO-SUBMIT for window blur
          console.log('🚨 Window blur detected - auto-submitting exam');
          onForceSubmit('Window focus lost. Exam submitted automatically.');
        }
      }, 100);
    };

    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('blur', handleBlur);
      clearInterval(devToolsCheckInterval);
    };
  }, [onViolation, onForceSubmit]);

  return null;
};

export default ViolationMonitor;