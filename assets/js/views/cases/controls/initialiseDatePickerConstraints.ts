export const initialiseDatePickerConstraints = (todayDateStr: string) => {
  const todayDate = todayDateStr || new Date().toLocaleDateString('en-GB');

  type MojDatePickerModule = {
    setMinDate: (date: string) => void
    setMaxDate: (date: string) => void
  }

  const getPickerModule = (inputId: string): MojDatePickerModule | null => {
    const input = document.getElementById(inputId);
    const wrapper = input?.closest('.moj-datepicker') as HTMLElement & { 
      mojDatePicker?: MojDatePickerModule 
    };
    return wrapper?.mojDatePicker ?? null;
  }

  const applyLogic = () => {
    const startInput = document.getElementById('start-date') as HTMLInputElement;
    const endInput = document.getElementById('end-date') as HTMLInputElement;
    
    const startModule = getPickerModule('start-date');
    const endModule = getPickerModule('end-date');

    // Only proceed if BOTH modules are initialized
    if (!startModule || !endModule) {
      console.log('[DateConstraints] Modules not ready yet, retrying in 200ms...');
      setTimeout(applyLogic, 200);
      return;
    }

    console.log('%c [DateConstraints] Modules found! Applying rules.', 'color: green; font-weight: bold;');

    // 1. Initial State: No future dates
    startModule.setMaxDate(todayDate);
    endModule.setMaxDate(todayDate);

    // 2. Change Listeners
    startInput.addEventListener('change', () => {
      const startDate = parseDate(startInput.value);
      if (startDate) {
        const endModuleUpdate = getPickerModule('end-date');
        endModuleUpdate?.setMinDate(startInput.value);
        
        const limit = new Date(startDate);
        limit.setDate(limit.getDate() + 14);
        const today = parseDate(todayDate) || new Date();
        endModuleUpdate?.setMaxDate(formatDate(limit > today ? today : limit));
      }
    });

    endInput.addEventListener('change', () => {
      const endDate = parseDate(endInput.value);
      if (endDate) {
        const startModuleUpdate = getPickerModule('start-date');
        startModuleUpdate?.setMaxDate(endInput.value);
        
        const limit = new Date(endDate);
        limit.setDate(limit.getDate() - 14);
        startModuleUpdate?.setMinDate(formatDate(limit));
      }
    });
  };

  // Helper functions
  const parseDate = (s: string) => {
    const p = s.split('/');
    return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]) : null;
  };
  const formatDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

  // Start the polling process
  applyLogic();
};