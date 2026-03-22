import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface ClayInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  suffix?: ReactNode
}

const ClayInput = forwardRef<HTMLInputElement, ClayInputProps>(
  ({ label, error, suffix, id, ...props }, ref) => {
    const inputId = id ?? label.replace(/\s+/g, '-').toLowerCase()

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className="font-heading text-sm font-semibold text-text"
        >
          {label}
          {props.required && (
            <span className="ml-1 text-[#EF4444]" aria-hidden="true">*</span>
          )}
        </label>

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={[
              'w-full px-4 py-3 rounded-clay border-[3px] bg-white font-body text-text',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-primary/40',
              'transition-shadow duration-[250ms]',
              'cursor-text',
              error
                ? 'border-[#EF4444] shadow-[4px_4px_0px_0px_rgba(239,68,68,0.20)]'
                : 'border-primary/40 hover:border-primary focus:border-primary shadow-clay',
              suffix ? 'pr-12' : '',
            ].join(' ')}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="font-body text-xs text-[#EF4444] mt-0.5"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

ClayInput.displayName = 'ClayInput'
export default ClayInput
