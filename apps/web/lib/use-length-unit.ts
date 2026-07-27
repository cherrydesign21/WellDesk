'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { LengthUnit } from '@welldesk/shared';

const STORAGE_KEY = 'welldesk:length-unit';
const CHANGE_EVENT = 'welldesk:length-unit-change';

function getSnapshot(): LengthUnit {
  return window.localStorage.getItem(STORAGE_KEY) === 'in' ? 'in' : 'cm';
}

function getServerSnapshot(): LengthUnit {
  return 'cm';
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useLengthUnit(): [LengthUnit, (unit: LengthUnit) => void] {
  const unit = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setUnit = useCallback((next: LengthUnit) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [unit, setUnit];
}
