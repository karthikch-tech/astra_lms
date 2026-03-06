use astra_lms;
DELIMITER $$

DROP PROCEDURE IF EXISTS encrypt_password $$

CREATE PROCEDURE encrypt_password(
    IN p_password VARCHAR(100),
    OUT p_hash VARCHAR(255)
)
BEGIN
    SET p_hash = SHA2(TRIM(p_password), 256);
END $$

DELIMITER ;