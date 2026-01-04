import Layout from "../../components/layout/Layout";
import Feed from "../../components/feed/Feed";
import Rightbar from "../../components/rightbar/Rightbar";

export default function Home() {
  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-50px)] bg-[#f0f2f5]">
        <Feed />
        <Rightbar />
      </div>
    </Layout>
  );
}
