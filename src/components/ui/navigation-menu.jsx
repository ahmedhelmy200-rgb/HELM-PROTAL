import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
const NavigationMenu = React.forwardRef(({ className, children, ...props }, ref) => <NavigationMenuPrimitive.Root ref={ref} className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)} {...props}>{children}<NavigationMenuViewport /></NavigationMenuPrimitive.Root>)
const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => <NavigationMenuPrimitive.List ref={ref} className={cn("group flex flex-1 list-none items-center justify-center space-x-1", className)} {...props} />)
const NavigationMenuItem = NavigationMenuPrimitive.Item
const navigationMenuTriggerStyle = cva("group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent")
const NavigationMenuTrigger = React.forwardRef(({ className, children, ...props }, ref) => <NavigationMenuPrimitive.Trigger ref={ref} className={cn(navigationMenuTriggerStyle(), "group", className)} {...props}>{children}<ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180" aria-hidden="true" /></NavigationMenuPrimitive.Trigger>)
const NavigationMenuContent = React.forwardRef(({ className, ...props }, ref) => <NavigationMenuPrimitive.Content ref={ref} className={cn("left-0 top-0 w-full md:absolute md:w-auto", className)} {...props} />)
const NavigationMenuLink = NavigationMenuPrimitive.Link
const NavigationMenuViewport = React.forwardRef(({ className, ...props }, ref) => <div className={cn("absolute left-0 top-full flex justify-center")}><NavigationMenuPrimitive.Viewport className={cn("origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow md:w-[var(--radix-navigation-menu-viewport-width)]", className)} ref={ref} {...props} /></div>)
const NavigationMenuIndicator = React.forwardRef(({ className, ...props }, ref) => <NavigationMenuPrimitive.Indicator ref={ref} className={cn("top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden", className)} {...props}><div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" /></NavigationMenuPrimitive.Indicator>)
export { navigationMenuTriggerStyle, NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport }
