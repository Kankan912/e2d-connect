import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { User, DollarSign, CreditCard } from "lucide-react";

function DashboardHomePage() {
  const { user, userRole } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tableau de Bord</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mon Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
              {userRole && (
                <>
                  <p className="text-sm text-muted-foreground mt-4">Rôle</p>
                  <p className="font-medium capitalize">{userRole}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Mes Dons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0 €</p>
            <p className="text-sm text-muted-foreground">Total des dons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Mes Cotisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">À jour</p>
            <p className="text-sm text-muted-foreground">Statut</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfilePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Page en construction...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function MyDonationsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Mes Dons</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Aucun don enregistré pour le moment.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function MyCotisationsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Mes Cotisations</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Aucune cotisation pour le moment.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function DonationsAdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Gestion des Dons</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Interface d'administration des dons...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AdhesionsAdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Gestion des Adhésions</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Interface d'administration des adhésions...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SiteAdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">CMS Site Web</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Interface de gestion du contenu du site...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardHome() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardHomePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="my-donations" element={<MyDonationsPage />} />
        <Route path="my-cotisations" element={<MyCotisationsPage />} />
        
        {/* Admin Routes */}
        <Route
          path="admin/donations"
          element={
            <AdminRoute>
              <DonationsAdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/adhesions"
          element={
            <AdminRoute>
              <AdhesionsAdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/site/*"
          element={
            <AdminRoute>
              <SiteAdminPage />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
