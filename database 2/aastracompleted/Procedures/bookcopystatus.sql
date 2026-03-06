USE astra_lms;
DELIMITER $$

DROP PROCEDURE IF EXISTS update_book_copy_status $$

CREATE PROCEDURE update_book_copy_status(
    IN p_logged_user_id INT,
	IN p_copy_id INT,
    IN p_status VARCHAR(20)
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
    SET p_status = LOWER(TRIM(p_status));

    -- Validate copy id
    IF p_copy_id IS NULL THEN
        SET v_error_msg = 'Copy ID is required. ';
    END IF;

    -- Validate status
    IF p_status NOT IN ('available','unavailable') THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Status must be available or unavailable. ');
    END IF;

    -- Check if copy exists
    IF NOT EXISTS (
        SELECT 1 FROM book_copies 
        WHERE copy_id = p_copy_id
          
    ) THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Copy ID not found. ');
    END IF;

    -- If error → exit
    IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
        LEAVE proc_block;
    END IF;

    -- Update status
    UPDATE book_copies
    SET status = p_status
    WHERE copy_id = p_copy_id;

    SELECT 
        'Copy status updated successfully.' AS message,
        p_copy_id AS copy_id,
        p_status AS new_status,
        CURDATE() AS updated_date;

END $$

DELIMITER ;