// Este archivo proporciona implementaciones mínimas de componentes @headlessui/react
// para evitar problemas de dependencias durante el desarrollo

/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, {
  ReactNode,
  forwardRef,
  HTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  DependencyList,
  EffectCallback,
} from "react";

// Tipo base para componentes con displayName
type ComponentWithDisplayName<P = Record<string, never>> = React.FC<P> & {
  displayName?: string;
};

// Función helper para establecer displayName de manera segura
const setDisplayName = <T extends React.ComponentType<any>>(
  component: T,
  name: string,
): T => {
  Object.defineProperty(component, "displayName", { value: name });
  return component;
};

// Interfaz para el componente Disclosure y sus subcomponentes
interface DisclosureComponent extends React.FC<{ children: ReactNode }> {
  Button: React.ForwardRefExoticComponent<
    ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }
  >;
  Panel: React.FC<{ children: ReactNode }>;
}

// Interfaces para props de componentes
interface DisclosureProps {
  children: ReactNode;
}

interface DisclosureButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

interface DisclosurePanelProps {
  children: ReactNode;
}

interface DialogProps {
  children: ReactNode;
  className?: string;
  open?: boolean;
  onClose?: () => void;
}

interface MenuProps {
  children: ReactNode;
  className?: string;
}

interface MenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

interface MenuItemsProps {
  children: ReactNode;
  className?: string;
}

interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

interface ListboxProps {
  children: ReactNode;
  className?: string;
}

interface ListboxButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

interface ListboxOptionsProps {
  children: ReactNode;
  className?: string;
}

interface ListboxOptionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
}

interface TransitionProps {
  show?: boolean;
  children: ReactNode;
}

interface TabProps {
  children: ReactNode;
}

interface ComboboxProps {
  children: ReactNode;
}

interface ComboboxInputProps extends InputHTMLAttributes<HTMLInputElement> {}

interface ComboboxOptionsProps {
  children: ReactNode;
}

interface ComboboxOptionProps {
  children: ReactNode;
  value: string;
}

interface RadioGroupProps {
  children: ReactNode;
}

interface RadioGroupOptionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  value: string;
}

interface PopoverProps {
  children: ReactNode;
}

interface PopoverButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

interface PopoverPanelProps {
  children: ReactNode;
}

// Mock para @tanstack/react-virtual
export const useVirtualizer = () => ({
  getVirtualItems: () => [],
  getTotalSize: () => 0,
  measure: () => {},
  scrollToIndex: () => {},
  scrollToOffset: () => {},
  getVirtualItemForOffset: () => null,
});

// Mocks para los hooks que faltan
export const useActivePress = () => ({ isPressed: false });
export const useControllable = () => {};
export const useDefaultValue = <T,>(value: T): T => value;
export const useElementSize = () => ({ width: 0, height: 0, measuring: false });
export const useEvent = <T extends (...args: unknown[]) => unknown>(fn: T): T =>
  fn;
export const useInertOthers = () => {};
export const useIsMounted = () => ({ isMounted: true });
export const useIsoMorphicEffect = (
  effect: EffectCallback,
  deps?: DependencyList,
) => React.useEffect(effect, deps);
export const useLatestValue = <T,>(value: T) =>
  React.useMemo(() => value, [value]);
export const useOnDisappear = () => {};
export const useResolveButtonType = () => "button";
export const useTextValue = () => "";
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
export const classNames = (...classes: string[]): string =>
  classes.filter(Boolean).join(" ");
export const match = () => true;
export const isDisabledReactIssue7711 = () => false;
export const attemptSubmit = () => {};
export const objectToFormEntries = () => [];
export const compact = <T,>(arr: T[]): T[] => arr.filter(Boolean);
export const getOwnerDocument = () => document;
export const startTransition = (callback: () => void): void => callback();
export const env = { test: false, production: false, development: true };

// Exportar constantes
export const RenderStrategy = { Static: 0, RenderStrategy: 1 };
export const RenderFeatures = { Static: 0, RenderFeatures: 1 };
export const Keys = {
  Space: " ",
  Enter: "Enter",
  Escape: "Escape",
  Backspace: "Backspace",
  Delete: "Delete",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  Tab: "Tab",
};
export const Focus = {
  First: 1,
  Previous: 2,
  Next: 3,
  Last: 4,
  Specific: 5,
  Nothing: 6,
};

// Componentes base
export const CloseProvider = setDisplayName(
  ({ children }: { children: ReactNode }) => <>{children}</>,
  "CloseProvider",
);

export const MainTreeProvider = setDisplayName(
  ({ children }: { children: ReactNode }) => <>{children}</>,
  "MainTreeProvider",
);

export const Hidden = setDisplayName(
  (props: HTMLAttributes<HTMLDivElement>) => <div hidden {...props} />,
  "Hidden",
);

export const HiddenFeatures = { Hidden: 0, HiddenFeatures: 1 };

// Dialog y componentes relacionados
export const Dialog = setDisplayName(
  ({ children, className, open, onClose }: DialogProps) => {
    if (!open) return null;
    return (
      <div className={className} data-testid="mock-dialog">
        {children}
      </div>
    );
  },
  "Dialog",
);

// Menu y componentes relacionados
export const Menu = setDisplayName(
  ({ children, className }: MenuProps) => (
    <div className={className} data-testid="mock-menu">
      {children}
    </div>
  ),
  "Menu",
);

export const MenuButton = setDisplayName(
  forwardRef<HTMLButtonElement, MenuButtonProps>(
    ({ children, className, onClick, disabled }, ref) => (
      <button
        ref={ref}
        className={className}
        onClick={onClick}
        disabled={disabled}
        data-testid="mock-menu-button"
      >
        {children}
      </button>
    ),
  ),
  "MenuButton",
);

export const MenuItems = setDisplayName(
  ({ children, className }: MenuItemsProps) => (
    <div className={className} data-testid="mock-menu-items">
      {children}
    </div>
  ),
  "MenuItems",
);

export const MenuItem = setDisplayName(
  forwardRef<HTMLButtonElement, MenuItemProps>(
    ({ children, className, onClick }, ref) => (
      <button
        ref={ref}
        className={className}
        onClick={onClick}
        data-testid="mock-menu-item"
      >
        {children}
      </button>
    ),
  ),
  "MenuItem",
);

// Listbox y componentes relacionados
export const Listbox = setDisplayName(
  ({ children, className }: ListboxProps) => (
    <div className={className} data-testid="mock-listbox">
      {children}
    </div>
  ),
  "Listbox",
);

export const ListboxButton = setDisplayName(
  forwardRef<HTMLButtonElement, ListboxButtonProps>(
    ({ children, className, onClick }, ref) => (
      <button
        ref={ref}
        className={className}
        onClick={onClick}
        data-testid="mock-listbox-button"
      >
        {children}
      </button>
    ),
  ),
  "ListboxButton",
);

export const ListboxOptions = setDisplayName(
  ({ children, className }: ListboxOptionsProps) => (
    <div className={className} data-testid="mock-listbox-options">
      {children}
    </div>
  ),
  "ListboxOptions",
);

export const ListboxOption = setDisplayName(
  forwardRef<HTMLButtonElement, ListboxOptionProps>(
    ({ children, className, onClick }, ref) => (
      <button
        ref={ref}
        className={className}
        onClick={onClick}
        data-testid="mock-listbox-option"
      >
        {children}
      </button>
    ),
  ),
  "ListboxOption",
);

// Disclosure y componentes relacionados
export const Disclosure = setDisplayName(
  ({ children }: DisclosureProps) => <div>{children}</div>,
  "Disclosure",
) as ComponentWithDisplayName<DisclosureProps> & {
  Button: ComponentWithDisplayName<DisclosureButtonProps>;
  Panel: ComponentWithDisplayName<DisclosurePanelProps>;
};

Disclosure.Button = setDisplayName(
  forwardRef<HTMLButtonElement, DisclosureButtonProps>(
    ({ children, ...props }, ref) => (
      <button ref={ref} {...props} type="button">
        {children}
      </button>
    ),
  ),
  "Disclosure.Button",
);

Disclosure.Panel = setDisplayName(
  ({ children }: DisclosurePanelProps) => <div>{children}</div>,
  "Disclosure.Panel",
);

// Switch
export const Switch = setDisplayName(
  forwardRef<
    HTMLButtonElement,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & SwitchProps
  >(({ checked, onChange, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        className={`${checked ? "bg-blue-600" : "bg-gray-200"} relative inline-flex h-6 w-11 items-center rounded-full`}
        onClick={() => onChange(!checked)}
        {...props}
      >
        <span className="sr-only">Enable</span>
        <span
          className={`${checked ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition`}
        />
        {children}
      </button>
    );
  }),
  "Switch",
);

// Transition
export const Transition = setDisplayName(
  ({ show, children }: TransitionProps) => {
    if (show === false) return null;
    return <>{children}</>;
  },
  "Transition",
) as ComponentWithDisplayName<TransitionProps> & {
  Child: ComponentWithDisplayName<{ children: ReactNode }>;
};

Transition.Child = setDisplayName(
  ({ children }: { children: ReactNode }) => <>{children}</>,
  "Transition.Child",
);

// Tab y componentes relacionados
export const Tab = setDisplayName(
  ({ children }: TabProps) => <div>{children}</div>,
  "Tab",
) as ComponentWithDisplayName<TabProps> & {
  Group: ComponentWithDisplayName<{ children: ReactNode }>;
  List: ComponentWithDisplayName<{ children: ReactNode }>;
  Panels: ComponentWithDisplayName<{ children: ReactNode }>;
  Panel: ComponentWithDisplayName<{ children: ReactNode }>;
};

Tab.Group = setDisplayName(
  ({ children }: { children: ReactNode }) => <div>{children}</div>,
  "Tab.Group",
);

Tab.List = setDisplayName(
  ({ children }: { children: ReactNode }) => (
    <div className="flex space-x-1 border-b">{children}</div>
  ),
  "Tab.List",
);

Tab.Panels = setDisplayName(
  ({ children }: { children: ReactNode }) => (
    <div className="mt-2">{children}</div>
  ),
  "Tab.Panels",
);

Tab.Panel = setDisplayName(
  ({ children }: { children: ReactNode }) => (
    <div className="p-3">{children}</div>
  ),
  "Tab.Panel",
);

// Combobox y componentes relacionados
export const Combobox = setDisplayName(
  ({ children }: ComboboxProps) => <div>{children}</div>,
  "Combobox",
) as ComponentWithDisplayName<ComboboxProps> & {
  Input: ComponentWithDisplayName<ComboboxInputProps>;
  Options: ComponentWithDisplayName<ComboboxOptionsProps>;
  Option: ComponentWithDisplayName<ComboboxOptionProps>;
};

Combobox.Input = setDisplayName(
  forwardRef<HTMLInputElement, ComboboxInputProps>(({ ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      type="text"
      className="w-full border rounded p-2"
    />
  )),
  "Combobox.Input",
);

Combobox.Options = setDisplayName(
  ({ children }: ComboboxOptionsProps) => (
    <ul className="absolute max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg">
      {children}
    </ul>
  ),
  "Combobox.Options",
);

Combobox.Option = setDisplayName(
  ({ children, value }: ComboboxOptionProps) => (
    <li className="cursor-default select-none py-2 pl-10 pr-4">{children}</li>
  ),
  "Combobox.Option",
);

// RadioGroup y componentes relacionados
export const RadioGroup = setDisplayName(
  ({ children }: RadioGroupProps) => <div>{children}</div>,
  "RadioGroup",
) as ComponentWithDisplayName<RadioGroupProps> & {
  Option: ComponentWithDisplayName<RadioGroupOptionProps>;
};

RadioGroup.Option = setDisplayName(
  forwardRef<HTMLDivElement, RadioGroupOptionProps>(
    ({ children, value, ...props }, ref) => (
      <div ref={ref} {...props} className="cursor-pointer">
        {children}
      </div>
    ),
  ),
  "RadioGroup.Option",
);

// Popover y componentes relacionados
export const Popover = setDisplayName(
  ({ children }: PopoverProps) => <div className="relative">{children}</div>,
  "Popover",
) as ComponentWithDisplayName<PopoverProps> & {
  Button: ComponentWithDisplayName<PopoverButtonProps>;
  Panel: ComponentWithDisplayName<PopoverPanelProps>;
};

Popover.Button = setDisplayName(
  forwardRef<HTMLButtonElement, PopoverButtonProps>(
    ({ children, ...props }, ref) => (
      <button ref={ref} {...props} type="button">
        {children}
      </button>
    ),
  ),
  "Popover.Button",
);

Popover.Panel = setDisplayName(
  ({ children }: PopoverPanelProps) => (
    <div className="absolute z-10 w-screen max-w-sm transform px-4 sm:px-0 lg:max-w-3xl">
      {children}
    </div>
  ),
  "Popover.Panel",
);
