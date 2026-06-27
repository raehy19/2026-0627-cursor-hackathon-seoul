/** Minimal chrome for pixel-perfect logo export. */
export default function LogoCaptureLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-0 flex-1 items-start justify-center overflow-hidden bg-[#0b0b12]">
      {children}
    </div>
  );
}
