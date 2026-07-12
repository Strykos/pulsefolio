"use client";

interface AmbientMeshProps {
  className?: string;
}

export function AmbientMesh({ className }: AmbientMeshProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-gain/12 blur-3xl animate-pulsebeat" />
      <div className="absolute -right-16 top-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-pulsebeat" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-accent/8 blur-3xl" />
    </div>
  );
}
