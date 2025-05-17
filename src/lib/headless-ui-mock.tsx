// Este archivo proporciona implementaciones mínimas de componentes @headlessui/react
// para evitar problemas de dependencias durante el desarrollo

import React, { ReactNode, forwardRef, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, DependencyList, EffectCallback } from 'react';

// Mock para @tanstack/react-virtual
export const useVirtualizer = () => ({
  getVirtualItems: () => [],
  getTotalSize: () => 0,
  measure: () => {},
  scrollToIndex: () => {},
  scrollToOffset: () => {},
  getVirtualItemForOffset: () => null
});

// Mocks para los hooks que faltan
export const useActivePress = () => ({ isPressed: false });
export const useControllable = () => {};
export const useDefaultValue = (value: any) => value;
export const useElementSize = () => ({ width: 0, height: 0, measuring: false });
export const useEvent = (fn: Function) => fn;
export const useInertOthers = () => {};
export const useIsMounted = () => ({ isMounted: true });
export const useIsoMorphicEffect = (effect: EffectCallback, deps?: DependencyList) => React.useEffect(effect, deps);
export const useLatestValue = <T,>(value: T) => React.useMemo(() => value, [value]);
export const useOnDisappear = () => {};
export const useResolveButtonType = () => 'button';
export const useTextValue = () => '';
export const useTransition = () => ({ show: true, appear: true });
export const useTreeWalker = () => {};
export const useWatch = () => {};
export const useDisposables = () => ({ dispose: () => {}, add: () => {} });
export const useDisabled = () => false;
export const useWindowEvent = () => {};
export const useDocumentEvent = () => {};
export const useOutsideClick = () => {};
export const useServerHandoffComplete = () => true;
export const useScrollLock = () => {};

// Utilidades
export const classNames = (...classes: any[]) => classes.filter(Boolean).join(' ');
export const match = () => true;
export const isDisabledReactIssue7711 = () => false;
export const attemptSubmit = () => {};
export const objectToFormEntries = () => [];
export const compact = (arr: any[]) => arr.filter(Boolean);
export const getOwnerDocument = () => document;
export const startTransition = (callback: Function) => callback();
export const env = { test: false, production: false, development: true };

// Exportar constantes
export const RenderStrategy = { Static: 0, RenderStrategy: 1 };
export const RenderFeatures = { Static: 0, RenderFeatures: 1 };
export const Keys = { Space: ' ', Enter: 'Enter', Escape: 'Escape', Backspace: 'Backspace', Delete: 'Delete', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', Tab: 'Tab' };
export const Focus = { First: 1, Previous: 2, Next: 3, Last: 4, Specific: 5, Nothing: 6 };
export const CloseProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
export const MainTreeProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
export const Hidden = (props: any) => <div hidden {...props} />;
export const HiddenFeatures = { Hidden: 0, HiddenFeatures: 1 };

// Componentes menu
export const Menu = ({ children }: { children: ReactNode }) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

Menu.Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }>(({ children, ...props }, ref) => {
  return (
    <button ref={ref} {...props} type="button" className="inline-flex justify-center">
      {children}
    </button>
  );
});

Menu.Items = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { children: ReactNode }>(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props} className="absolute right-0 mt-2 w-56 origin-top-right bg-white">
      {children}
    </div>
  );
});

Menu.Item = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { children: ReactNode }>(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props} className="px-4 py-2">
      {children}
    </div>
  );
});

// Componentes dialog/modal
export const Dialog = ({ children, open, onClose }: { children: ReactNode, open: boolean, onClose: () => void }) => {
  if (!open) return null;
  return <div className="fixed inset-0 z-10 overflow-y-auto">{children}</div>;
};

Dialog.Panel = ({ children }: { children: ReactNode }) => {
  return <div className="relative bg-white rounded-lg">{children}</div>;
};

Dialog.Title = ({ children }: { children: ReactNode }) => {
  return <h2 className="text-lg font-medium text-gray-900">{children}</h2>;
};

Dialog.Description = ({ children }: { children: ReactNode }) => {
  return <p className="text-sm text-gray-500">{children}</p>;
};

Dialog.Overlay = () => <div className="fixed inset-0 bg-black bg-opacity-25" />;

// Otros componentes
export const Disclosure = ({ children }: { children: ReactNode }) => {
  return <div>{children}</div>;
};

Disclosure.Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }>(({ children, ...props }, ref) => {
  return (
    <button ref={ref} {...props} type="button">
      {children}
    </button>
  );
});

Disclosure.Panel = ({ children }: { children: ReactNode }) => {
  return <div>{children}</div>;
};

export const Switch = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { 
  checked: boolean; 
  onChange: (value: boolean) => void; 
  children?: ReactNode 
}>(({ checked, onChange, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked ? "true" : "false"}
      className={`${checked ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}
      onClick={() => onChange(!checked)}
      {...props}
    >
      <span className="sr-only">Enable</span>
      <span
        className={`${
          checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
      />
      {children}
    </button>
  );
});

export const Transition = ({ show, children }: { show?: boolean; children: ReactNode }) => {
  if (show === false) return null;
  return <>{children}</>;
};

Transition.Child = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

// Grupo (Tab/TabGroup)
export const Tab = ({ children }: { children: ReactNode }) => {
  return <div>{children}</div>;
};

Tab.Group = ({ children }: { children: ReactNode }) => {
  return <div>{children}</div>;
};

Tab.List = ({ children }: { children: ReactNode }) => {
  return <div className="flex space-x-1 border-b">{children}</div>;
};

Tab.Panels = ({ children }: { children: ReactNode }) => {
  return <div className="mt-2">{children}</div>;
};

Tab.Panel = ({ children }: { children: ReactNode }) => {
  return <div className="p-3">{children}</div>;
};

export const Combobox = ({ children, value, onChange }: { children: ReactNode, value: any, onChange: (value: any) => void }) => {
  return <div>{children}</div>;
};

Combobox.Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ ...props }, ref) => {
  return <input ref={ref} {...props} type="text" className="w-full border rounded p-2" />;
});

Combobox.Options = ({ children }: { children: ReactNode }) => {
  return <ul className="absolute max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg">{children}</ul>;
};

Combobox.Option = ({ children, value }: { children: ReactNode, value: any }) => {
  return <li className="cursor-default select-none py-2 pl-10 pr-4">{children}</li>;
};

Combobox.Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }>(({ children, ...props }, ref) => {
  return (
    <button ref={ref} {...props} type="button">
      {children}
    </button>
  );
});

export const Listbox = ({ children, value, onChange }: { children: ReactNode, value: any, onChange: (value: any) => void }) => {
  return <div className="relative mt-1">{children}</div>;
};

Listbox.Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }>(({ children, ...props }, ref) => {
  return (
    <button ref={ref} {...props} type="button" className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md">
      {children}
    </button>
  );
});

Listbox.Options = ({ children }: { children: ReactNode }) => {
  return <ul className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg">{children}</ul>;
};

Listbox.Option = ({ children, value }: { children: ReactNode, value: any }) => {
  return <li className="cursor-default select-none py-2 pl-10 pr-4">{children}</li>;
};

export const RadioGroup = ({ children, value, onChange }: { children: ReactNode, value: any, onChange: (value: any) => void }) => {
  return <div>{children}</div>;
};

RadioGroup.Option = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { children: ReactNode, value: any }>(({ children, value, ...props }, ref) => {
  return (
    <div ref={ref} {...props} className="cursor-pointer">
      {children}
    </div>
  );
});

export const Popover = ({ children }: { children: ReactNode }) => {
  return <div className="relative">{children}</div>;
};

Popover.Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }>(({ children, ...props }, ref) => {
  return (
    <button ref={ref} {...props} type="button">
      {children}
    </button>
  );
});

Popover.Panel = ({ children }: { children: ReactNode }) => {
  return <div className="absolute z-10 w-screen max-w-sm transform px-4 sm:px-0 lg:max-w-3xl">{children}</div>;
}; 