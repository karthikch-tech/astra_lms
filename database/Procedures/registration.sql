USE astra_lms;
DELIMITER $$

DROP PROCEDURE IF EXISTS insert_user $$

CREATE PROCEDURE insert_user(
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(100),
    IN p_confirm_password VARCHAR(100)
)
userBlock: BEGIN

    DECLARE v_error_msg TEXT DEFAULT '';
    DECLARE v_password_hash VARCHAR(255);
    DECLARE v_role_id INT;
	DECLARE v_email_status INT;
	DECLARE v_email_message VARCHAR(255);
	DECLARE v_pass_status INT;
	DECLARE v_pass_message TEXT;
	DECLARE v_full_name VARCHAR(150);

    -- Normalize inputs
    SET p_first_name = TRIM(p_first_name);
    SET p_last_name = TRIM(p_last_name);
    SET p_username = LOWER(TRIM(p_username));
    SET p_email = LOWER(TRIM(p_email));
    SET p_password = TRIM(p_password);
    SET p_confirm_password = TRIM(p_confirm_password);

    -- First Name Validation
    IF p_first_name IS NULL OR p_first_name = '' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'First name is required. ');
    ELSEIF p_first_name NOT REGEXP '^[A-Za-z]+$' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'First name must contain letters only. ', p_first_name,'; ');
    END IF;

    -- Last Name Validation
  IF p_last_name IS NOT NULL AND TRIM(p_last_name) <> '' THEN
    
    SET p_last_name = TRIM(p_last_name);

    IF p_last_name NOT REGEXP '^[A-Za-z]+$' THEN
        SET v_error_msg = CONCAT(v_error_msg, 
            'Last name must contain letters only. ',p_last_name, '; ');
    END IF;

ELSE
    -- Convert empty string to NULL
    SET p_last_name = NULL;
END IF;

-- Combine first and last name
IF p_last_name IS NULL OR p_last_name = '' THEN
    SET v_full_name = p_first_name;
ELSE
    SET v_full_name = CONCAT(p_first_name, ' ', p_last_name);
END IF;


    -- Username Validation
    IF p_username IS NULL OR p_username = '' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Username is required. ');
    ELSEIF p_username NOT REGEXP '^[a-z0-9_]+$' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Username must contain lowercase letters, numbers or underscore only. ', p_username,' ; ');
    END IF;

    -- Duplicate Username
    IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Username already exists. ', p_username , '; ');
    END IF;

    -- Email Validation
   CALL validate_email(
    p_email,
    v_email_message,
    v_email_status
);

IF v_email_status = 0 THEN
    SET v_error_msg = CONCAT(v_error_msg, v_email_message,',', p_email ,'; ');
END IF;
    -- Duplicate Email
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Email already exists.',p_email,' ; ');
    END IF;

    -- Password Validation
      -- Password Validation (centralized procedure)
    CALL validate_password_strength(
        p_password,
        v_pass_status,
        v_pass_message
    );

    IF v_pass_status = 0 THEN
        SET v_error_msg = CONCAT(v_error_msg, v_pass_message, ' ; ');
    END IF;

    -- Confirm Password Check
    IF p_password <> p_confirm_password THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Passwords do not match. ','; ');
    END IF;

    -- Hash password (AFTER validation)
    CALL encrypt_password(
        p_password,
        v_password_hash
    );

    -- Prevent password reuse across users (compare HASH, not raw password)
    IF EXISTS (
        SELECT 1
        FROM users
        WHERE password_hash = v_password_hash
    ) THEN
        SET v_error_msg = CONCAT(
            v_error_msg,
            'Weak password detected. Please choose a different password. ',' ; '
        );
    END IF;
	
    -- Always assign USER role automatically
    SELECT role_id INTO v_role_id
    FROM roles
    WHERE role_name = 'user'
    LIMIT 1;

    IF v_role_id IS NULL THEN
        SET v_error_msg = CONCAT(v_error_msg, 'User role not configured in roles table. ','; ');
    END IF;

    -- Exit if errors
    IF v_error_msg <> '' THEN
        SELECT v_error_msg AS message;
        LEAVE userBlock;
    END IF;

 

    -- Insert User
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

    SELECT 
        'User registered successfully.' AS status_message,
		v_full_name AS Name,
        p_username AS username,
        p_email AS email,
        CURDATE() AS created_date;

END $$

DELIMITER ;