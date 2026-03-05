use astra_lms;
DELIMITER $$

DROP PROCEDURE IF EXISTS insert_book_details $$

CREATE PROCEDURE insert_book_details(
	IN p_logged_user_id INT, 
    IN p_title VARCHAR(255),
    IN p_author VARCHAR(150),
    IN p_publisher VARCHAR(150),
    IN p_isbn VARCHAR(20),
    IN p_language VARCHAR(50),
    IN p_price DECIMAL(10,2),
    IN p_description TEXT,
    IN p_category VARCHAR(100),
    IN p_cover_image VARCHAR(255)
)
proc_end: BEGIN

    DECLARE v_book_id INT;
    DECLARE v_category_id INT;
    DECLARE v_error_msg TEXT DEFAULT '';
    DECLARE v_author_id INT;
	
DECLARE v_role_name VARCHAR(50);
-- role check
SELECT r.role_name INTO v_role_name
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.user_id = p_logged_user_id
  AND u.is_active = TRUE
LIMIT 1;

-- User not found or inactive
IF v_role_name IS NULL THEN
    SELECT 'Unauthorized access. Invalid or inactive user.' AS message;
    LEAVE proc_end;
END IF;

-- Admin check
IF v_role_name <> 'admin' THEN
    SELECT 'Access denied. Only admin can perform this action.' AS message;
    LEAVE proc_end;
END IF;
    -- Normalize
    SET p_title = TRIM(p_title);
    SET p_author = TRIM(p_author);
    SET p_publisher = TRIM(p_publisher);
    SET p_isbn = TRIM(p_isbn);
    SET p_language = TRIM(p_language);
    SET p_category = TRIM(p_category);

    -- Title validation (production level)
IF p_title IS NULL OR TRIM(p_title) = '' THEN
    SET v_error_msg = CONCAT(
        v_error_msg,
        'Title is required. '
    );

ELSEIF p_title NOT REGEXP '^[A-Za-z0-9][A-Za-z0-9 .,&''()/:+-]*$' THEN
    SET v_error_msg = CONCAT(
        v_error_msg,
        'Title contains invalid characters. ', p_title,';'
    );

ELSEIF p_title NOT REGEXP '[A-Za-z]' THEN
    SET v_error_msg = CONCAT(
        v_error_msg,
        'Title must contain at least one alphabet character. ',';'
    );
END IF;

-- Author validation
IF p_author IS NULL OR TRIM(p_author) = '' THEN
    SET v_error_msg = CONCAT(v_error_msg, 'Author name is required and must be text. ',';');
ELSEIF p_author REGEXP '^[0-9]+$' THEN
    SET v_error_msg = CONCAT(v_error_msg, 'Author name must contain characters, not only numbers. ',';');
END IF;


-- Publisher validation (professional level)
IF p_publisher IS NOT NULL AND TRIM(p_publisher) <> '' THEN

    -- Allow letters, numbers, space and common publishing symbols
    IF p_publisher NOT REGEXP '^[A-Za-z0-9][A-Za-z0-9 .,&''()/-]*$' THEN
        SET v_error_msg = CONCAT(
            v_error_msg,
            'Publisher contains invalid characters. '
        );
    END IF;

END IF;
-- Language validation
IF p_language IS NOT NULL AND p_language <> '' 
   AND p_language REGEXP '^[0-9]+$' THEN
    SET v_error_msg = CONCAT(v_error_msg, 'Language must be valid text. ');
END IF;

-- Description validation
IF p_description IS NOT NULL AND TRIM(p_description) <> '' THEN

    -- Should contain at least one alphabet character
    IF p_description NOT REGEXP '[A-Za-z]' THEN
        SET v_error_msg = CONCAT(
            v_error_msg,
            'Description must contain at least one alphabet character. '
        );
    END IF;

END IF;

-- Price validation
IF p_price IS NULL THEN
    SET v_error_msg = CONCAT(v_error_msg, 'Price is required. ');
ELSEIF p_price < 0 THEN
    SET v_error_msg = CONCAT(v_error_msg, 'Price cannot be negative. ');
ELSEIF p_price > 5000 THEN
    SET v_error_msg = CONCAT(v_error_msg, 'Price cannot exceed 5000. ');
END IF;

-- Convert empty values to NULL
    IF p_isbn = '' THEN
        SET p_isbn = NULL;
    END IF;

IF p_isbn IS NOT NULL AND p_isbn <> '' THEN

    -- Remove hyphens
    SET p_isbn = REPLACE(p_isbn, '-', '');

    -- Check length
    IF LENGTH(p_isbn) NOT IN (10,13) THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'ISBN must be 10 or 13 digits. ');
    ELSEIF LENGTH(p_isbn) = 10 
        AND p_isbn NOT REGEXP '^[0-9]{9}[0-9Xx]$' THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Invalid ISBN-10 format. ');
    ELSEIF LENGTH(p_isbn) = 13 
        AND p_isbn NOT REGEXP '^[0-9]{13}$' THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Invalid ISBN-13 format. ');
    END IF;

END IF;





    -- If errors exist → return and exit
   
   IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
        LEAVE proc_end;
    END IF;

    
	
-- ISBN Validation (Optional)


-- Check if category exists
SELECT category_id INTO v_category_id
FROM categories
WHERE category_name = p_category
LIMIT 1;

IF v_category_id IS NULL THEN
    INSERT INTO categories(category_name)
    VALUES (p_category);

    SET v_category_id = LAST_INSERT_ID();
END IF;



SELECT author_id INTO v_author_id
FROM authors
WHERE author_name = p_author
LIMIT 1;

-- If author not exists → insert
IF v_author_id IS NULL THEN
    INSERT INTO authors(author_name)
    VALUES (p_author);

    SET v_author_id = LAST_INSERT_ID();
END IF;

  -- Check duplicate book by ISBN OR full details
SELECT book_id INTO v_book_id
FROM books
WHERE 
      (p_isbn IS NOT NULL AND isbn = p_isbn)
   OR (
        title = p_title
        AND author_id = v_author_id
        AND IFNULL(publisher,'') = IFNULL(p_publisher,'')
        AND IFNULL(language,'') = IFNULL(p_language,'')
        AND IFNULL(price,0) = IFNULL(p_price,0)
        AND IFNULL(description,'') = IFNULL(p_description,'')
        AND category_id = v_category_id
		
		
      )
LIMIT 1;

IF v_book_id IS NOT NULL THEN
    SET v_error_msg = CONCAT(
        v_error_msg,
        'Book already exists. Please add copies instead. ID :- ',
        v_book_id,
        '. Title: ',
        p_title
    );


END IF;

IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
        LEAVE proc_end;
    END IF;

    IF p_publisher = '' THEN
        SET p_publisher = NULL;
    END IF;




    -- Insert book
    INSERT INTO books(
        title,
        author_id,
        publisher,
        isbn,
        language,
        price,
        description,
        category_id,
        cover_image
    )
    VALUES(
        p_title,
        v_author_id ,
        p_publisher,
        p_isbn,
        p_language,
        p_price,
        p_description,
        v_category_id,
        p_cover_image
    );

    SET v_book_id = LAST_INSERT_ID();

    SELECT 'Book inserted successfully' AS message,
           v_book_id AS book_id;

END $$

DELIMITER ;