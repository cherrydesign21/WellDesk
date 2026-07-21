import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  label,
  id,
  value,
  placeholder,
  ...props
}: React.ComponentProps<"input"> & { label?: string }) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const hasValue = value !== undefined && value !== null && value !== ""

  if (!label) {
    return (
      <InputPrimitive
        id={inputId}
        type={type}
        value={value}
        placeholder={placeholder}
        data-slot="input"
        className={cn(
          "h-10 w-full min-w-0 rounded-[6px] border border-[#BDBDBD] bg-transparent px-3 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:border-[#737373] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
          className
        )}
        {...props}
      />
    )
  }

  return (
    <div className="relative">
      <InputPrimitive
        id={inputId}
        type={type}
        value={value}
        data-slot="input"
        // the floating label already conveys what this field is — a
        // separate native placeholder would render at the same spot and
        // visually double up with the label when the field is empty.
        placeholder={undefined}
        className={cn(
          "peer h-[60px] w-full min-w-0 rounded-[6px] border bg-transparent px-3 pt-3 text-base transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm",
          hasValue ? "border-[#A3B73A]" : "border-[#BDBDBD] focus:border-[#737373]",
          "aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "pointer-events-none absolute left-3 origin-left text-base text-[#666666] transition-all duration-150",
          hasValue
            ? "top-0 -translate-y-1/2 scale-90 bg-white px-1 text-[#A3B73A]"
            : "top-1/2 -translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-1",
          "peer-aria-invalid:text-destructive",
          "peer-disabled:opacity-50"
        )}
      >
        {label}
      </label>
    </div>
  )
}

export { Input }
