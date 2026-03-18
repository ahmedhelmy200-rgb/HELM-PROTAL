import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva } from "class-variance-authority";
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
const Sheet = SheetPrimitive.Root; const SheetTrigger = SheetPrimitive.Trigger; const SheetClose = SheetPrimitive.Close; const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => <SheetPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} ref={ref} />)
const sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out", { variants: { side: { top: "inset-x-0 top-0 border-b", bottom: "inset-x-0 bottom-0 border-t", left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm", right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm" } }, defaultVariants: { side: "right" } })
const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => <SheetPortal><SheetOverlay /><SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}><SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70"><X className="h-4 w-4" /><span className="sr-only">Close</span></SheetPrimitive.Close>{children}</SheetPrimitive.Content></SheetPortal>)
const SheetHeader = ({ className, ...props }) => <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
const SheetFooter = ({ className, ...props }) => <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => <SheetPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />)
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => <SheetPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />)
export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription }
