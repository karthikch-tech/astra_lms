USE astra_lms;
DELIMITER $$

DROP TRIGGER IF EXISTS trg_after_insert_book_copy $$


CREATE TRIGGER trg_after_insert_book_copy
AFTER INSERT ON book_copies
FOR EACH ROW
BEGIN

    UPDATE books
    SET number_of_copies = IFNULL(number_of_copies,0) + 1
    WHERE book_id = NEW.book_id;

END $$

DELIMITER ;

