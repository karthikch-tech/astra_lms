USE astra_lms;
DELIMITER $$

DROP PROCEDURE IF EXISTS update_admin_profile $$

CREATE PROCEDURE update_admin_profile(
    IN p_email VARCHAR(100),
    IN p_current_password VARCHAR(100),

    IN p_new_first_name VARCHAR(50),
    IN p_new_last_name VARCHAR(50),
    IN p_new_username VARCHAR(50),
    IN p_new_email VARCHAR(100),
    IN p_new_password VARCHAR(100)
)
adminBlock: BEGIN

    DECLARE v_user_id INT;
    DECLARE v_role_name VARCHAR(50);
    DECLARE v_stored_hash VARCHAR(255);
    DECLARE v_entered_hash VARCHAR(255);
    DECLARE v_new_hash VARCHAR(255);
    DECLARE v_error_msg TEXT DEFAULT '';
	DECLARE v_changes INT DEFAULT 0;
	DECLARE v_full_name VARCHAR(150);
	DECLARE v_current_full_name VARCHAR(150);
	DECLARE v_current_username VARCHAR(120);
	DECLARE v_current_email VARCHAR(150);

    DECLARE v_email_status INT;
    DECLARE v_email_message VARCHAR(255);
    DECLARE v_pass_status INT;
    DECLARE v_pass_message TEXT;

    -- Normalize
    SET p_email = LOWER(TRIM(p_email));
    SET p_current_password = TRIM(p_current_password);

    -- Get admin user
    SELECT u.user_id, u.password_hash, r.role_name
    INTO v_user_id, v_stored_hash, v_role_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.email = p_email
    LIMIT 1;

    IF v_user_id IS NULL THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Admin not found. ');
    END IF;

    -- Check role
    IF v_user_id IS NOT NULL AND v_role_name <> 'admin' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Access denied. Not an admin account. ');
    END IF;

    -- Verify password
    IF v_user_id IS NOT NULL THEN
        CALL encrypt_password(p_current_password, v_entered_hash);

        IF v_entered_hash <> v_stored_hash THEN
            SET v_error_msg = CONCAT(v_error_msg, 'Incorrect current password. ');
        END IF;
    END IF;
	
	SELECT full_name INTO v_current_full_name
FROM users
WHERE user_id = v_user_id;

SELECT username, email
INTO v_current_username, v_current_email
FROM users
WHERE user_id = v_user_id;

    /* =============================
       VALIDATIONS
    ============================= */

    -- Username
    IF p_new_username IS NOT NULL AND TRIM(p_new_username) <> '' THEN
        SET p_new_username = LOWER(TRIM(p_new_username));

        IF EXISTS (
            SELECT 1 FROM users
            WHERE username = p_new_username
            AND user_id <> v_user_id
        ) THEN
            SET v_error_msg = CONCAT(v_error_msg, 'Username already exists. ');
        END IF;
    END IF;

    -- Email
    IF p_new_email IS NOT NULL AND TRIM(p_new_email) <> '' THEN
        SET p_new_email = LOWER(TRIM(p_new_email));

        CALL validate_email(p_new_email, v_email_message, v_email_status);

        IF v_email_status = 0 THEN
            SET v_error_msg = CONCAT(v_error_msg, v_email_message, ' ');
        ELSEIF EXISTS (
            SELECT 1 FROM users
            WHERE email = p_new_email
            AND user_id <> v_user_id
        ) THEN
            SET v_error_msg = CONCAT(v_error_msg, 'Email already exists. ');
        END IF;
    END IF;

    -- Password
    IF p_new_password IS NOT NULL AND TRIM(p_new_password) <> '' THEN

        CALL validate_password_strength(
            p_new_password,
            v_pass_status,
            v_pass_message
        );

        IF v_pass_status = 0 THEN
            SET v_error_msg = CONCAT(v_error_msg, v_pass_message, ' ');
        ELSE
            CALL encrypt_password(p_new_password, v_new_hash);

            IF EXISTS (
                SELECT 1 FROM users
                WHERE password_hash = v_new_hash
            ) THEN
                SET v_error_msg = CONCAT(
                    v_error_msg,
                    'Password already used by another user. '
                );
            END IF;
        END IF;

    END IF;


-- Check if no new values provided
IF
(
   (p_new_first_name IS NULL OR TRIM(p_new_first_name) = ''
        OR SUBSTRING_INDEX(v_current_full_name,' ',1) = TRIM(p_new_first_name))
AND
   (p_new_last_name IS NULL OR TRIM(p_new_last_name) = ''
        OR SUBSTRING_INDEX(v_current_full_name,' ',-1) = TRIM(p_new_last_name))
AND
   (p_new_username IS NULL OR TRIM(p_new_username) = ''
        OR v_current_username = LOWER(TRIM(p_new_username)))
AND
   (p_new_email IS NULL OR TRIM(p_new_email) = ''
        OR v_current_email = LOWER(TRIM(p_new_email)))
AND
   (p_new_password IS NULL OR TRIM(p_new_password) = '')
)
THEN
   SET v_error_msg = CONCAT(
        v_error_msg,
        'All details are same. Data not updated. '
   );
END IF;
    -- Stop if any error
    IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
        LEAVE adminBlock;
    END IF;

    /* =============================
       PERFORM UPDATES
    ============================= */

  -- Update Full Name (First name mandatory, Last optional)
IF p_new_first_name IS NOT NULL AND TRIM(p_new_first_name) <> '' THEN

    IF p_new_last_name IS NOT NULL AND TRIM(p_new_last_name) <> '' THEN
        SET v_full_name = CONCAT(
            TRIM(p_new_first_name),
            ' ',
            TRIM(p_new_last_name)
        );
    ELSE
        SET v_full_name = TRIM(p_new_first_name);
    END IF;

    UPDATE users
    SET full_name = v_full_name
    WHERE user_id = v_user_id;

END IF;

    IF p_new_username IS NOT NULL AND TRIM(p_new_username) <> '' THEN
        UPDATE users
        SET username = p_new_username
        WHERE user_id = v_user_id;
    END IF;

    IF p_new_email IS NOT NULL AND TRIM(p_new_email) <> '' THEN
        UPDATE users
        SET email = p_new_email
        WHERE user_id = v_user_id;
    END IF;

    IF p_new_password IS NOT NULL AND TRIM(p_new_password) <> '' THEN
        UPDATE users
        SET password_hash = v_new_hash
        WHERE user_id = v_user_id;
    END IF;

    UPDATE users
    SET updated_at = NOW()
    WHERE user_id = v_user_id;

    SELECT 'Admin profile updated successfully.' AS status_message;

END $$

DELIMITER ;