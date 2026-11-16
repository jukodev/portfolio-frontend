import { Children, isValidElement, useState, type ReactNode } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

type Option = { value: string | number; children: ReactNode; disabled?: boolean };
type Props = {
  children: ReactNode; value?: string | number; defaultValue?: string | number;
  name?: string; required?: boolean; disabled?: boolean; label?: string;
  'aria-label'?: string;
  onChange?: (event: { target: { value: string } }) => void;
};
const emptyValue = '__portfolio_empty__';

// Keep option markup and native form submission while sharing one accessible picker.
export function PortfolioSelect({ children, value, defaultValue, label, onChange, ...props }: Props) {
  const options = Children.toArray(children).filter(isValidElement<Option>).map(child => ({
    ...child.props, value: String(child.props.value ?? child.props.children),
  }));
  const encode = (v: string | number) => String(v) || emptyValue;
  const [localValue, setLocalValue] = useState(String(defaultValue ?? options[0]?.value ?? ''));
  const [triggerNode, setTriggerNode] = useState<HTMLButtonElement | null>(null);
  const selected = String(value ?? localValue);
  return <Select.Root value={props.name ? selected : encode(selected)}
    name={props.name} required={props.required} disabled={props.disabled}
    onValueChange={v => { const next = v === emptyValue ? '' : v; setLocalValue(next); onChange?.({ target: { value: next } }); }}>
    <Select.Trigger ref={setTriggerNode} className="select-trigger" aria-label={props['aria-label'] ?? label}>
      {label && <span className="select-label">{label}</span>}
      <span className="select-value"><Select.Value placeholder={options.find(x => x.value === '')?.children} /></span>
      <Select.Icon className="select-chevron"><ChevronDown size={15} /></Select.Icon>
    </Select.Trigger>
    <Select.Portal container={triggerNode?.closest('dialog') ?? undefined}><Select.Content className="select-menu" position="popper" sideOffset={6} align="start" collisionPadding={12}>
      <Select.ScrollUpButton className="select-scroll"><ChevronUp size={16} /></Select.ScrollUpButton>
      <Select.Viewport className="select-options">{options.map(option =>
        <Select.Item className="select-option" key={option.value} value={encode(option.value)} disabled={option.disabled}>
          <Select.ItemText>{option.children}</Select.ItemText>
          <Select.ItemIndicator className="select-check"><Check size={16} /></Select.ItemIndicator>
        </Select.Item>)}
      </Select.Viewport>
      <Select.ScrollDownButton className="select-scroll"><ChevronDown size={16} /></Select.ScrollDownButton>
    </Select.Content></Select.Portal>
  </Select.Root>;
}
