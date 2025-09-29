// Comprehensive warning suppression for Ant Design React 19 compatibility
(function() {
  'use strict';
  
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  // Function to check if message should be suppressed
  const shouldSuppressMessage = (message) => {
    if (typeof message !== 'string') return false;
    
    return (
      message.includes('[antd: compatible]') ||
      message.includes('antd v5 support React is 16 ~ 18') ||
      message.includes('see https://u.ant.design/v5-for-19') ||
      message.includes('Warning: [antd: compatible]')
    );
  };

  // Override console.error
  console.error = (...args) => {
    const message = args[0];
    
    if (shouldSuppressMessage(message)) {
      return; // Suppress this specific warning
    }
    
    originalConsoleError.apply(console, args);
  };

  // Override console.warn
  console.warn = (...args) => {
    const message = args[0];
    
    if (shouldSuppressMessage(message)) {
      return; // Suppress this specific warning
    }
    
    originalConsoleWarn.apply(console, args);
  };

  // Override console.log (sometimes warnings come through here too)
  console.log = (...args) => {
    const message = args[0];
    
    if (shouldSuppressMessage(message)) {
      return; // Suppress this specific warning
    }
    
    originalConsoleLog.apply(console, args);
  };

  // Also suppress React warnings that might be related
  if (typeof window !== 'undefined') {
    // Suppress React DevTools warnings
    const originalDevToolsWarning = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (originalDevToolsWarning && originalDevToolsWarning.onCommitFiberRoot) {
      const originalOnCommitFiberRoot = originalDevToolsWarning.onCommitFiberRoot;
      originalDevToolsWarning.onCommitFiberRoot = function(...args) {
        try {
          return originalOnCommitFiberRoot.apply(this, args);
        } catch (e) {
          // Suppress any errors from React DevTools
          if (e.message && e.message.includes('antd')) {
            return;
          }
          throw e;
        }
      };
    }
  }
})();
