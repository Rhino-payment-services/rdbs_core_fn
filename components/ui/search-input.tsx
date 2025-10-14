"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

function SearchInput({ 
  className, 
  icon = <Search className="h-4 w-4" />, 
  iconPosition = "left",
  ...props 
}: SearchInputProps) {
  return (
    <div className="search-input-container">
      {iconPosition === "left" && (
        <div className="search-icon">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "w-full h-9 px-3 py-1 text-sm transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          iconPosition === "left" ? "pl-10" : "pr-10",
          className
        )}
        {...props}
      />
      {iconPosition === "right" && (
        <div className="search-icon right-3 left-auto">
          {icon}
        </div>
      )}
    </div>
  )
}

export { SearchInput }
