import Layout from "@/components/Layout";
import Membres from "./Membres";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function MembresWrapped() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  return (
    <Layout user={user}>
      <Membres />
    </Layout>
  );
}