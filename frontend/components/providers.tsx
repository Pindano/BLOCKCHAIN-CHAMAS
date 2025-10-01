"use client";

import { CDPReactProvider } from "@coinbase/cdp-react/components/CDPReactProvider";
import { theme } from "@/components/theme";

interface ProvidersProps {
  children: React.ReactNode;
}

const CDP_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "",
};

const APP_CONFIG = {
  name: "Chama Dao",
  logoUrl: "http://localhost:3000/logo.svg",
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <CDPReactProvider config={CDP_CONFIG} app={APP_CONFIG} theme={theme}>
      {children}
    </CDPReactProvider>
  );
}
