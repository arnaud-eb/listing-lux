"use client";

import { lazy, Suspense } from "react";
import { Sparkles, type LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

// Cache lazy components to avoid unmount/remount on every re-render
const iconCache = new Map<
  string,
  React.LazyExoticComponent<React.ComponentType<LucideProps>>
>();

function getLazyIcon(name: string) {
  if (!iconCache.has(name)) {
    iconCache.set(
      name,
      lazy(dynamicIconImports[name as keyof typeof dynamicIconImports]),
    );
  }
  return iconCache.get(name)!;
}

interface DynamicIconProps extends LucideProps {
  name: string;
}

export default function DynamicIcon({ name, ...props }: DynamicIconProps) {
  if (!(name in dynamicIconImports)) {
    return <Sparkles {...props} />;
  }

  const Icon = getLazyIcon(name);
  return (
    <Suspense fallback={<Sparkles {...props} />}>
      <Icon {...props} />
    </Suspense>
  );
}
