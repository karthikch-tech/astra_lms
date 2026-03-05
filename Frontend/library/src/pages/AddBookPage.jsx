import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./AddBookPage.module.css";

function AddBookPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    publisher: "",
    language: "",
    price: "",
    copies: "",
    description: "",
    image: "",
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("books")) || [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBooks(saved);

    if (id) {
      const bookToEdit = saved.find((b) => String(b.id) === id);
      if (bookToEdit) {
        setForm(bookToEdit);
      }
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (id) {
      const updatedBooks = books.map((b) =>
        String(b.id) === id ? { ...form, id: b.id } : b
      );
      localStorage.setItem("books", JSON.stringify(updatedBooks));
      alert("Book Updated Successfully");
    } else {
      const newBook = {
        ...form,
        id: Date.now(),
      };
      const updatedBooks = [...books, newBook];
      localStorage.setItem("books", JSON.stringify(updatedBooks));
      alert("Book Added Successfully");
    }

    navigate("/admin/books");
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>{id ? "Update Book" : "Add New Book"}</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <input
            name="author"
            placeholder="Author"
            value={form.author}
            onChange={handleChange}
            required
          />

          <input
            name="isbn"
            placeholder="ISBN"
            value={form.isbn}
            onChange={handleChange}
          />

          <input
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
          />

          <input
            name="publisher"
            placeholder="Publisher"
            value={form.publisher}
            onChange={handleChange}
          />

          <input
            name="language"
            placeholder="Language"
            value={form.language}
            onChange={handleChange}
          />

          <input
            type="number"
            name="price"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
          />

          <input
            type="number"
            name="copies"
            placeholder="Copies"
            value={form.copies}
            onChange={handleChange}
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

         <div className={styles.preview}>
  <label className={styles.uploadLabel}>
    📁 Choose Book Image
    <input
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      className={styles.fileInput}
    />
  </label>

  {form.image && (
    <img src={form.image} alt="Preview" />
  )}
</div>

          <button type="submit">
            {id ? "Update Book" : "Add Book"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddBookPage;