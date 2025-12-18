import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Profile from "./pages/profile/Profile";
import ProfileNew from "./pages/profile/ProfileNew";
import Register from "./pages/register/Register";
import Friends from "./pages/friends/Friends";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { Messenger } from "./pages/messenger/Messenger";
import Marketplace from "./pages/marketplace/Marketplace";
import TradeCentre from "./pages/tradecentre/TradeCentre";
import Admin from "./pages/admin/Admin";
import Conversations from "./pages/marketplace/Conversations";
import Search from "./pages/search/Search";
import Notifications from "./pages/notifications/Notifications";
import Layout from "./components/layout/Layout";

function App() {
  const { user } = useContext(AuthContext);
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          {user ? <Home /> : <Register />}
        </Route>
        <Route path="/login">{user ? <Redirect to="/" /> : <Login />}</Route>
        <Route path="/register">
          {user ? <Redirect to="/" /> : <Register />}
        </Route>
        <Route path="/messenger">
          {!user ? <Redirect to="/login" /> : <Messenger />}
        </Route>
        <Route path="/marketplace">
          {!user ? <Redirect to="/login" /> : <Marketplace />}
        </Route>
        <Route path="/trade">
          {!user ? <Redirect to="/login" /> : <TradeCentre />}
        </Route>
        <Route path="/friends">
          {!user ? <Redirect to="/login" /> : <Friends />}
        </Route>
        <Route path="/admin">
          {!user ? <Redirect to="/login" /> : <Admin />}
        </Route>
        <Route path="/conversations">
          {!user ? <Redirect to="/login" /> : <Conversations />}
        </Route>
        <Route path="/profile/:username">
          {!user ? <Redirect to="/login" /> : <ProfileNew />}
        </Route>
        <Route path="/search">
          {!user ? <Redirect to="/login" /> : <Search />}
        </Route>
        <Route path="/notifications">
          {!user ? <Redirect to="/login" /> : <Notifications />}
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
