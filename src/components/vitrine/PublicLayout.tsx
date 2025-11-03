import { Helmet } from "react-helmet-async";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

interface PublicLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const PublicLayout = ({ 
  children, 
  title = "Association E2D Connect",
  description = "Ensemble pour Demain - Association dédiée à l'entraide et au développement communautaire"
}: PublicLayoutProps) => {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1">
          {children}
        </main>
        <PublicFooter />
      </div>
    </>
  );
};
