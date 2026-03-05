use astra_lms;
DELIMITER $$

DROP PROCEDURE IF EXISTS update_book_details $$

CREATE PROCEDURE update_book_details( 
    IN p_logged_user_id INT,
    IN p_book_id INT,
    IN p_title VARCHAR(255),
    IN p_author VARCHAR(150),
    IN p_publisher VARCHAR(150),
    IN p_isbn VARCHAR(20),
    IN p_language VARCHAR(50),
    IN p_price DECIMAL(10,2),
    IN p_description TEXT,
	IN p_category_name VARCHAR(100),
    IN p_cover_image VARCHAR(255)
)
proc_block: BEGIN

    DECLARE v_error_msg TEXT DEFAULT '';
	DECLARE v_category_id INT;
	DECLARE v_author_id INT;
	DECLARE v_existing_author_id INT;
	
DECLARE v_role_name VARCHAR(50);

SELECT r.role_name INTO v_role_name
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.user_id = p_logged_user_id
  AND u.is_active = TRUE
LIMIT 1;

-- User not found or inactive
IF v_role_name IS NULL THEN
    SELECT 'Unauthorized access. Invalid or inactive user.' AS message;
    LEAVE proc_block;
END IF;

-- Admin check
IF v_role_name <> 'admin' THEN
    SELECT 'Access denied. Only admin can perform this action.' AS message;
    LEAVE proc_block;
END IF;

	
	-- Trim inputs
SET p_title = TRIM(p_title);
SET p_author = TRIM(p_author);
SET p_publisher = TRIM(p_publisher);
SET p_isbn = TRIM(p_isbn);
SET p_language = TRIM(p_language);

 
    
 


-- Title validation (professional)
IF p_title IS NOT NULL AND TRIM(p_title) <> '' THEN

    IF p_title NOT REGEXP '^[A-Za-z0-9][A-Za-z0-9 .,&''()/:+-]*$' THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Title contains invalid characters. ');
    END IF;

    IF p_title NOT REGEXP '[A-Za-z]' THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Title must contain at least one alphabet character. ');
    END IF;

    IF LENGTH(p_title) > 255 THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Title cannot exceed 255 characters. ');
    END IF;

END IF;


-- Publisher validation (professional)
IF p_publisher IS NOT NULL AND TRIM(p_publisher) <> '' THEN

    IF p_publisher NOT REGEXP '^[A-Za-z0-9][A-Za-z0-9 .,&''()/-]*$' THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Publisher contains invalid characters. ');
    END IF;

    IF LENGTH(p_publisher) > 150 THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Publisher name too long. ');
    END IF;

END IF;


-- Language validation
IF p_language IS NOT NULL AND TRIM(p_language) <> '' THEN

    IF p_language NOT REGEXP '^[A-Za-z][A-Za-z ]*$' THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Language contains invalid characters. ');
    END IF;

END IF;

-- Price validation
-- Price validation
IF p_price IS NOT NULL THEN

    IF p_price < 0 THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Price cannot be negative. ');
    END IF;

    IF p_price > 5000 THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Price cannot exceed 5000. ');
    END IF;

END IF;

-- Description validation
IF p_description IS NOT NULL AND TRIM(p_description) <> '' THEN

    IF p_description NOT REGEXP '[A-Za-z]' THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Description must contain at least one alphabet character. ');
    END IF;

    IF LENGTH(p_description) > 2000 THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Description too long. ');
    END IF;

END IF;



-- ISBN validation
IF p_isbn IS NOT NULL AND p_isbn <> '' THEN

    SET p_isbn = REPLACE(p_isbn, '-', '');

    IF LENGTH(p_isbn) NOT IN (10,13)
       OR (LENGTH(p_isbn)=10 AND p_isbn NOT REGEXP '^[0-9]{9}[0-9Xx]$')
       OR (LENGTH(p_isbn)=13 AND p_isbn NOT REGEXP '^[0-9]{13}$') THEN

        SET v_error_msg = CONCAT(v_error_msg,
            'ISBN invalid :- ', p_isbn, '. ');
    END IF;

END IF;

    -- Validate book id
    IF p_book_id IS NULL THEN
        SET v_error_msg = 'Book ID is required. ';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM books WHERE book_id = p_book_id
    ) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Book not found. ');
    END IF;

-- AUTHOR IMMUTABLE UPDATE LOGIC


-- Get existing author of the book
SELECT author_id INTO v_existing_author_id
FROM books
WHERE book_id = p_book_id;

-- If author is NULL or empty → keep existing author
IF p_author IS NULL OR TRIM(p_author) = '' THEN

    SET v_author_id = v_existing_author_id;

ELSE

    -- Get author_id from authors table
    SELECT author_id INTO v_author_id
    FROM authors
    WHERE author_name = TRIM(p_author)
    LIMIT 1;

    -- Author does not exist
    IF v_author_id IS NULL THEN
        SET v_error_msg = CONCAT(
            v_error_msg,
            'Author does not exist. '
        );
    END IF;

    -- If author exists but different → reject
    IF v_author_id IS NOT NULL 
       AND v_author_id <> v_existing_author_id THEN

        SET v_error_msg = CONCAT(
            v_error_msg,
            'Author cannot be modified. Insert a new book instead. '
        );

    END IF;

END IF;

-- Prevent Publisher modification
IF p_publisher IS NOT NULL AND TRIM(p_publisher) <> '' THEN

    IF EXISTS (
        SELECT 1 FROM books
        WHERE book_id = p_book_id
        AND IFNULL(publisher,'') <> IFNULL(TRIM(p_publisher),'')
    ) THEN

        SET v_error_msg = CONCAT(
            v_error_msg,
            'Publisher cannot be modified. Create a new book record with new ISBN. '
        );

    END IF;

END IF;

-- Prevent Language modification
IF p_language IS NOT NULL AND TRIM(p_language) <> '' THEN

    IF EXISTS (
        SELECT 1 FROM books
        WHERE book_id = p_book_id
        AND IFNULL(language,'') <> IFNULL(TRIM(p_language),'')
    ) THEN

        SET v_error_msg = CONCAT(
            v_error_msg,
            'Language cannot be modified. Create a new book record with new ISBN. '
        );

    END IF;

END IF;


-- Prevent ISBN modification
IF p_isbn IS NOT NULL AND TRIM(p_isbn) <> '' THEN

    IF EXISTS (
        SELECT 1 FROM books
        WHERE book_id = p_book_id
          AND IFNULL(isbn,'') <> IFNULL(p_isbn,'')
    ) THEN

        SET v_error_msg = CONCAT(v_error_msg,
            'ISBN cannot be modified. Create a new book record for new ISBN. ');

    END IF;

END IF;



-- Prevent duplicate ISBN during update
IF p_isbn IS NOT NULL AND TRIM(p_isbn) <> '' THEN
    IF EXISTS (
        SELECT 1 FROM books
        WHERE isbn = p_isbn
        AND book_id <> p_book_id
     
    ) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'ISBN already exists for another book. ');
    END IF;
END IF;




    -- Exit if error
    IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
        LEAVE proc_block;
    END IF;
	
IF p_category_name IS NOT NULL THEN

    SET p_category_name = TRIM(p_category_name);

    -- Get category id
    SELECT category_id INTO v_category_id
    FROM categories
    WHERE category_name = p_category_name
    LIMIT 1;

    -- If not exists → create new
    IF v_category_id IS NULL THEN
        INSERT INTO categories(category_name)
        VALUES (p_category_name);

        SET v_category_id = LAST_INSERT_ID();
    END IF;
END IF;


IF EXISTS (
    SELECT 1 
    FROM books
    WHERE book_id = p_book_id
      AND (p_title IS NULL OR title = p_title)
     AND (p_author IS NULL OR author_id = v_author_id)
      AND (p_publisher IS NULL OR IFNULL(publisher,'') = IFNULL(p_publisher,''))
      AND (p_isbn IS NULL OR IFNULL(isbn,'') = IFNULL(p_isbn,''))
      AND (p_language IS NULL OR IFNULL(language,'') = IFNULL(p_language,''))
      AND (p_price IS NULL OR IFNULL(price,0) = IFNULL(p_price,0))
      AND (p_description IS NULL OR IFNULL(description,'') = IFNULL(p_description,''))
      AND (p_category_name IS NULL OR category_id = v_category_id)
      AND (p_cover_image IS NULL OR IFNULL(cover_image,'') = IFNULL(p_cover_image,''))
) THEN

    SELECT 'No changes detected. Book details remain the same.' AS status_message,
           p_book_id AS book_id;

    LEAVE proc_block;

END IF;






    -- Update only non-null fields
    UPDATE books
SET
    title = IF(p_title IS NOT NULL, TRIM(p_title), title),
    author_id = v_author_id,
    price = IF(p_price IS NOT NULL, p_price, price),
    description = IF(p_description IS NOT NULL, p_description, description),
    category_id = IF(p_category_name IS NOT NULL, v_category_id, category_id),
    cover_image = IF(p_cover_image IS NOT NULL, p_cover_image, cover_image)
WHERE book_id = p_book_id;

    SELECT 
        'Book updated successfully.' AS status_message,
        p_book_id AS book_id;

END $$

DELIMITER ;use astra_lms;
DELIMITER $$

DROP PROCEDURE IF EXISTS update_book_details $$

CREATE PROCEDURE update_book_details( 
    IN p_logged_user_id INT,
    IN p_book_id INT,
    IN p_title VARCHAR(255),
    IN p_author VARCHAR(150),
    IN p_publisher VARCHAR(150),
    IN p_isbn VARCHAR(20),
    IN p_language VARCHAR(50),
    IN p_price DECIMAL(10,2),
    IN p_description TEXT,
	IN p_category_name VARCHAR(100),
    IN p_cover_image VARCHAR(255)
)
proc_block: BEGIN

    DECLARE v_error_msg TEXT DEFAULT '';
	DECLARE v_category_id INT;
	DECLARE v_author_id INT;
	DECLARE v_existing_author_id INT;
	
DECLARE v_role_name VARCHAR(50);

SELECT r.role_name INTO v_role_name
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.user_id = p_logged_user_id
  AND u.is_active = TRUE
LIMIT 1;

-- User not found or inactive
IF v_role_name IS NULL THEN
    SELECT 'Unauthorized access. Invalid or inactive user.' AS message;
    LEAVE proc_block;
END IF;

-- Admin check
IF v_role_name <> 'admin' THEN
    SELECT 'Access denied. Only admin can perform this action.' AS message;
    LEAVE proc_block;
END IF;

	
	-- Trim inputs
SET p_title = TRIM(p_title);
SET p_author = TRIM(p_author);
SET p_publisher = TRIM(p_publisher);
SET p_isbn = TRIM(p_isbn);
SET p_language = TRIM(p_language);

 
    
 

-- Title validation
IF p_title IS NOT NULL THEN
    IF p_title = '' OR p_title REGEXP '^[0-9]+$' THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Title invalid :- ', p_title, '. ');
    END IF;
END IF;


-- Publisher validation
IF p_publisher IS NOT NULL 
   AND p_publisher REGEXP '^[0-9]+$' THEN
    SET v_error_msg = CONCAT(v_error_msg,
        'Publisher invalid :- ', p_publisher, '. ');
END IF;

-- Language validation
IF p_language IS NOT NULL 
   AND p_language REGEXP '^[0-9]+$' THEN
    SET v_error_msg = CONCAT(v_error_msg,
        'Language invalid :- ', p_language, '. ');
END IF;

-- Price validation
IF p_price IS NOT NULL AND p_price < 0 THEN
    SET v_error_msg = CONCAT(v_error_msg,
        'Price invalid :- ', p_price, '. ');
END IF;

-- ISBN validation
IF p_isbn IS NOT NULL AND p_isbn <> '' THEN

    SET p_isbn = REPLACE(p_isbn, '-', '');

    IF LENGTH(p_isbn) NOT IN (10,13)
       OR (LENGTH(p_isbn)=10 AND p_isbn NOT REGEXP '^[0-9]{9}[0-9Xx]$')
       OR (LENGTH(p_isbn)=13 AND p_isbn NOT REGEXP '^[0-9]{13}$') THEN

        SET v_error_msg = CONCAT(v_error_msg,
            'ISBN invalid :- ', p_isbn, '. ');
    END IF;

END IF;

    -- Validate book id
    IF p_book_id IS NULL THEN
        SET v_error_msg = 'Book ID is required. ';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM books WHERE book_id = p_book_id
    ) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Book not found. ');
    END IF;

-- AUTHOR IMMUTABLE UPDATE LOGIC


-- Get existing author of the book
SELECT author_id INTO v_existing_author_id
FROM books
WHERE book_id = p_book_id;

-- If author is NULL or empty → keep existing author
IF p_author IS NULL OR TRIM(p_author) = '' THEN

    SET v_author_id = v_existing_author_id;

ELSE

    -- Get author_id from authors table
    SELECT author_id INTO v_author_id
    FROM authors
    WHERE author_name = TRIM(p_author)
    LIMIT 1;

    -- Author does not exist
    IF v_author_id IS NULL THEN
        SET v_error_msg = CONCAT(
            v_error_msg,
            'Author does not exist. '
        );
    END IF;

    -- If author exists but different → reject
    IF v_author_id IS NOT NULL 
       AND v_author_id <> v_existing_author_id THEN

        SET v_error_msg = CONCAT(
            v_error_msg,
            'Author cannot be modified. Insert a new book instead. '
        );

    END IF;

END IF;

-- Prevent Publisher modification
IF p_publisher IS NOT NULL AND TRIM(p_publisher) <> '' THEN

    IF EXISTS (
        SELECT 1 FROM books
        WHERE book_id = p_book_id
        AND IFNULL(publisher,'') <> IFNULL(TRIM(p_publisher),'')
    ) THEN

        SET v_error_msg = CONCAT(
            v_error_msg,
            'Publisher cannot be modified. Create a new book record with new ISBN. '
        );

    END IF;

END IF;

-- Prevent Language modification
IF p_language IS NOT NULL AND TRIM(p_language) <> '' THEN

    IF EXISTS (
        SELECT 1 FROM books
        WHERE book_id = p_book_id
        AND IFNULL(language,'') <> IFNULL(TRIM(p_language),'')
    ) THEN

        SET v_error_msg = CONCAT(
            v_error_msg,
            'Language cannot be modified. Create a new book record with new ISBN. '
        );

    END IF;

END IF;


-- Prevent ISBN modification
IF p_isbn IS NOT NULL AND TRIM(p_isbn) <> '' THEN

    IF EXISTS (
        SELECT 1 FROM books
        WHERE book_id = p_book_id
          AND IFNULL(isbn,'') <> IFNULL(p_isbn,'')
    ) THEN

        SET v_error_msg = CONCAT(v_error_msg,
            'ISBN cannot be modified. Create a new book record for new ISBN. ');

    END IF;

END IF;



-- Prevent duplicate ISBN during update
IF p_isbn IS NOT NULL AND TRIM(p_isbn) <> '' THEN
    IF EXISTS (
        SELECT 1 FROM books
        WHERE isbn = p_isbn
        AND book_id <> p_book_id
     
    ) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'ISBN already exists for another book. ');
    END IF;
END IF;




    -- Exit if error
    IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
        LEAVE proc_block;
    END IF;
	
IF p_category_name IS NOT NULL THEN

    SET p_category_name = TRIM(p_category_name);

    -- Get category id
    SELECT category_id INTO v_category_id
    FROM categories
    WHERE category_name = p_category_name
    LIMIT 1;

    -- If not exists → create new
    IF v_category_id IS NULL THEN
        INSERT INTO categories(category_name)
        VALUES (p_category_name);

        SET v_category_id = LAST_INSERT_ID();
    END IF;
END IF;


IF EXISTS (
    SELECT 1 
    FROM books
    WHERE book_id = p_book_id
      AND (p_title IS NULL OR title = p_title)
      AND (p_price IS NULL OR IFNULL(price,0) = IFNULL(p_price,0))
      AND (p_description IS NULL OR IFNULL(description,'') = IFNULL(p_description,''))
      AND (p_category_name IS NULL OR category_id = v_category_id)
      AND (p_cover_image IS NULL OR IFNULL(cover_image,'') = IFNULL(p_cover_image,''))
) THEN

    SELECT 'No changes detected. Book details remain the same.' AS status_message,
           p_book_id AS book_id;

    LEAVE proc_block;

END IF;






    -- Update only non-null fields
    UPDATE books
SET
    title = IF(p_title IS NOT NULL AND TRIM(p_title) <> '', TRIM(p_title), title),

    author_id = v_author_id,

    price = IF(p_price IS NOT NULL, p_price, price),

    description = IF(p_description IS NOT NULL AND TRIM(p_description) <> '', 
                     p_description, 
                     description),

    category_id = IF(p_category_name IS NOT NULL AND TRIM(p_category_name) <> '', 
                     v_category_id, 
                     category_id),

    cover_image = IF(p_cover_image IS NOT NULL AND TRIM(p_cover_image) <> '', 
                     p_cover_image, 
                     cover_image)

WHERE book_id = p_book_id;
    SELECT 
        'Book updated successfully.' AS status_message,
        p_book_id AS book_id;

END $$

DELIMITER ;