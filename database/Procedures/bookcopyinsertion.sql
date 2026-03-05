use astra_lms;
DELIMITER $$

DROP PROCEDURE IF EXISTS add_book_copy $$

CREATE PROCEDURE add_book_copy(
	IN p_logged_user_id INT,
    IN p_book_id INT,
    IN p_copy_id VARCHAR(50)
)
proc_block: BEGIN

    DECLARE v_error_msg TEXT DEFAULT '';

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
    -- Normalize
    SET p_copy_id = TRIM(p_copy_id);

    -- Validation: Book ID required
    IF p_book_id IS NULL THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Book ID is required. ');
    END IF;

    -- Validation: Copy ID required
    IF p_copy_id IS NULL OR p_copy_id = '' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Copy ID cannot be empty. ');
    END IF;

    -- Check if book exists
    IF NOT EXISTS (SELECT 1 FROM books WHERE book_id = p_book_id) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Invalid Book ID. ');
    END IF;

    -- Check duplicate copy_id
    IF EXISTS (SELECT 1 FROM book_copies WHERE copy_id = p_copy_id) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Copy ID already exists. ');
    END IF;

    -- If any errors → return and exit
    IF v_error_msg <> '' THEN
        SELECT v_error_msg AS error_message;
        LEAVE proc_block;
    END IF;

    -- Insert copy
    INSERT INTO book_copies(
        copy_id,
        book_id,
        status
    )
    VALUES(
        p_copy_id,
        p_book_id,
        'available'
    );

    SELECT 'Book copy added successfully' AS message,
           p_copy_id AS copy_id;

END $$

DELIMITER ;