import {
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import { useContext } from "react";
import AppContext from "./context/AppContext";

import Navbar from "./components/navbar";
import Home from "./pages/home";
import SearchResults from "./pages/searchresult";
import BookDetails from "./pages/bookdetails";
import About from "./pages/about";
import NotFound from "./pages/notfound";
import AdminPage from "./pages/adminpage";
import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/Profile";
import AddBookPage from "./pages/AddBookPage";
import UpdateBookPage from "./pages/UpdateBookPage";
import AdminBooks from "./pages/AdminBooks";
import Landing from "./pages/landing";
import AdminLanding from "./pages/AdminLanding";

function AppRoutes() {
  const { user } = useContext(AppContext);
  const location = useLocation();

  return (
    <>
      <Navbar />

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/about" element={<About />} />

        {/* AUTH */}
        <Route path="/admin" element={<AdminLanding />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/register" element={<Register />} />
        <Route path="/admin/book/:id" element={<BookDetails />} />

        {/* ADMIN DASHBOARD */}
        <Route
  path="/admin/dashboard"
  element={
    user?.isAdmin ? (
      <AdminPage />
    ) : (
      <Navigate to="/admin/login" replace />
    )
  }
/>

        <Route
          path="/admin/books"
          element={
            user?.isAdmin ? (
              <AdminBooks />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        <Route
          path="/admin/add-book"
          element={
            user?.isAdmin ? (
              <AddBookPage />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

          
        <Route
          path="/admin/update-book/:id"
          element={
            user?.isAdmin ? (
              <UpdateBookPage />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
          
        />
        <Route
  path="/admin/book/:id"
  element={
    user?.isAdmin ? (
      <BookDetails />
    ) : (
      <Navigate to="/admin/login" replace />
    )
  }
/>

        <Route
  path="/admin/profile"
  element={
    user?.isAdmin ? (
      <Profile />
    ) : (
      <Navigate to="/admin/login" replace />
    )
  }
/>


        {/* USER BOOK DETAILS */}
        <Route
          path="/book/:id"
          element={
            user ? (
              <BookDetails />
            ) : (
              <Navigate to="/login" state={{ from: location }} replace />
            )
          }
        />

        {/* REMOVE USER PROFILE ROUTE (Optional if not needed) */}
        <Route
          path="/profile"
          element={
            user ? <Profile /> : <Navigate to="/login" replace />
          }
        />

        {/* NOT FOUND */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppRoutes />;
}