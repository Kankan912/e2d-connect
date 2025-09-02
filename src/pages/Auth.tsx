import { Helmet } from "react-helmet-async";
import AuthForm from "@/components/AuthForm";

export default function Auth() {
  return (
    <>
      <Helmet>
        <title>Connexion - E2D Association | Espace Membre</title>
        <meta name="description" content="Connectez-vous à votre espace membre E2D Association. Accédez à la gestion des cotisations, prêts, épargnes et activités sportives." />
        <meta name="keywords" content="E2D, association, connexion, login, membre, gestion" />
        <meta property="og:title" content="Connexion E2D Association" />
        <meta property="og:description" content="Espace membre sécurisé pour la gestion de votre association E2D" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/auth" />
      </Helmet>
      <AuthForm />
    </>
  );
}