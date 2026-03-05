import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./AddBookPage.module.css";

function UpdateBookPage() {
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

    const book = saved.find((b) => String(b.id) === id);
    if (book) {
      setForm(book);
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Image Upload for Update
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

    const updatedBooks = books.map((b) =>
      String(b.id) === id ? { ...form, id: b.id } : b
    );

    localStorage.setItem("books", JSON.stringify(updatedBooks));

    alert("Book Updated Successfully");
    navigate("/admin/books");
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>Update Book</h1>

        <form onSubmit={handleSubmit} className={styles.form}>

          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
          />

          <input
            name="author"
            value={form.author}
            onChange={handleChange}
            placeholder="Author"
          />

          <input
            name="isbn"
            value={form.isbn}
            onChange={handleChange}
            placeholder="ISBN"
          />

          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Category"
          />

          <input
            name="publisher"
            value={form.publisher}
            onChange={handleChange}
            placeholder="Publisher"
          />

          <input
            name="language"
            value={form.language}
            onChange={handleChange}
            placeholder="Language"
          />

          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
          />

          <input
            type="number"
            name="copies"
            value={form.copies}
            onChange={handleChange}
            placeholder="Copies"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
          />

          {/* ✅ IMAGE UPDATE SECTION */}
          <div className={styles.preview}>
            <label className={styles.uploadLabel}>
              📁 Choose New Book Image
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
            Update Book
          </button>

        </form>
      </div>
    </div>
  );
}

export default UpdateBookPage;