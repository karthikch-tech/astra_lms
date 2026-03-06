USE astra_lms;

DELIMITER $$

DROP PROCEDURE IF EXISTS login_admin $$

CREATE PROCEDURE login_admin(
    IN p_identifier VARCHAR(100),
    IN p_password VARCHAR(100)
)
adminLoginBlock: BEGIN

    DECLARE v_user_id INT DEFAULT NULL;
    DECLARE v_password_hash_db VARCHAR(255);
    DECLARE v_password_hash_input VARCHAR(255);
    DECLARE v_role_name VARCHAR(50);
    DECLARE v_error_msg TEXT DEFAULT '';

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_user_id = NULL;

    -- Normalize
    SET p_identifier = LOWER(TRIM(p_identifier));
    SET p_password = TRIM(p_password);

    -- Basic validation
    IF p_identifier IS NULL OR p_identifier = '' THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Admin username or email is required. ');
    END IF;

    IF p_password IS NULL OR p_password = '' THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Password is required. ');
    END IF;

    IF v_error_msg = '' THEN

        -- Fetch ONLY admin users
        SELECT u.user_id, u.password_hash, r.role_name
        INTO v_user_id, v_password_hash_db, v_role_name
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE (u.username = p_identifier OR u.email = p_identifier)
          AND r.role_name = 'admin'
          AND u.is_active = TRUE
        LIMIT 1;

        IF v_user_id IS NULL THEN
            SET v_error_msg = CONCAT(v_error_msg,
                'Invalid admin credentials. ');
        ELSE
            -- Hash input password
            CALL encrypt_password(
                p_password,
                v_password_hash_input
            );

            IF v_password_hash_db <> v_password_hash_input THEN
                SET v_error_msg = CONCAT(v_error_msg,
                    'Invalid admin credentials. ');
            END IF;
        END IF;

    END IF;

    -- Final response
    IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
    ELSE
        SELECT 
            v_user_id AS user_id,
            v_role_name AS role,
            'Admin login successful.' AS message;
    END IF;

END $$

DELIMITER ;