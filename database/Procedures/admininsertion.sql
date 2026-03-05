USE astra_lms;

DELIMITER $$

DROP PROCEDURE IF EXISTS insert_admin $$

CREATE PROCEDURE insert_admin(
	IN p_first_name VARCHAR(50),
	IN p_last_name VARCHAR(50),
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(150)
)
adminBlock: BEGIN

    DECLARE v_error_msg TEXT DEFAULT '';
    DECLARE v_password_hash VARCHAR(255);
    DECLARE v_role_id INT;
    DECLARE v_email_status INT;
    DECLARE v_email_message VARCHAR(255);
    DECLARE v_pass_status INT;
    DECLARE v_pass_message TEXT;
	DECLARE v_full_name VARCHAR(150);
	DECLARE v_user_id INT;

    -- Normalize
    SET p_username = LOWER(TRIM(p_username));
    SET p_email = LOWER(TRIM(p_email));
    SET p_password = TRIM(p_password);
	SET p_first_name = TRIM(p_first_name);
    SET p_last_name = TRIM(p_last_name);

    -- First Name validation
    IF p_first_name IS NULL OR p_first_name = '' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'First name is required. ');
    ELSEIF p_first_name NOT REGEXP '^[A-Za-z]+$' THEN
        SET v_error_msg = CONCAT(v_error_msg, 
            'First name must contain letters only. ');
    END IF;

    -- Last Name validation (optional)
    IF p_last_name IS NOT NULL AND p_last_name <> '' THEN
        IF p_last_name NOT REGEXP '^[A-Za-z]+$' THEN
            SET v_error_msg = CONCAT(v_error_msg,
                'Last name must contain letters only. ');
        END IF;
    ELSE
        SET p_last_name = NULL;
    END IF;

    -- Combine full name
    IF p_last_name IS NULL THEN
        SET v_full_name = p_first_name;
    ELSE
        SET v_full_name = CONCAT(p_first_name, ' ', p_last_name);
    END IF;


    -- Username validation
    IF p_username IS NULL OR p_username = '' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Username is required. ');
    ELSEIF p_username NOT REGEXP '^[a-z0-9_]+$' THEN
        SET v_error_msg = CONCAT(v_error_msg, 
            'Username must contain lowercase letters, numbers or underscore only. ');
    END IF;

    -- Duplicate username
    IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Username already exists. ');
    END IF;

    -- Email validation (reuse your procedure)
    CALL validate_email(
        p_email,
        v_email_message,
        v_email_status
    );

    IF v_email_status = 0 THEN
        SET v_error_msg = CONCAT(v_error_msg, v_email_message, ' ');
    END IF;

    -- Duplicate email
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Email already exists. ');
    END IF;

    -- Strong password validation (reuse centralized procedure)
    CALL validate_password_strength(
        p_password,
        v_pass_status,
        v_pass_message
    );

    IF v_pass_status = 0 THEN
        SET v_error_msg = CONCAT(v_error_msg, v_pass_message, ' ');
    END IF;

    -- Extra Admin-Level Password Rule (Minimum 12 chars)
    IF LENGTH(p_password) < 12 THEN
        SET v_error_msg = CONCAT(v_error_msg,
            'Admin password must be at least 12 characters long. ');
    END IF;

    -- Get Admin Role ID
    SELECT role_id INTO v_role_id
    FROM roles
    WHERE role_name = 'admin'
    LIMIT 1;

    IF v_role_id IS NULL THEN
        SET v_error_msg = CONCAT(v_error_msg, 
            'Admin role not configured in roles table. ');
    END IF;

    -- Exit if errors
    IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
		
        LEAVE adminBlock;
    END IF;

    -- Encrypt password
    CALL encrypt_password(
        p_password,
        v_password_hash
    );

    INSERT INTO users(
        full_name,
        username,
        email,
        password_hash,
        role_id
    )
    VALUES(
        v_full_name,
        p_username,
        p_email,
        v_password_hash,
        v_role_id
    );
	
	SET v_user_id = LAST_INSERT_ID();

   SELECT 
    'Admin inserted successfully.' AS status_message,
    v_user_id AS admin_user_id,
    v_full_name AS name,
    p_username AS username,
    p_email AS email,
    CURDATE() AS created_date;
END $$

DELIMITER ;