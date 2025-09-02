import Layout from "@/components/Layout";
import DynamicDashboard from "@/components/DynamicDashboard";

interface IndexProps {
  user: any;
}

const Index = ({ user }: IndexProps) => {
  return (
    <Layout user={user}>
      <DynamicDashboard />
    </Layout>
  );
};

export default Index;
