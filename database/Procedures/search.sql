USE astra_lms;
DELIMITER $$

DROP PROCEDURE IF EXISTS multi_search $$

CREATE PROCEDURE multi_search(
    IN p_text VARCHAR(255)
)
BEGIN

    SET p_text = TRIM(p_text);

    SELECT 
        b.book_id,
        b.title,
        a.author_name,
        c.category_name,
        COUNT(bc.copy_id) AS total_copies,
        SUM(
            CASE 
                WHEN bc.status = 'available' 
                THEN 1 
                ELSE 0 
            END
        ) AS available_copies
    FROM books b
    LEFT JOIN authors a 
        ON b.author_id = a.author_id
    LEFT JOIN categories c 
        ON b.category_id = c.category_id
    LEFT JOIN book_copies bc 
        ON b.book_id = bc.book_id
    WHERE 
        b.title LIKE CONCAT('%', p_text, '%')
        OR a.author_name LIKE CONCAT('%', p_text, '%')
        OR c.category_name LIKE CONCAT('%', p_text, '%')
        OR bc.copy_id LIKE CONCAT('%', p_text, '%')
    GROUP BY b.book_id;

END $$

DELIMITER ;