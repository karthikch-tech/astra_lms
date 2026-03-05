USE astra_lms;

DROP PROCEDURE IF EXISTS validate_email;

DELIMITER $$

CREATE PROCEDURE validate_email(
    IN email_in VARCHAR(100),
    OUT status_msg VARCHAR(255),
    OUT status_code INT
)
emailBlock: 
BEGIN
    DECLARE v_email VARCHAR(100);

    -- Trim input safely
    SET v_email = TRIM(email_in);

    -- Check NULL or empty
    IF v_email IS NULL OR v_email = '' THEN
        SET status_msg = 'Email cannot be empty.';
        SET status_code = 0;
        LEAVE emailBlock;
    END IF;

    -- Validate format
    IF v_email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SET status_msg = 'Invalid email format!';
        SET status_code = 0;
        LEAVE emailBlock;
    END IF;

    -- If everything correct
    SET status_msg = 'Valid email.';
    SET status_code = 1;

END $$

DELIMITER ;