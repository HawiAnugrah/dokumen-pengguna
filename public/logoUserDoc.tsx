// features/wizard/components/LogoUserdoc.tsx
export default function LogoUserdoc() {
  return (
    <div className="bg-white p-2.5 rounded-xl shadow-md inline-flex items-center justify-center">
      <svg 
        width="25" 
        height="25" 
        viewBox="0 0 52 52" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-blue-500"
      >
        {/* Huruf U di Kiri (Garis dibuat lebih tebal) */}
        <path 
          d="M10 14V26C10 33.732 16.268 40 24 40V12" 
          stroke="currentColor" 
          strokeWidth="6" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Huruf D di Kanan (Garis dibuat lebih tebal) */}
        <path 
          d="M24 14C33.3888 14 41 21.6112 41 31C41 34.5 39.9 37.8 38 40" 
          stroke="currentColor" 
          strokeWidth="6" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Titik bulat di ujung bawah lengkungan huruf D (ukuran disesuaikan biar pas) */}
        <circle cx="23" cy="40" r="3.5" fill="currentColor" />
      </svg>
    </div>
  );
}