

import logoE2D from "@/assets/logo-e2d.png";

interface LogoHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  className?: string;
}

export default function LogoHeader({ 
  title, 
  subtitle, 
  showLogo = true, 
  className = "" 
}: LogoHeaderProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {showLogo && (
        <div className="flex-shrink-0">
          <img 
            src={logoE2D} 
            alt="Logo E2D Association" 
            className="h-12 w-auto object-contain"
          />
          <div 
            className="h-12 w-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ display: 'none' }}
          >
            E2D
          </div>
        </div>
      )}
      {(title || subtitle) && (
        <div>
          {title && (
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
