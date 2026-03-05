import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../config/api";
import styles from "./AddBookPage.module.css";

const MAX_IMAGE_FILE_BYTES = 12 * 1024 * 1024;

function UpdateBookPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    categoryId: "",
    publisher: "",
    language: "",
    price: "",
    description: "",
    coverImageUrl: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [book, categoryData] = await Promise.all([api.books.getById(id), api.categories.list()]);
        if (!isMounted) {
          return;
        }

        setCategories(categoryData);
        setForm({
          title: book.title || "",
          author: book.author || "",
          isbn: book.isbn || "",
          categoryId: String(book.category_id || ""),
          publisher: book.publisher || "",
          language: book.language || "",
          price: String(book.price ?? ""),
          description: book.description || "",
          coverImageUrl: book.cover_image_url || "",
        });
      } catch (error) {
        if (isMounted) {
          alert(error.message || "Failed to load book data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGE_FILE_BYTES) {
      alert("Please select an image smaller than 12 MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((previous) => ({
        ...previous,
        coverImageUrl: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title || !form.author || !form.publisher || !form.language || !form.price || !form.categoryId) {
      alert("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      await api.books.update(id, {
        title: form.title,
        author: form.author,
        isbn: form.isbn || null,
        categoryId: Number(form.categoryId),
        publisher: form.publisher,
        language: form.language,
        price: Number(form.price),
        description: form.description,
        coverImageUrl: form.coverImageUrl || null,
      });

      alert("Book updated successfully");
      navigate("/admin/books");
    } catch (error) {
      alert(error.message || "Failed to update book");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>Update Book</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
          <input name="author" value={form.author} onChange={handleChange} placeholder="Author" required />
          <input name="isbn" value={form.isbn} onChange={handleChange} placeholder="ISBN" />

          <select name="categoryId" value={form.categoryId} onChange={handleChange} required>
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input name="publisher" value={form.publisher} onChange={handleChange} placeholder="Publisher" required />
          <input name="language" value={form.language} onChange={handleChange} placeholder="Language" required />
          <input
            type="number"
            step="0.01"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            required
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
          />

          <div className={styles.preview}>
            <label className={styles.uploadLabel}>
              Choose New Book Image
              <input type="file" accept="image/*" onChange={handleImageUpload} className={styles.fileInput} />
            </label>

            {form.coverImageUrl ? <img src={form.coverImageUrl} alt="Preview" /> : null}
          </div>

          <button type="submit" disabled={saving} className={styles.submitButton}>
            {saving ? "Saving..." : "Update Book"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdateBookPage;
