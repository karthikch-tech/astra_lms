use astra_lms;

DELIMITER $$

DROP PROCEDURE IF EXISTS validate_password_strength $$

CREATE PROCEDURE validate_password_strength(
    IN p_password VARCHAR(100),
    OUT p_status_code INT,
    OUT p_message TEXT
)
proc_block: BEGIN

    DECLARE v_error_msg TEXT DEFAULT '';

    SET p_password = TRIM(p_password);

    -- Required check
    IF p_password IS NULL OR p_password = '' THEN
        SET v_error_msg = 'Password cannot be empty. ';
    END IF;

    -- Minimum length
    IF LENGTH(p_password) < 8 THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Minimum 8 characters required. ', p_password);
    END IF;

    -- Uppercase
    IF p_password NOT REGEXP '[A-Z]' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Must contain uppercase letter. ', p_password);
    END IF;

    -- Lowercase
    IF p_password NOT REGEXP '[a-z]' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Must contain lowercase letter. ', p_password);
    END IF;

    -- Number
    IF p_password NOT REGEXP '[0-9]' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Must contain number. ' , p_password);
    END IF;

    -- Special character (stronger security)
    IF p_password NOT REGEXP '[^A-Za-z0-9]' THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Must contain special character. ' , p_password);
    END IF;

    -- Block common passwords
    IF LOWER(p_password) IN (
        '1234','12345','123456','12345678',
        'password','admin','admin123',
        'qwerty','111111','000000'
    ) THEN
        SET v_error_msg = CONCAT(v_error_msg, 'Common passwords are not allowed. ' , p_password);
    END IF;

    -- Final decision
    IF v_error_msg <> '' THEN
        SET p_status_code = 0;
        SET p_message = v_error_msg;
    ELSE
        SET p_status_code = 1;
        SET p_message = concat('Strong password', p_password);
    END IF;

END $$

DELIMITER ;