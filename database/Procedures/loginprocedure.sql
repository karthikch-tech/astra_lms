USE astra_lms;

DELIMITER $$

DROP PROCEDURE IF EXISTS login_user $$

CREATE PROCEDURE login_user(
    IN p_identifier VARCHAR(100),  -- username OR email
    IN p_password VARCHAR(100)
)
loginBlock: BEGIN

    DECLARE v_user_id INT DEFAULT NULL;
    DECLARE v_password_hash_db VARCHAR(255);
    DECLARE v_password_hash_input VARCHAR(255);
    DECLARE v_role_name VARCHAR(50);
    DECLARE v_error_msg TEXT DEFAULT '';

    -- Handle SELECT INTO not found
    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_user_id = NULL;

    -- Normalize inputs
    SET p_identifier = LOWER(TRIM(p_identifier));
    SET p_password = TRIM(p_password);

    -- Basic Validation
    IF p_identifier IS NULL OR p_identifier = '' THEN
        SET v_error_msg = CONCAT(v_error_msg, 
            'Username or email is required. ');
    END IF;

    IF p_password IS NULL OR p_password = '' THEN
        SET v_error_msg = CONCAT(v_error_msg, 
            'Password is required. ');
    END IF;

    -- Only continue if no basic validation errors
    IF v_error_msg = '' THEN

        -- Fetch user
        SELECT u.user_id, u.password_hash, r.role_name
        INTO v_user_id, v_password_hash_db, v_role_name
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE (u.username = p_identifier OR u.email = p_identifier)
        LIMIT 1;

        -- User existence check
        IF v_user_id IS NULL THEN
            SET v_error_msg = CONCAT(v_error_msg, 
                'Invalid username/email or password. ');
        ELSE
            -- Hash input password
            CALL encrypt_password(
                p_password,
                v_password_hash_input
            );

            -- Password check
            IF v_password_hash_db <> v_password_hash_input THEN
                SET v_error_msg = CONCAT(v_error_msg, 
                    'Invalid username/email or password. ');
            END IF;
        END IF;

    END IF;

    -- Final Decision (Single Exit Point)

    IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
    ELSE
        SELECT 
            v_user_id AS user_id,
            v_role_name AS role,
            'Login successful.' AS message;
    END IF;

END $$

DELIMITER ;