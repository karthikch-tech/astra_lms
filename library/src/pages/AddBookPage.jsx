import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../config/api";
import styles from "./AddBookPage.module.css";

const MAX_IMAGE_FILE_BYTES = 12 * 1024 * 1024;
const COPY_BATCH_SIZE = 100;

const toBatches = (items, batchSize) => {
  const batches = [];
  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }
  return batches;
};

function AddBookPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    categoryId: "",
    publisher: "",
    language: "",
    price: "",
    copiesCount: "",
    description: "",
    coverImageUrl: "",
  });

  const sortCategoriesByName = (categoryList) =>
    [...categoryList].sort((first, second) => first.name.localeCompare(second.name));

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const data = await api.categories.list();
        if (isMounted) {
          setCategories(sortCategoriesByName(data));
        }
      } catch (error) {
        if (isMounted) {
          alert(error.message || "Failed to load categories");
        }
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
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

    setLoading(true);
    try {
      const created = await api.books.create({
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

      const copiesCount = Number(form.copiesCount || 0);
      if (copiesCount > 0) {
        const copyIds = Array.from({ length: copiesCount }).map(
          (_, index) => `BOOK-${created.book.id}-COPY-${Date.now()}-${index + 1}`
        );
        const copyBatches = toBatches(copyIds, COPY_BATCH_SIZE);

        for (const copyBatch of copyBatches) {
          await api.copies.addToBook(created.book.id, copyBatch);
        }
      }

      alert("Book added successfully");
      navigate("/admin/books");
    } catch (error) {
      alert(error.message || "Failed to add book");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const categoryName = newCategoryName.trim();

    if (!categoryName) {
      alert("Please enter a category name");
      return;
    }

    setAddingCategory(true);

    try {
      const createdCategory = await api.categories.create({ name: categoryName });

      setCategories((previous) => {
        const withoutDuplicate = previous.filter((category) => category.id !== createdCategory.id);
        return sortCategoriesByName([...withoutDuplicate, createdCategory]);
      });

      setForm((previous) => ({ ...previous, categoryId: String(createdCategory.id) }));
      setNewCategoryName("");
    } catch (error) {
      alert(error.message || "Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>Add New Book</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
          <input name="author" placeholder="Author" value={form.author} onChange={handleChange} required />
          <input name="isbn" placeholder="ISBN" value={form.isbn} onChange={handleChange} />

          <div className={styles.categoryField}>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              required
              className={styles.categorySelect}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <div className={styles.addCategoryRow}>
              <input
                type="text"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Add new category"
              />
              <button
                type="button"
                className={styles.addCategoryButton}
                onClick={handleAddCategory}
                disabled={addingCategory}
              >
                {addingCategory ? "Adding..." : "Add"}
              </button>
            </div>
          </div>

          <input name="publisher" placeholder="Publisher" value={form.publisher} onChange={handleChange} required />
          <input name="language" placeholder="Language" value={form.language} onChange={handleChange} required />

          <input
            type="number"
            step="0.01"
            name="price"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            min="0"
            name="copiesCount"
            placeholder="Initial Copies"
            value={form.copiesCount}
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
              Choose Book Image
              <input type="file" accept="image/*" onChange={handleImageUpload} className={styles.fileInput} />
            </label>

            {form.coverImageUrl ? <img src={form.coverImageUrl} alt="Preview" /> : null}
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? "Saving..." : "Add Book"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddBookPage;
