import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
}

export function DropdownMenu({ trigger, children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [isOpen])

  return (
    <div className="relative">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed w-48 rounded-md bg-popover border border-border shadow-lg z-[9999]"
            style={{
              top: `${position.top}px`,
              right: `${position.right}px`,
            }}
          >
            <div className="py-1">{children}</div>
          </div>,
          document.body
        )}
    </div>
  )
}

interface DropdownMenuItemProps {
  onClick: () => void
  children: React.ReactNode
  icon?: React.ReactNode
}

export function DropdownMenuItem({ onClick, children, icon }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 transition-colors"
    >
      {icon}
      {children}
    </button>
  )
}
