import type { ReactNode } from "react";

export default function Page({ children }: { children: ReactNode }) {
  return (
    <main className="container page-main">
      {children}
    </main>
  );
}
