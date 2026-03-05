USE astra_lms;
DELIMITER $$

DROP PROCEDURE IF EXISTS delete_book_copy $$

CREATE PROCEDURE delete_book_copy(
    IN p_admin_id INT,
    IN p_book_id INT,
    IN p_copy_id INT
)
proc_block: BEGIN

    DECLARE v_error_msg TEXT DEFAULT '';
    DECLARE v_role_name VARCHAR(50);

    -- Check admin role
    SELECT r.role_name INTO v_role_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = p_admin_id
      AND u.is_active = TRUE
    LIMIT 1;

    IF v_role_name IS NULL THEN
        SET v_error_msg = 'Invalid or inactive user. ';
    ELSEIF v_role_name <> 'admin' THEN
        SET v_error_msg = 'Access denied. Only admin can delete copies. ';
    END IF;

    -- Check copy exists for that book
    IF NOT EXISTS (
        SELECT 1 
        FROM book_copies 
        WHERE copy_id = p_copy_id
          AND book_id = p_book_id
    ) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Copy not found for this book. ');
    END IF;

    -- Stop if error
    IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
        LEAVE proc_block;
    END IF;

    -- Delete copy
    DELETE FROM book_copies
    WHERE copy_id = p_copy_id
      AND book_id = p_book_id;

    SELECT 'Book copy deleted successfully.' AS message;

END $$

DELIMITER ;