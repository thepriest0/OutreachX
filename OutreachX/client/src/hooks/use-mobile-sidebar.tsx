import { useState } from "react";

let globalSetMobileOpen: ((open: boolean) => void) | null = null;

export function useMobileSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Register the setter globally so it can be called from anywhere
  globalSetMobileOpen = setMobileOpen;
  
  return {
    mobileOpen,
    setMobileOpen,
    openMobileMenu: () => setMobileOpen(true),
    closeMobileMenu: () => setMobileOpen(false),
  };
}

export function openMobileSidebar() {
  if (globalSetMobileOpen) {
    globalSetMobileOpen(true);
  }
}
