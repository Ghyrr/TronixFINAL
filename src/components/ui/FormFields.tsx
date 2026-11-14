import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
}

export function Field({ label, error, hint, required, children }: FieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ms-1 text-brand-600">*</span>}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs font-medium text-brand-700" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, className = '', ...rest } = props;
  return (
    <input
      {...rest}
      className={`input-base ${invalid ? 'border-brand-500 focus:border-brand-600' : ''} ${className}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  const { invalid, className = '', ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`input-base min-h-[96px] resize-y ${invalid ? 'border-brand-500' : ''} ${className}`}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props;
  return <select {...rest} className={`input-base pe-9 ${className}`} />;
}
