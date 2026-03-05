import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import AppContext from "./context/AppContext";

import Navbar from "./components/navbar";
import Home from "./pages/home";
import SearchResults from "./pages/searchresult";
import BookDetails from "./pages/bookdetails";
import About from "./pages/about";
import NotFound from "./pages/notfound";
import AdminPage from "./pages/AdminPage";
import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/Profile";
import AddBookPage from "./pages/AddBookPage";
import UpdateBookPage from "./pages/UpdateBookPage";
import AdminBooks from "./pages/AdminBooks";
import AdminUsers from "./pages/AdminUsers";
import Landing from "./pages/landing";
import AdminLanding from "./pages/AdminLanding";

function AppRoutes() {
  const { user, isAdmin } = useContext(AppContext);
  const location = useLocation();

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/about" element={<About />} />
        <Route path="/book/:id" element={<BookDetails />} />

        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<AdminLanding />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/register" element={<Register />} />

        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" replace state={{ from: location }} />}
        />
        <Route
          path="/admin/profile"
          element={
            isAdmin ? <Profile /> : <Navigate to="/admin/login" replace state={{ from: location }} />
          }
        />

        <Route
          path="/admin/dashboard"
          element={isAdmin ? <AdminPage /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/admin/books"
          element={isAdmin ? <AdminBooks /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/admin/users"
          element={isAdmin ? <AdminUsers /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/admin/add-book"
          element={isAdmin ? <AddBookPage /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/admin/update-book/:id"
          element={isAdmin ? <UpdateBookPage /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/admin/book/:id"
          element={isAdmin ? <BookDetails /> : <Navigate to="/admin/login" replace />}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppRoutes />;
}
