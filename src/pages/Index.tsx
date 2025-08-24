import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";

interface IndexProps {
  user: any;
}

const Index = ({ user }: IndexProps) => {
  return (
    <Layout user={user}>
      <Dashboard />
    </Layout>
  );
};

export default Index;
