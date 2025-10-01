import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold">Page introuvable</CardTitle>
          <CardDescription className="text-lg">
            Erreur 404 - La page que vous recherchez n'existe pas ou a été déplacée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-4">
              Il se peut que l'URL soit incorrecte ou que la page ait été supprimée.
            </p>
            <p>
              Voici quelques suggestions pour continuer votre navigation :
            </p>
          </div>

          <div className="grid gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retourner à la page précédente
            </Button>

            <Link to="/" className="w-full">
              <Button className="w-full justify-start" size="lg">
                <Home className="mr-2 h-5 w-5" />
                Retourner à l'accueil
              </Button>
            </Link>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm text-center text-muted-foreground">
              Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur système.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

