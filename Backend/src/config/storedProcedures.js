const createProcedureStatements = [
  `DROP PROCEDURE IF EXISTS sp_users_find_by_email_or_username`,
  `CREATE PROCEDURE sp_users_find_by_email_or_username(
    IN p_email VARCHAR(255),
    IN p_username VARCHAR(255)
  )
  SELECT id
  FROM users
  WHERE email = p_email OR username = p_username
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_users_create`,
  `CREATE PROCEDURE sp_users_create(
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_username VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_role VARCHAR(50),
    IN p_is_deleted TINYINT
  )
  BEGIN
    INSERT INTO users (
      first_name,
      last_name,
      email,
      username,
      password_hash,
      role,
      is_deleted
    )
    VALUES (
      p_first_name,
      p_last_name,
      p_email,
      p_username,
      p_password_hash,
      p_role,
      p_is_deleted
    );

    SELECT id, first_name, last_name, email, username, role
    FROM users
    WHERE id = LAST_INSERT_ID();
  END`,

  `DROP PROCEDURE IF EXISTS sp_users_login_lookup`,
  `CREATE PROCEDURE sp_users_login_lookup(
    IN p_email_or_username VARCHAR(255)
  )
  SELECT id, first_name, last_name, email, username, password_hash, role
  FROM users
  WHERE (email = p_email_or_username OR username = p_email_or_username)
    AND is_deleted = 0
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_users_get_by_id`,
  `CREATE PROCEDURE sp_users_get_by_id(
    IN p_user_id INT
  )
  SELECT id, first_name, last_name, email, username, role
  FROM users
  WHERE id = p_user_id
    AND is_deleted = 0
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_users_get_all`,
  `CREATE PROCEDURE sp_users_get_all()
  SELECT id, first_name, last_name, email, username, role, created_at
  FROM users
  WHERE is_deleted = 0
  ORDER BY id DESC`,

  `DROP PROCEDURE IF EXISTS sp_users_get_basic_by_id`,
  `CREATE PROCEDURE sp_users_get_basic_by_id(
    IN p_user_id INT
  )
  SELECT id, first_name, last_name, email, username, role, is_deleted, created_at
  FROM users
  WHERE id = p_user_id
    AND is_deleted = 0
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_users_find_duplicate_except_id`,
  `CREATE PROCEDURE sp_users_find_duplicate_except_id(
    IN p_email VARCHAR(255),
    IN p_username VARCHAR(255),
    IN p_excluded_user_id INT
  )
  SELECT id
  FROM users
  WHERE is_deleted = 0
    AND (email = p_email OR username = p_username)
    AND id <> p_excluded_user_id
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_users_count_active_admins_excluding`,
  `CREATE PROCEDURE sp_users_count_active_admins_excluding(
    IN p_excluded_user_id INT
  )
  SELECT COUNT(*) AS total
  FROM users
  WHERE role = 'ADMIN'
    AND is_deleted = 0
    AND id <> p_excluded_user_id`,

  `DROP PROCEDURE IF EXISTS sp_users_update_with_password`,
  `CREATE PROCEDURE sp_users_update_with_password(
    IN p_user_id INT,
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_username VARCHAR(255),
    IN p_role VARCHAR(50),
    IN p_password_hash VARCHAR(255)
  )
  BEGIN
    UPDATE users
    SET
      first_name = p_first_name,
      last_name = p_last_name,
      email = p_email,
      username = p_username,
      role = p_role,
      password_hash = p_password_hash
    WHERE id = p_user_id
      AND is_deleted = 0;

    SELECT id, first_name, last_name, email, username, role, created_at
    FROM users
    WHERE id = p_user_id
      AND is_deleted = 0
    LIMIT 1;
  END`,

  `DROP PROCEDURE IF EXISTS sp_users_update_without_password`,
  `CREATE PROCEDURE sp_users_update_without_password(
    IN p_user_id INT,
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_username VARCHAR(255),
    IN p_role VARCHAR(50)
  )
  BEGIN
    UPDATE users
    SET
      first_name = p_first_name,
      last_name = p_last_name,
      email = p_email,
      username = p_username,
      role = p_role
    WHERE id = p_user_id
      AND is_deleted = 0;

    SELECT id, first_name, last_name, email, username, role, created_at
    FROM users
    WHERE id = p_user_id
      AND is_deleted = 0
    LIMIT 1;
  END`,

  `DROP PROCEDURE IF EXISTS sp_users_soft_delete`,
  `CREATE PROCEDURE sp_users_soft_delete(
    IN p_user_id INT
  )
  UPDATE users
  SET is_deleted = 1
  WHERE id = p_user_id
    AND is_deleted = 0`,

  `DROP PROCEDURE IF EXISTS sp_categories_get_all`,
  `CREATE PROCEDURE sp_categories_get_all()
  SELECT id, name
  FROM book_categories
  ORDER BY name ASC`,

  `DROP PROCEDURE IF EXISTS sp_categories_find_by_name`,
  `CREATE PROCEDURE sp_categories_find_by_name(
    IN p_name VARCHAR(255)
  )
  SELECT id
  FROM book_categories
  WHERE name = p_name
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_categories_create`,
  `CREATE PROCEDURE sp_categories_create(
    IN p_name VARCHAR(255)
  )
  BEGIN
    INSERT INTO book_categories (name)
    VALUES (p_name);

    SELECT id, name
    FROM book_categories
    WHERE id = LAST_INSERT_ID();
  END`,

  `DROP PROCEDURE IF EXISTS sp_books_exists_active`,
  `CREATE PROCEDURE sp_books_exists_active(
    IN p_book_id INT
  )
  SELECT id
  FROM books
  WHERE id = p_book_id
    AND is_deleted = 0
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_books_find_duplicate`,
  `CREATE PROCEDURE sp_books_find_duplicate(
    IN p_title VARCHAR(255),
    IN p_author VARCHAR(255),
    IN p_publisher VARCHAR(255),
    IN p_isbn VARCHAR(50),
    IN p_language VARCHAR(100),
    IN p_category_id INT
  )
  SELECT id
  FROM books
  WHERE title = p_title
    AND author = p_author
    AND publisher = p_publisher
    AND isbn <=> p_isbn
    AND language = p_language
    AND category_id = p_category_id
    AND is_deleted = 0
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_books_create`,
  `CREATE PROCEDURE sp_books_create(
    IN p_title VARCHAR(255),
    IN p_author VARCHAR(255),
    IN p_publisher VARCHAR(255),
    IN p_isbn VARCHAR(50),
    IN p_language VARCHAR(100),
    IN p_price DECIMAL(10,2),
    IN p_description TEXT,
    IN p_category_id INT,
    IN p_cover_image_url TEXT,
    IN p_is_deleted TINYINT
  )
  BEGIN
    INSERT INTO books (
      title,
      author,
      publisher,
      isbn,
      language,
      price,
      description,
      category_id,
      cover_image_url,
      is_deleted
    )
    VALUES (
      p_title,
      p_author,
      p_publisher,
      p_isbn,
      p_language,
      p_price,
      p_description,
      p_category_id,
      p_cover_image_url,
      p_is_deleted
    );

    SELECT
      b.id,
      b.title,
      b.author,
      b.publisher,
      b.isbn,
      b.language,
      b.price,
      b.description,
      b.category_id,
      b.cover_image_url,
      cat.name AS category_name,
      COUNT(CASE WHEN cop.status = 'AVAILABLE' AND cop.is_deleted = 0 THEN 1 END) AS available_copies,
      COUNT(CASE WHEN cop.is_deleted = 0 THEN 1 END) AS total_copies
    FROM books b
    LEFT JOIN book_categories cat ON b.category_id = cat.id
    LEFT JOIN book_copies cop ON b.id = cop.book_id
    WHERE b.id = LAST_INSERT_ID()
    GROUP BY b.id;
  END`,

  `DROP PROCEDURE IF EXISTS sp_books_get_all`,
  `CREATE PROCEDURE sp_books_get_all(
    IN p_title VARCHAR(255),
    IN p_author VARCHAR(255),
    IN p_category_id INT
  )
  SELECT
    b.id,
    b.title,
    b.author,
    b.publisher,
    b.isbn,
    b.language,
    b.price,
    b.description,
    b.category_id,
    b.cover_image_url,
    cat.name AS category_name,
    COUNT(CASE WHEN cop.status = 'AVAILABLE' AND cop.is_deleted = 0 THEN 1 END) AS available_copies,
    COUNT(CASE WHEN cop.is_deleted = 0 THEN 1 END) AS total_copies
  FROM books b
  LEFT JOIN book_categories cat ON b.category_id = cat.id
  LEFT JOIN book_copies cop ON b.id = cop.book_id
  WHERE b.is_deleted = 0
    AND (p_title IS NULL OR b.title LIKE CONCAT('%', p_title, '%'))
    AND (p_author IS NULL OR b.author LIKE CONCAT('%', p_author, '%'))
    AND (p_category_id IS NULL OR b.category_id = p_category_id)
  GROUP BY b.id
  ORDER BY b.id DESC`,

  `DROP PROCEDURE IF EXISTS sp_books_get_by_id`,
  `CREATE PROCEDURE sp_books_get_by_id(
    IN p_book_id INT
  )
  SELECT
    b.id,
    b.title,
    b.author,
    b.publisher,
    b.isbn,
    b.language,
    b.price,
    b.description,
    b.category_id,
    b.cover_image_url,
    cat.name AS category_name,
    COUNT(CASE WHEN cop.status = 'AVAILABLE' AND cop.is_deleted = 0 THEN 1 END) AS available_copies,
    COUNT(CASE WHEN cop.is_deleted = 0 THEN 1 END) AS total_copies
  FROM books b
  LEFT JOIN book_categories cat ON b.category_id = cat.id
  LEFT JOIN book_copies cop ON b.id = cop.book_id
  WHERE b.id = p_book_id
    AND b.is_deleted = 0
  GROUP BY b.id`,

  `DROP PROCEDURE IF EXISTS sp_books_get_basic_by_id`,
  `CREATE PROCEDURE sp_books_get_basic_by_id(
    IN p_book_id INT
  )
  SELECT *
  FROM books
  WHERE id = p_book_id
    AND is_deleted = 0
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_books_update`,
  `CREATE PROCEDURE sp_books_update(
    IN p_book_id INT,
    IN p_title VARCHAR(255),
    IN p_author VARCHAR(255),
    IN p_publisher VARCHAR(255),
    IN p_isbn VARCHAR(50),
    IN p_language VARCHAR(100),
    IN p_price DECIMAL(10,2),
    IN p_description TEXT,
    IN p_category_id INT,
    IN p_cover_image_url TEXT
  )
  BEGIN
    UPDATE books
    SET
      title = p_title,
      author = p_author,
      publisher = p_publisher,
      isbn = p_isbn,
      language = p_language,
      price = p_price,
      description = p_description,
      category_id = p_category_id,
      cover_image_url = p_cover_image_url
    WHERE id = p_book_id;

    SELECT
      b.id,
      b.title,
      b.author,
      b.publisher,
      b.isbn,
      b.language,
      b.price,
      b.description,
      b.category_id,
      b.cover_image_url,
      cat.name AS category_name,
      COUNT(CASE WHEN cop.status = 'AVAILABLE' AND cop.is_deleted = 0 THEN 1 END) AS available_copies,
      COUNT(CASE WHEN cop.is_deleted = 0 THEN 1 END) AS total_copies
    FROM books b
    LEFT JOIN book_categories cat ON b.category_id = cat.id
    LEFT JOIN book_copies cop ON b.id = cop.book_id
    WHERE b.id = p_book_id
      AND b.is_deleted = 0
    GROUP BY b.id;
  END`,

  `DROP PROCEDURE IF EXISTS sp_books_soft_delete`,
  `CREATE PROCEDURE sp_books_soft_delete(
    IN p_book_id INT
  )
  BEGIN
    UPDATE books
    SET is_deleted = 1
    WHERE id = p_book_id;

    UPDATE book_copies
    SET is_deleted = 1
    WHERE book_id = p_book_id;
  END`,

  `DROP PROCEDURE IF EXISTS sp_books_hard_delete`,
  `CREATE PROCEDURE sp_books_hard_delete(
    IN p_book_id INT
  )
  BEGIN
    DELETE FROM book_copies
    WHERE book_id = p_book_id;

    DELETE FROM books
    WHERE id = p_book_id;
  END`,

  `DROP PROCEDURE IF EXISTS sp_copies_find_by_code`,
  `CREATE PROCEDURE sp_copies_find_by_code(
    IN p_copy_code VARCHAR(255)
  )
  SELECT id
  FROM book_copies
  WHERE copy_code = p_copy_code
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_copies_create`,
  `CREATE PROCEDURE sp_copies_create(
    IN p_book_id INT,
    IN p_copy_code VARCHAR(255),
    IN p_status VARCHAR(20),
    IN p_is_deleted TINYINT
  )
  BEGIN
    INSERT INTO book_copies (book_id, copy_code, status, is_deleted)
    VALUES (p_book_id, p_copy_code, p_status, p_is_deleted);

    SELECT id, book_id, copy_code, status
    FROM book_copies
    WHERE id = LAST_INSERT_ID();
  END`,

  `DROP PROCEDURE IF EXISTS sp_copies_get_by_book`,
  `CREATE PROCEDURE sp_copies_get_by_book(
    IN p_book_id INT
  )
  SELECT id, book_id, copy_code, status
  FROM book_copies
  WHERE book_id = p_book_id
    AND is_deleted = 0
  ORDER BY id ASC`,

  `DROP PROCEDURE IF EXISTS sp_copies_get_by_id`,
  `CREATE PROCEDURE sp_copies_get_by_id(
    IN p_copy_id INT
  )
  SELECT *
  FROM book_copies
  WHERE id = p_copy_id
    AND is_deleted = 0
  LIMIT 1`,

  `DROP PROCEDURE IF EXISTS sp_copies_update_status`,
  `CREATE PROCEDURE sp_copies_update_status(
    IN p_copy_id INT,
    IN p_status VARCHAR(20)
  )
  BEGIN
    UPDATE book_copies
    SET status = p_status
    WHERE id = p_copy_id;

    SELECT id, book_id, copy_code, status
    FROM book_copies
    WHERE id = p_copy_id
      AND is_deleted = 0
    LIMIT 1;
  END`,

  `DROP PROCEDURE IF EXISTS sp_copies_update_code`,
  `CREATE PROCEDURE sp_copies_update_code(
    IN p_copy_id INT,
    IN p_copy_code VARCHAR(255)
  )
  BEGIN
    UPDATE book_copies
    SET copy_code = p_copy_code
    WHERE id = p_copy_id
      AND is_deleted = 0;

    SELECT id, book_id, copy_code, status
    FROM book_copies
    WHERE id = p_copy_id
      AND is_deleted = 0
    LIMIT 1;
  END`,

  `DROP PROCEDURE IF EXISTS sp_copies_soft_delete`,
  `CREATE PROCEDURE sp_copies_soft_delete(
    IN p_copy_id INT
  )
  UPDATE book_copies
  SET is_deleted = 1
  WHERE id = p_copy_id`,

  `DROP PROCEDURE IF EXISTS sp_copies_search_with_book`,
  `CREATE PROCEDURE sp_copies_search_with_book(
    IN p_copy_code VARCHAR(255)
  )
  SELECT
    bc.id,
    bc.copy_code,
    bc.status,
    b.id AS book_id,
    b.title,
    b.author,
    b.publisher,
    b.language
  FROM book_copies bc
  JOIN books b ON bc.book_id = b.id
  WHERE bc.copy_code = p_copy_code
    AND bc.is_deleted = 0
    AND b.is_deleted = 0
  LIMIT 1`,
];

const initializeStoredProcedures = async (connection) => {
  for (const statement of createProcedureStatements) {
    await connection.query(statement);
  }
};

module.exports = { initializeStoredProcedures };
