import { aryStyles } from "@/app/_components/ary-shared";
import { consoleStyles } from "@/app/_components/console/console-shell";
import type { ReactNode } from "react";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <style>{aryStyles}</style>
      <style>{consoleStyles}</style>
    </>
  );
}
