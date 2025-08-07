import { useState, useEffect } from 'react';

// 移動端檢測 Hook
export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };

    // 初始檢查
    checkDevice();

    // 監聽視窗大小變化
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize,
    isSmallMobile: screenSize.width <= 375,
    isLandscape: screenSize.width > screenSize.height,
    isPortrait: screenSize.width <= screenSize.height
  };
};

// 觸控設備檢測 Hook
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);

    return () => {
      window.removeEventListener('resize', checkTouch);
    };
  }, []);

  return { isTouchDevice };
};

// 網路狀態檢測 Hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 檢查網路連接類型
    updateConnectionInfo();
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    isSlowConnection: ['slow-2g', '2g'].includes(connectionType)
  };
};

// 設備方向檢測 Hook
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerWidth > window.innerHeight) {
        setOrientation('landscape');
      } else {
        setOrientation('portrait');
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return { orientation, isLandscape: orientation === 'landscape', isPortrait: orientation === 'portrait' };
};

// 虛擬鍵盤檢測 Hook (iOS Safari 等)
export const useVirtualKeyboard = () => {
  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen] = useState(false);
  const [initialViewportHeight, setInitialViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    setInitialViewportHeight(window.innerHeight);

    const checkVirtualKeyboard = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // 如果高度減少超過 150px，認為虛擬鍵盤打開
      setIsVirtualKeyboardOpen(heightDifference > 150);
    };

    window.addEventListener('resize', checkVirtualKeyboard);
    
    // 監聽輸入框焦點事件
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        setTimeout(checkVirtualKeyboard, 300);
      });
      input.addEventListener('blur', () => {
        setTimeout(checkVirtualKeyboard, 300);
      });
    });

    return () => {
      window.removeEventListener('resize', checkVirtualKeyboard);
    };
  }, [initialViewportHeight]);

  return { isVirtualKeyboardOpen };
};

// 設備性能檢測 Hook
export const useDevicePerformance = () => {
  const [devicePerformance, setDevicePerformance] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    const detectPerformance = () => {
      // 檢查硬體併行能力
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      
      // 檢查記憶體 (Chrome)
      const memory = (navigator as any).deviceMemory;
      
      // 檢查網路速度
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;

      let performanceScore = 0;

      // CPU 評分
      if (hardwareConcurrency >= 8) performanceScore += 3;
      else if (hardwareConcurrency >= 4) performanceScore += 2;
      else performanceScore += 1;

      // 記憶體評分
      if (memory) {
        if (memory >= 8) performanceScore += 3;
        else if (memory >= 4) performanceScore += 2;
        else performanceScore += 1;
      } else {
        performanceScore += 2; // 假設中等記憶體
      }

      // 網路評分
      if (effectiveType) {
        if (effectiveType === '4g') performanceScore += 2;
        else if (effectiveType === '3g') performanceScore += 1;
        else performanceScore += 0;
      } else {
        performanceScore += 1; // 假設一般網路
      }

      // 根據總分判斷性能等級
      if (performanceScore >= 7) setDevicePerformance('high');
      else if (performanceScore >= 4) setDevicePerformance('medium');
      else setDevicePerformance('low');
    };

    detectPerformance();
  }, []);

  return { devicePerformance };
};

// 電池狀態檢測 Hook
export const useBatteryStatus = () => {
  const [batteryInfo, setBatteryInfo] = useState({
    level: 1,
    charging: true,
    chargingTime: Infinity,
    dischargingTime: Infinity
  });

  useEffect(() => {
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          
          const updateBatteryInfo = () => {
            setBatteryInfo({
              level: battery.level,
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime
            });
          };

          updateBatteryInfo();

          battery.addEventListener('chargingchange', updateBatteryInfo);
          battery.addEventListener('levelchange', updateBatteryInfo);
          battery.addEventListener('chargingtimechange', updateBatteryInfo);
          battery.addEventListener('dischargingtimechange', updateBatteryInfo);

          return () => {
            battery.removeEventListener('chargingchange', updateBatteryInfo);
            battery.removeEventListener('levelchange', updateBatteryInfo);
            battery.removeEventListener('chargingtimechange', updateBatteryInfo);
            battery.removeEventListener('dischargingtimechange', updateBatteryInfo);
          };
        } catch (error) {
          console.log('Battery API not supported:', error);
        }
      }
    };

    getBatteryInfo();
  }, []);

  return {
    ...batteryInfo,
    isLowBattery: batteryInfo.level < 0.2,
    isCriticalBattery: batteryInfo.level < 0.1
  };
};

// 綜合移動端 Hook
export const useMobileOptimization = () => {
  const mobile = useMobile();
  const touch = useTouchDevice();
  const network = useNetworkStatus();
  const orientation = useOrientation();
  const keyboard = useVirtualKeyboard();
  const performance = useDevicePerformance();
  const battery = useBatteryStatus();

  return {
    ...mobile,
    ...touch,
    ...network,
    ...orientation,
    ...keyboard,
    ...performance,
    ...battery,
    
    // 綜合建議
    shouldReduceAnimations: performance.devicePerformance === 'low' || battery.isLowBattery,
    shouldOptimizeImages: network.isSlowConnection || performance.devicePerformance === 'low',
    shouldUseLazyLoading: mobile.isMobile || network.isSlowConnection,
    shouldMinimizeNetworkRequests: network.isSlowConnection || network.isOffline
  };
};