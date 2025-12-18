import Layout from "../../components/layout/Layout";
import Feed from "../../components/feed/Feed";
import Rightbar from "../../components/rightbar/Rightbar";
import "./home.css"

export default function Home() {
  return (
    <Layout>
      <div className="homeContainer">
        <Feed/>
        <Rightbar/>
      </div>
    </Layout>
  );
}
