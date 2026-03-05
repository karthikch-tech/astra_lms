USE astra_lms;

CREATE OR REPLACE VIEW vw_book_availability AS
SELECT 
    b.book_id,
    b.title,

    COUNT(bc.copy_id) AS total_copies,

    COALESCE(SUM(CASE 
        WHEN bc.status = 'available' THEN 1 
        ELSE 0 
    END),0) AS available_copies,

    COALESCE(SUM(CASE 
        WHEN bc.status = 'unavailable' THEN 1 
        ELSE 0 
    END),0) AS unavailable_copies

FROM books b
LEFT JOIN book_copies bc 
    ON b.book_id = bc.book_id
GROUP BY b.book_id, b.title;